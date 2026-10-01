import { randomUUID } from 'node:crypto';
import { readConfiguration } from './config.js';
import { signWebhook } from './security.js';
import { ShopifyAdmin } from './shopify.js';

const configuration = readConfiguration(); const command = process.argv[2];
const origin = `http://127.0.0.1:${configuration.port}`;
try {
  if (command === 'demo') {
    if (!configuration.mock) throw new Error('Demo injection requires MOCK_MODE=true.');
    const body = JSON.stringify({ id: Date.now(), name: '#MOCK-1001', test: true, currency: 'USD', total_price: '30.00', line_items: [{ id: 1, variant_id: 123, title: 'Mock engraved bottle', quantity: 1, price: '30.00', properties: [{ name: 'Engraving', value: 'Anny' }, { name: 'Gift message', value: 'Congratulations!' }] }] });
    const eventId = randomUUID();
    for (let attempt = 0; attempt < 2; attempt++) { const response = await fetch(`${origin}/webhooks/orders-create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Hmac-Sha256': signWebhook(body, configuration.webhookSecret), 'X-Shopify-Shop-Domain': configuration.shop, 'X-Shopify-Topic': 'orders/create', 'X-Shopify-Event-Id': eventId }, body }); if (!response.ok) throw new Error(`Demo failed (${response.status})`); console.log(await response.json()); }
    console.log('Local signed simulation sent twice. Run npm run inspect after processing. This does not verify Shopify checkout or delivery.');
  } else if (command === 'inspect') {
    const response = await fetch(`${origin}/inspect`, { headers: { Authorization: `Bearer ${configuration.inspectionToken}` } }); if (!response.ok) throw new Error(`Inspection failed (${response.status})`); console.log(JSON.stringify(await response.json(), null, 2));
  } else {
    const admin = new ShopifyAdmin(configuration);
    if (command === 'products') { for await (const products of admin.products()) console.log(JSON.stringify(products, null, 2)); }
    else if (command === 'material') console.log(await admin.setMaterial(process.argv[3] || '', process.argv[4] || ''));
    else if (command === 'subscribe') console.log(await admin.subscribe());
    else throw new Error('Commands: demo, inspect, products, material <Product GID> <material>, subscribe.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
