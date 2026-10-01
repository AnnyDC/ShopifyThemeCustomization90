# Shopify integration backend

Single-store server-side Node 24 app for a store owned by the same organization as its Dev Dashboard app. Runtime libraries are built into Node; SQLite is the durable inbox and mock CRM. This is not an embedded/public multi-store app.

## Local mock mode

From this directory:

```powershell
node src/setup-local.js
npm.cmd start
```

Setup creates an ignored `.env` with random local credentials and preserves an existing file. Configure values in your local editor; never put secrets in chat, Git, or browser assets. Another terminal:

```powershell
npm.cmd run demo
npm.cmd run inspect
npm.cmd test
```

Health: `http://127.0.0.1:3001/health`. Demo sends one signed simulated test order twice. Inspect shows the last 100 processing results/CRM orders. Cryptographic mock verification proves local handling, not Shopify authentication or checkout. GraphQL is disabled in mock mode. Logs contain IDs/status codes, never raw order bodies or credentials. The database and protected inspection response contain test personalization; keep them private.

## Real Shopify configuration

1. Dev Dashboard -> create an app in the organization owning this store. Configure a non-embedded server-side app with scopes `write_products,read_orders` and an app URL pointing to a free HTTPS tunnel. Product-write permission also permits product reads and product metafield updates; no customer/theme/inventory-write/all-orders scope is needed.
2. Release the configuration and install on `code-with-anny.myshopify.com`. Client credentials grant requires app/store in the same organization. If unavailable, use a same-organization practice store or implement authorization-code OAuth with durable encrypted sessions as a separate exercise; mock mode stays available.
3. Locally set `MOCK_MODE=false`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`. The client secret verifies webhook HMAC. Keep random inspection/CRM tokens of at least 24 characters. The Admin token is obtained server-side and cached only in memory until renewal.
4. Keep the pinned supported API version `2026-07`; review support dates before upgrading. Set webhook payload API version to the same value in the app version configuration where offered. This setup does not use a legacy Admin-created custom-app token.
5. Tunnel to `http://127.0.0.1:3001`, set PUBLIC_URL to its HTTPS origin, restart, then:

```powershell
npm.cmd run products
node --env-file-if-exists=.env src/cli.js material gid://shopify/Product/PRODUCT_ID "Stainless steel"
npm.cmd run subscribe
```

The product iterator queries 25 records per cursor page. The mutation uses variables and checks userErrors. Subscription registration checks existing topic/URI pairs before creating orders/create and app/uninstalled; it avoids blind retries after ambiguous creation failures. Rerun to reconcile. The demo expects fewer than 250 subscriptions. Remove obsolete subscription URIs when tunnel addresses change, then register the new URL.

6. Complete the app's protected-customer-data configuration where Shopify requires it for order access. Do not widen scopes to bypass access errors. CRM transformation excludes address/email/customer identity, though the original webhook stays privately in SQLite for retries.
7. Complete a Bogus Gateway/Shopify Payments test-mode purchase from the duplicate theme preview. Compare Admin line properties, app delivery logs, and `npm.cmd run inspect`.

## Routes and processing

| Route | Authentication | Result |
| --- | --- | --- |
| GET /health | None | Mode/version only |
| POST /webhooks/orders-create | Raw HMAC + configured shop/topic | Persist before 200; bad signature/JSON rejected; storage failure 503 |
| POST /webhooks/app-uninstalled | Same verification | Durable disable/cancel |
| POST /mock-crm/orders | CRM bearer token + order idempotency key | Unique shop/order record |
| GET /inspect | Inspection bearer token | Statuses, attempts, and test orders |

`acceptEvent` transacts a unique shop/event row. Event-ID correlates the same merchant action across subscriptions, with Webhook-ID fallback. `claimEvent` takes a 60-second lease; the worker has a 10-second CRM timeout. Crashed leases recover. Failures use capped exponential backoff, becoming dead after six attempts. Unique shop/order CRM keys prevent duplicates after a crash between CRM acceptance and local completion. Non-test orders become skipped.

Use one backend worker process per SQLite database. Use persistent local disk, not ephemeral serverless storage. Stop before copying the SQLite database/WAL. An uninstall cannot recall an in-flight request already accepted by CRM. After reinstall, reactivate through a reviewed database migration; do not silently resume cancelled work. Public distribution needs OAuth sessions, required privacy webhooks, retention policies, reconciliation, and hosted durable storage.

Failure exercise: point CRM_URL to an unused localhost port, restart, send a demo, inspect retries; restore URL/restart and observe completion. Dead events require deliberate replay after diagnosis; implement a protected replay command as practice.

Sources: [Client credentials](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant), [Webhook verification](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries), [API versions](https://shopify.dev/docs/api/usage/versioning), [Subscription query](https://shopify.dev/docs/api/admin-graphql/latest/queries/webhookSubscriptions), [MetafieldsSet](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet).
