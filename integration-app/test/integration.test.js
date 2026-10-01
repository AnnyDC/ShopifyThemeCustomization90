import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, acceptEvent, processingResults } from '../src/database.js';
import { verifyWebhook, signWebhook } from '../src/security.js';
import { processNextEvent, transformOrder } from '../src/orders.js';
import { createApplication } from '../src/server.js';
import { ShopifyAdmin } from '../src/shopify.js';

const quiet = { info() {}, warn() {}, error() {} };
const config = { mock: true, shop: 'code-with-anny.myshopify.com', webhookSecret: 'test-signing-secret', inspectionToken: 'test-inspection', crmToken: 'test-crm' };
const order = { id: 1001, name: '#TEST', test: true, currency: 'USD', total_price: '60.00', line_items: [ { id: 1, variant_id: 20, title: 'Bottle', quantity: 1, price: '30.00', properties: [{ name: 'Engraving', value: 'Anny' }] }, { id: 2, variant_id: 20, title: 'Bottle', quantity: 1, price: '30.00', properties: [{ name: 'Engraving', value: 'Sam' }, { name: '_private', value: 'hidden' }] } ] };
const delivery = (payload = order, eventId = 'event-1') => ({ shop: config.shop, topic: 'orders/create', eventId, payload });
const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

test('HMAC checks exact raw bytes and rejects malformed signatures', () => {
  const raw = Buffer.from('{ "id": 1 }'); const signature = signWebhook(raw, config.webhookSecret);
  assert.equal(verifyWebhook(raw, signature, config.webhookSecret), true);
  assert.equal(verifyWebhook(Buffer.from('{"id":1}'), signature, config.webhookSecret), false);
  assert.equal(verifyWebhook(raw, 'bad', config.webhookSecret), false);
});
test('personalization stays attached to each separate order line', () => {
  const transformed = transformOrder(config.shop, order);
  assert.deepEqual(transformed.items.map((item) => item.personalization), [{ Engraving: 'Anny' }, { Engraving: 'Sam' }]);
  assert.equal(transformed.orderKey, `${config.shop}:1001`);
});
test('inbox persists duplicates and pending work across database reopen', () => {
  const folder = mkdtempSync(join(tmpdir(), 'shopify-demo-')); const path = join(folder, 'queue.sqlite');
  let db = openDatabase(path);
  try { assert.equal(acceptEvent(db, delivery()), true); db.close(); db = openDatabase(path); assert.equal(acceptEvent(db, delivery()), false); assert.equal(processingResults(db).events.length, 1); assert.equal(processingResults(db).events[0].status, 'pending'); }
  finally { db.close(); rmSync(folder, { recursive: true, force: true }); }
});
test('retry schedule, dead letter, stale lease, and non-test skip', async () => {
  const db = openDatabase(':memory:');
  try {
    acceptEvent(db, delivery(), 0);
    await processNextEvent(db, config, { now: 100, logger: quiet, fetcher: async () => new Response('', { status: 503 }) });
    assert.equal(processingResults(db).events[0].status, 'pending'); assert.equal(processingResults(db).events[0].attempts, 1);
    assert.equal(await processNextEvent(db, config, { now: 200, logger: quiet }), false);
    db.prepare("UPDATE events SET status='processing',lease_until=0,attempts=5").run();
    await processNextEvent(db, config, { now: 3000, logger: quiet, fetcher: async () => { throw new Error('offline'); } });
    assert.equal(processingResults(db).events[0].status, 'dead');
    acceptEvent(db, delivery({ ...order, id: 1002, test: false }, 'event-2'));
    await processNextEvent(db, config, { logger: quiet, fetcher: async () => { assert.fail('Non-test order delivered'); } });
    assert.equal(processingResults(db).events.find((event) => event.event_id === 'event-2').status, 'skipped');
  } finally { db.close(); }
});
test('uninstall is durable and cancels queued order delivery', async () => {
  const db = openDatabase(':memory:');
  try { acceptEvent(db, delivery()); acceptEvent(db, { shop: config.shop, eventId: 'uninstall-1', topic: 'app/uninstalled', payload: { id: 1 } }); assert.equal(processingResults(db).events.find((event) => event.event_id === 'event-1').status, 'cancelled'); assert.equal(await processNextEvent(db, config, { logger: quiet }), false); }
  finally { db.close(); }
});
test('HTTP flow verifies before persisting, acknowledges before delivery, and CRM deduplicates', async () => {
  const db = openDatabase(':memory:'); const server = createApplication(config, db, quiet);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); const origin = `http://127.0.0.1:${server.address().port}`;
  const raw = JSON.stringify(order); const headers = { 'X-Shopify-Hmac-Sha256': signWebhook(raw, config.webhookSecret), 'X-Shopify-Shop-Domain': config.shop, 'X-Shopify-Topic': 'orders/create', 'X-Shopify-Event-Id': 'event-http' };
  try {
    assert.equal((await fetch(`${origin}/webhooks/orders-create`, { method: 'POST', headers: { ...headers, 'X-Shopify-Hmac-Sha256': 'bad' }, body: raw })).status, 401);
    assert.equal(processingResults(db).events.length, 0);
    assert.equal((await fetch(`${origin}/webhooks/orders-create`, { method: 'POST', headers, body: raw })).status, 200);
    assert.equal(processingResults(db).orders.length, 0);
    assert.equal((await (await fetch(`${origin}/webhooks/orders-create`, { method: 'POST', headers, body: raw })).json()).duplicate, true);
    const workerConfig = { ...config, crmUrl: `${origin}/mock-crm/orders` };
    await processNextEvent(db, workerConfig, { logger: quiet });
    // A crash after CRM accepted but before local completion must not create a second CRM order.
    db.prepare("UPDATE events SET status='processing',lease_until=0").run();
    await processNextEvent(db, workerConfig, { logger: quiet });
    assert.equal(processingResults(db).orders.length, 1); assert.equal(processingResults(db).events[0].status, 'completed');
    assert.equal((await fetch(`${origin}/inspect`)).status, 401);
    assert.equal((await fetch(`${origin}/inspect`, { headers: { Authorization: `Bearer ${config.inspectionToken}` } })).status, 200);
  } finally { await new Promise((resolve) => server.close(resolve)); db.close(); }
});
test('GraphQL retries throttle, advances cursor, and handles userErrors', async () => {
  const calls = []; let queries = 0; const configReal = { mock: false, shop: config.shop, clientId: 'client', clientSecret: 'secret', apiVersion: '2026-07' };
  const admin = new ShopifyAdmin(configReal, { sleep: async () => {}, fetcher: async (url, options) => {
    if (url.endsWith('access_token')) return ok({ access_token: 'test-token', expires_in: 86400 });
    const request = JSON.parse(options.body); calls.push(request);
    if (request.query.startsWith('mutation')) return ok({ data: { metafieldsSet: { userErrors: [{ code: 'INVALID_VALUE' }], metafields: [] } } });
    queries++;
    if (queries === 1) return ok({ errors: [{ extensions: { code: 'THROTTLED' } }] });
    return ok({ data: { products: { nodes: [{ id: queries }], pageInfo: { hasNextPage: queries === 2, endCursor: queries === 2 ? 'cursor-1' : 'cursor-2' } } } });
  } });
  const pages = []; for await (const page of admin.products()) pages.push(page);
  assert.equal(pages.length, 2); assert.equal(calls[2].variables.cursor, 'cursor-1');
  await assert.rejects(admin.setMaterial('gid://shopify/Product/1', 'Steel'), /INVALID_VALUE/);
});
