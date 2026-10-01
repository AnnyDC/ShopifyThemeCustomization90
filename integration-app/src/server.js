import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { readConfiguration } from './config.js';
import { openDatabase, acceptEvent, recordCrmOrder, processingResults } from './database.js';
import { safeEqual, verifyWebhook, readRawBody } from './security.js';
import { processNextEvent } from './orders.js';

const send = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(body)); };
export function createApplication(configuration, database, logger = console) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'ok', mode: configuration.mock ? 'mock' : 'shopify', apiVersion: configuration.apiVersion });
      if (request.method === 'POST' && url.pathname.startsWith('/webhooks/')) {
        const topic = { '/webhooks/orders-create': 'orders/create', '/webhooks/app-uninstalled': 'app/uninstalled' }[url.pathname];
        if (!topic) return send(response, 404, { error: 'Unknown webhook' });
        const raw = await readRawBody(request);
        if (!verifyWebhook(raw, request.headers['x-shopify-hmac-sha256'], configuration.webhookSecret)) return send(response, 401, { error: 'Invalid signature' });
        if (request.headers['x-shopify-shop-domain'] !== configuration.shop || request.headers['x-shopify-topic'] !== topic) return send(response, 403, { error: 'Shop or topic mismatch' });
        const eventId = request.headers['x-shopify-event-id'] || request.headers['x-shopify-webhook-id'];
        if (typeof eventId !== 'string' || eventId.length > 200 || !eventId) return send(response, 400, { error: 'Missing event identifier' });
        let payload; try { payload = JSON.parse(raw.toString('utf8')); } catch { return send(response, 400, { error: 'Invalid JSON' }); }
        if (!payload || typeof payload !== 'object' || (topic === 'orders/create' && (!payload.id || !Array.isArray(payload.line_items)))) return send(response, 400, { error: 'Invalid payload' });
        const accepted = acceptEvent(database, { shop: configuration.shop, eventId, topic, payload });
        logger.info(JSON.stringify({ event: 'webhook_recorded', eventId, topic, duplicate: !accepted }));
        return send(response, 200, { accepted: true, duplicate: !accepted, verification: configuration.mock ? 'mock-signature-only' : 'shopify-hmac' });
      }
      if (request.method === 'POST' && url.pathname === '/mock-crm/orders') {
        if (!safeEqual(request.headers.authorization, `Bearer ${configuration.crmToken}`)) return send(response, 401, { error: 'Unauthorized' });
        let order; try { order = JSON.parse((await readRawBody(request)).toString('utf8')); } catch { return send(response, 400, { error: 'Invalid JSON' }); }
        if (!order?.test || order.shop !== configuration.shop || order.orderKey !== `${configuration.shop}:${order.orderId}` || request.headers['idempotency-key'] !== order.orderKey || !Array.isArray(order.items)) return send(response, 400, { error: 'Invalid CRM order' });
        return send(response, 200, { accepted: true, duplicate: !recordCrmOrder(database, order) });
      }
      if (request.method === 'GET' && url.pathname === '/inspect') {
        if (!safeEqual(request.headers.authorization, `Bearer ${configuration.inspectionToken}`)) return send(response, 401, { error: 'Unauthorized' });
        return send(response, 200, processingResults(database));
      }
      send(response, 404, { error: 'Not found' });
    } catch (error) { logger.error(JSON.stringify({ event: 'request_failed', code: error.status === 413 ? 'payload_too_large' : 'internal_error' })); send(response, error.status || 503, { error: error.status === 413 ? 'Payload too large' : 'Request could not be recorded; retry later' }); }
  });
}
export function startApplication(configuration) {
  const database = openDatabase(configuration.databasePath); const server = createApplication(configuration, database);
  let running = false; let stopping = false;
  const timer = setInterval(async () => {
    if (running || stopping) return; running = true;
    try { await processNextEvent(database, configuration); } catch { console.error(JSON.stringify({ event: 'worker_failed' })); } finally { running = false; }
  }, 500);
  server.listen(configuration.port, '127.0.0.1', () => console.info(JSON.stringify({ event: 'listening', url: `http://127.0.0.1:${configuration.port}/health`, mode: configuration.mock ? 'MOCK: no Shopify verification' : 'SHOPIFY' })));
  const stop = () => { stopping = true; clearInterval(timer); server.close(async () => { while (running) await new Promise((resolve) => setTimeout(resolve, 50)); database.close(); }); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop); return { server, database, stop };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startApplication(readConfiguration());
