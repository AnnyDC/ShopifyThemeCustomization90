# Repository inspection

Inspection date: 2026-10-01. Branch: `interview-demo/personalized-products`.

Later access update: Shopify CLI login succeeded; the then-live theme was `136168243363` (`main`). A CLI copy became unpublished demo `167193444515`. Subsequently, Shopify Admin connected `interview-demo/personalized-products` and published the resulting theme `167196295331`; its GitHub badge and live role were verified on 2026-10-01. Storefront password and app/custom-data setup still prevent end-to-end verification.

- The checkout was clean on `main`; no prior demo implementation was present.
- All storefront templates except `gift_card.liquid` are JSON. Dawn-derived sections and assets coexist with custom ShopUS sections. No AGENTS.md or hosting configuration was present in the repository inventory.
- `layout/theme.liquid` comments out the main landmark, skip link, Dawn cart drawer, route configuration, and section groups. It synchronously loads jQuery, Bootstrap, Swiper, noUiSlider, and a remote URL parser.
- `sections/main-product.liquid` matches options by membership rather than position, can dereference a missing variant, and binds only on DOMContentLoaded. Its custom selectors do not match the preserved Dawn product scripts.
- The header and footer contain static HTML destinations and a mock cart submenu. Existing collection filtering and pagination are Dawn-based, but depend on assets/globals omitted by the custom layout.
- README contains committed merge-conflict markers. There is no Node backend or dependency manifest. Existing CI has store-dependent Lighthouse and Theme Check jobs; secret availability is unknown.
- At initial inspection, Shopify branch mapping, installed apps, store permissions, checkout capability, and the live theme could not be inspected. Later Admin screenshot and CLI access verified the demo theme's connection/live role, but apps/checkout capabilities remain uninspected.

## Architecture and milestones

Use an alternate `demo` layout and descriptive demo sections for the shopping journey, retaining legacy sections/assets for comparison. Preserve existing icon snippets, translation strings, and the native Shopify data model. Separate the backend under `integration-app/`; Shopify ignores it during theme synchronization. No framework migration was required; the connected demo was later published with user authorization.

1. Foundation: shared section groups, real product cards, configurable homepage, product/collection/cart/content templates, metafields and a guide metaobject.
2. Interactions: one demo event implementation, native product forms, positional option matching, locale-aware AJAX, line keys, bundled sections, server-rendered prices.
3. Accessibility: semantic forms, native modal dialog, live announcements, responsive dimensions, lifecycle-safe custom elements. Store rendering and device testing remain required.
4. Integration: single-store Dev Dashboard app with client credentials, scoped GraphQL utilities, verified raw-body webhooks, SQLite inbox/CRM, retries, mock mode and critical tests.
5. Maintenance: responsive images, SEO, checks, setup/deployment notes, learning exercises and interview walkthrough. Measure storefront performance only after a real preview is available.
