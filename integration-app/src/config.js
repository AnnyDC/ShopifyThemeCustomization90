import { resolve } from 'node:path';

export function readConfiguration(environment = process.env) {
  const mock = environment.MOCK_MODE !== 'false';
  const port = Number(environment.PORT || 3001);
  const shop = environment.SHOPIFY_SHOP || 'code-with-anny.myshopify.com';
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) throw new Error('SHOPIFY_SHOP must be a myshopify.com domain.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const config = { mock, port, shop, apiVersion: environment.SHOPIFY_API_VERSION || '2026-07', clientId: environment.SHOPIFY_CLIENT_ID, clientSecret: environment.SHOPIFY_CLIENT_SECRET, webhookSecret: mock ? environment.MOCK_WEBHOOK_SECRET || 'local-demo-signature-only' : environment.SHOPIFY_CLIENT_SECRET, inspectionToken: environment.INSPECTION_TOKEN, crmToken: environment.CRM_TOKEN, databasePath: resolve(environment.DATABASE_PATH || './data/demo.sqlite'), crmUrl: environment.CRM_URL || `http://127.0.0.1:${port}/mock-crm/orders`, publicUrl: environment.PUBLIC_URL };
  if (!/^\d{4}-(01|04|07|10)$/.test(config.apiVersion)) throw new Error('Use a stable API version, for example 2026-07.');
  if (!config.inspectionToken || !config.crmToken) throw new Error('Set INSPECTION_TOKEN and CRM_TOKEN in the local .env file.');
  if (!mock && (!config.clientId || !config.clientSecret)) throw new Error('Real mode requires Dev Dashboard client credentials.');
  if (!mock && [config.inspectionToken, config.crmToken].some((token) => token.length < 24 || token.startsWith('replace-'))) throw new Error('Real mode requires random tokens of at least 24 characters.');
  return config;
}
