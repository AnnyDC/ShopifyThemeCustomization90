# Personalized Shopify interview demo

A development-store project for Anny's custom Shopify theme: choose a variant, personalize a gift, update an AJAX cart, place a test order, and deliver its personalization to a local mock CRM.

Branch: `interview-demo/personalized-products`. This branch is separate from Shopify-mapped `main`; no merge into `main` or theme publication has been performed. The repository copy is uploaded as unpublished theme `167193444515` (Interview personalized demo).

[Shopify preview](https://code-with-anny.myshopify.com/?preview_theme_id=167193444515) | [Theme editor](https://code-with-anny.myshopify.com/admin/themes/167193444515/editor). Preview currently requires the storefront password.

## Architecture

- Preserved Dawn-derived/ShopUS sections remain available for comparison. Default home/product/collection/cart/page templates use `layout/demo.liquid` and `sections/demo-*.liquid`.
- Named `product.personalized`, `collection.demo`, and `page.care` templates demonstrate reusable template assignments.
- `assets/demo.js` enhances native forms; Shopify remains authoritative for inventory, money, cart state, and checkout.
- `integration-app/` is an independent Node 24 backend using built-in HTTP, fetch, crypto, and SQLite. It has no runtime npm dependencies and needs no paid service.
- CLI uploads exclude backend/docs/tests through `.shopifyignore`. GitHub sync should use a separate theme-only export/repository as described in the deployment guide.

```mermaid
flowchart LR
  Product[Product + personalization] --> Cart[Shopify AJAX cart]
  Cart --> Checkout[Test checkout]
  Checkout --> Webhook[orders/create + raw HMAC]
  Webhook --> Inbox[SQLite durable inbox]
  Inbox --> Worker[Retry worker]
  Worker --> CRM[Mock CRM + order idempotency]
```

## Local checks

From the root, use npm.cmd on Windows where npm.ps1 is blocked:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run check
npm.cmd test
npx.cmd --yes @shopify/cli theme check
```

Backend, from `integration-app`:

```powershell
node src/setup-local.js
npm.cmd start
```

In another terminal in that directory:

```powershell
npm.cmd run demo
npm.cmd run inspect
```

Health: http://127.0.0.1:3001/health . The CLI reads local authentication without printing tokens. Mock demo sends one signed simulated test order twice; inspection shows inbox results and CRM personalization. This does not prove Shopify checkout, authentication, or real webhook delivery.

## Setup and demonstration

Follow [store setup](docs/store-setup.md), [backend setup](integration-app/README.md), and [deployment](docs/deployment.md). Create the care-guide metaobject definition before configuring the guide. The separate unpublished demo already exists; future pushes should target its confirmed ID instead of creating another copy.

Demonstrate: collection filtering -> variant price/image/availability -> two engravings on one variant -> drawer quantities/removal -> test checkout -> webhook inbox -> mock CRM. Use real development-store catalog data and a test payment gateway. The live connected flow awaits store access.

## Learning guides

- [Inspection and architecture](docs/inspection.md)
- [Topic coverage with code links](docs/topic-coverage.md)
- [Modernization log](docs/modernization-log.md)
- [Debugging exercises](docs/debugging.md)
- [Independent practice](docs/practice.md)
- [Interview walkthrough](docs/interview-walkthrough.md)
- [Manual checklist](docs/verification.md)
- [Performance and SEO](docs/performance.md)
- [Optional checkout concepts](docs/checkout.md)
- [Validation results](docs/validation.md)

Browser tests execute actual demo JavaScript/CSS against simulated Shopify responses; they do not render Liquid in Shopify. Repository-wide Theme Check reports legacy issues separately. No Lighthouse scores or real-store success are claimed.

Use ordinary one-time-purchase products with no more than 250 variants. Selling plans, bundles, high-variant remote selection, multi-store OAuth, and production reconciliation are outside this demo. Storefront character limits are convenience validation, not server authorization. Only orders explicitly marked `test: true` are delivered to the CRM.

Original Shopify/Dawn attribution remains in [LICENSE.md](LICENSE.md).
