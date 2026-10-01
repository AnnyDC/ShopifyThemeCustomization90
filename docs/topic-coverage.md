# Topic coverage and interview guide

Status labels:

- **Implemented and verified** means a named local check passed. It never implies Shopify end-to-end verification.
- **Implemented but awaiting Shopify/browser verification** means code exists but its Shopify rendering, permissions, or device behavior is still pending.
- **Conceptual only** means no working module is claimed.

## Liquid and native catalog data

**Status:** Implemented but awaiting Shopify/browser verification; structure/schema checks passed.

**Concept/example:** Liquid renders Shopify objects on the server. [Product cards](../snippets/demo-product-card.liquid) take explicit `card_product`/`eager` parameters; [collection](../sections/demo-collection.liquid) loops inside `paginate`; [product details](../snippets/demo-product-details.liquid) uses conditions, `default`, `escape`, `money`, and metafield filters.

**How/why:** Catalog data comes from product/collection objects; money stays formatted by Shopify. Snippets have isolated inputs and no hardcoded catalog. Merchant rich text is rendered as HTML; customer properties and titles are escaped. Captured variant JSON replaces `<` to prevent script termination.

**Test/demo:** Change a product title/price/image in Admin and refresh preview; paginate a collection; enter `<script>` as engraving and confirm it displays as text. Missing images show a placeholder; missing guides hide optional content.

**Edge cases:** Blank objects, long titles, rich-text versus plain-text fields, localization, and Liquid's 250-variant iteration limit. Demo products must stay within that limit.

**Interview:** Why format money in Liquid? Shopify knows the presentment currency and merchant format; the browser receives formatted values rather than duplicating currency rules.

## Online Store 2.0 architecture

**Status:** Implemented but awaiting Shopify/browser verification.

**Concept/example:** [demo layout](../layout/demo.liquid), [header group](../sections/demo-header-group.json), [footer group](../sections/demo-footer-group.json), [personalized JSON template](../templates/product.personalized.json), and [benefit schema/blocks/preset](../sections/demo-benefits.liquid).

**How/why:** JSON orders configurable sections; section groups make shared navigation/footer editable; sections expose schemas while snippets own reusable markup. Native theme settings such as favicon and social metadata remain in use. Dedicated demo assets avoid the legacy layout's competing scripts.

**Test/demo:** Reorder benefit blocks, change collection/count/logo/menu, and reload a product section in Customize. Compare default and named product templates with `view=personalized`.

**Edge cases:** Shared resource assignments affect other themes; unpublished templates may not appear in admin pickers; metaobject definitions must exist before the merchant can configure/use their guide references.

**Interview:** Why preserve old sections? The repository combines Dawn and custom markup; an alternate layout makes the new journey reviewable without rewriting unrelated legacy pages.

## Metafields, metaobjects, dynamic sources

**Status:** Implemented but awaiting Shopify/browser verification.

**Concept/example:** [demo-product-details](../snippets/demo-product-details.liquid) reads `custom.material`, `custom.dimensions`, and `custom.care_guide.value`; [product schema](../sections/demo-product.liquid) offers a `care_guide` metaobject fallback.

**How/why:** Metafields attach typed product data; metaobjects reuse a guide across products. Product reference wins, section reference is fallback, missing data is omitted. The editor supports compatible dynamic-source connections rather than all settings indiscriminately.

**Test/demo:** Follow [definitions](store-setup.md), share one guide between two products, edit it once, and remove references to check fallback/hiding.

**Edge cases:** Draft/inaccessible entries, wrong namespace/type, blank values, and missing definitions.

**Interview:** Why not repeat care HTML in descriptions? A metaobject has one source of truth, typed fields, and reusable references.

## Variant selection and personalization

**Status:** Implemented and verified in Chromium fixture; real Shopify verification pending.

**Concept/example:** [demo.js](../assets/demo.js) custom element `updateVariant`/`add`; [native product form](../sections/demo-product.liquid).

**How/why:** Match option values by index, update variant ID/price/compare/image/quantity rules, distinguish missing versus sold-out variants, and preserve the variant URL. Line-item properties carry optional engraving/message; empty/whitespace-only values are removed from AJAX payloads. Native labels, required quantity/step/min/max, maxlength, and reportValidity validate input. A request lock prevents repeated submission. The normal select is the no-JS fallback.

**Test/demo:** Run `npm.cmd test`; choose swapped option values, a deleted combination, sold-out stock, a compare-at variant, and submit twice rapidly. Demonstrate 40-character engraving and a 200-character message limit.

**Edge cases:** Stock can change after page render; Shopify's response wins. Client validation can be bypassed; fulfillment must treat properties as untrusted input. Selling plans/bundles are excluded.

**Interview:** What caused the old wrong-variant bug? It checked whether option values existed anywhere in a variant. Index-based matching preserves option meaning.

## AJAX and section rendering

**Status:** Implemented and verified in Chromium fixture; Shopify server rendering pending.

**Concept/example:** `request`, `sectionIds`, and `refreshCart` in [demo.js](../assets/demo.js); [cart drawer section](../sections/demo-cart-drawer.liquid).

**How/why:** Add/change requests include bundled section IDs and `sections_url`. HTML remains generated by Shopify. Null/missing bundled sections trigger a separate Section Rendering API fetch; count comes from cart state. Locale root comes from `routes.root_url`.

**Test/demo:** Fixture simulates null sections and `/fr/cart/add.js`; in Shopify DevTools inspect POST body and returned section IDs. Throttle network and verify loading/error states.

**Edge cases:** A mutation may succeed while rendering/count refresh fails; the message tells customers to inspect cart before retrying, avoiding automatic duplicate adds. JSON/network/422 failures are shown with textContent.

**Interview:** Why not rebuild cart HTML from JSON? Server sections preserve Shopify formatting, discounts, translations, and merchant content.

## Cart identity and checkout

**Status:** Cart behavior implemented and verified in Chromium fixture; real checkout awaiting Shopify verification.

**Concept/example:** `changeLine` in [demo.js](../assets/demo.js), [cart-content snippet](../snippets/demo-cart-content.liquid), [cart template](../templates/cart.json).

**How/why:** Mutations use current line keys, never variant IDs; quantity zero removes the exact line. Page/drawer share one snippet with different ID contexts. Server content includes discounts, line properties, subtotal, empty state, and native checkout submission. Global mutation lock serializes cart writes.

**Test/demo:** Add one variant with two engravings, change just one quantity, remove it, empty cart, then place a Bogus Gateway test order.

**Edge cases:** Identical properties merge naturally; different properties remain distinct. Line keys can change after mutations, so rendered markup always supplies fresh keys. Checkout errors can arise from missing shipping/inventory configuration.

**Interview:** Why a line key? Variant ID cannot distinguish two personalized lines of the same variant.

## Responsive HTML/CSS and accessibility

**Status:** Implemented and verified in Chromium fixture; Shopify, screen-reader, Safari/Firefox, and physical-device checks pending.

**Concept/example:** [demo.css](../assets/demo.css) grids/aspect ratios/focus styles; [layout skip link](../layout/demo.liquid); native `dialog` and delegated close logic in [demo.js](../assets/demo.js).

**How/why:** Semantic headings/forms, explicit labels, 44px button targets, fluid grid tracks, and word wrapping support scanning and zoom. Native showModal makes the background inert and supports Escape; explicit Tab/Shift-Tab wrapping keeps focus in drawer controls, and close restores the opener/current cart link. Alerts announce errors, status announces mutations. Custom elements abort old listeners when disconnected.

**Test/demo:** [browser tests](../tests/theme-browser.test.js) exercise 375/768/1440 widths, image loading, focus return, Escape, and section replacement. Manually tab through drawer and menus; test 200% zoom and reduced motion.

**Edge cases:** Section replacement disconnects the opener; removed lines need fallback focus. No complete WCAG audit is claimed. Native dialog requires a capable browser; cart-page navigation remains fallback.

**Interview:** How do editor reloads avoid duplicate handlers? The custom element installs listeners per connection using an AbortController and removes them on disconnect; page-level handlers are delegated and loaded once.

## Server authentication and scopes

**Status:** Implemented but awaiting Shopify verification; token flow is mocked in local tests.

**Concept/example:** `ShopifyAdmin.accessToken`/`fetchToken` in [shopify.js](../integration-app/src/shopify.js), [config](../integration-app/src/config.js), [environment example](../integration-app/.env.example).

**How/why:** Same-organization Dev Dashboard client credentials grant fits a single owned practice store. Tokens stay in server memory and renew before expiry. Only `write_products,read_orders` are requested; config validates shop/version and local inspection/CRM tokens.

**Test/demo:** Install app, run products CLI, inspect network on server only. Never print a token. Mock mode must refuse Admin calls.

**Edge cases:** Wrong organization/installation, expired credentials, scope changes, and uninstalled app. This is not multi-store OAuth; public distribution needs an OAuth/session architecture.

**Interview:** Why client credentials here? It removes an unnecessary embedded UI/session flow for a server integration on an owned store, while keeping secrets server-side.

## GraphQL pagination, mutations, errors, and throttling

**Status:** Implemented and verified with mocked fetch; real API verification pending.

**Concept/example:** `graphql`, async generator `products`, `setMaterial`, and `subscribe` in [shopify.js](../integration-app/src/shopify.js); [backend tests](../integration-app/test/integration.test.js).

**How/why:** Query 25 products per page and pass endCursor until hasNextPage is false. Mutation sends typed variables and separately checks userErrors. HTTP 429/5xx/network errors retry with limits; GraphQL THROTTLED uses available cost/restore rate. API is pinned, not unstable. Subscription creation avoids blind retry because creation is not inherently idempotent.

**Test/demo:** Run products and material CLI; local tests force throttling and userErrors. In Shopify verify the changed metafield appears in the product specifications.

**Edge cases:** Cursor that never advances, 401, missing permissions, incompatible definitions, partial data/errors, exhausted retries, and ambiguous subscription creation.

**Interview:** Is HTTP 200 proof of GraphQL success? No. Top-level errors and mutation userErrors are distinct from HTTP status and must be checked.

## Webhook HMAC and acceptance

**Status:** Implemented and verified locally; real Shopify delivery pending.

**Concept/example:** `readRawBody`/`verifyWebhook` in [security.js](../integration-app/src/security.js), route handling in [server.js](../integration-app/src/server.js).

**How/why:** Capture bytes before JSON parsing, compute SHA-256 HMAC, compare signatures in constant time, validate shop/topic/event ID, then persist. The receiver returns 200 only after the transaction; storage failure returns retryable 503.

**Test/demo:** Alter whitespace after signing, send malformed signatures, then send a valid event. Invalid signatures must leave no inbox row. Inspect real delivery logs only after app installation.

**Edge cases:** Body-size limits, malformed JSON, secret rotation, shop spoofing, and request timeouts. Headers are not included in body HMAC; configured shop/topic constraints and order idempotency provide additional boundaries.

**Interview:** Why raw bytes? Parsing and serializing JSON can change whitespace/key order, invalidating Shopify's signature.

## Durable duplicates, retries, and CRM integration

**Status:** Implemented and verified with SQLite/HTTP tests.

**Concept/example:** `acceptEvent`, `claimEvent`, `recordCrmOrder` in [database.js](../integration-app/src/database.js); `transformOrder`/`processNextEvent` in [orders.js](../integration-app/src/orders.js).

**How/why:** Unique shop/event inbox key, transactional inserts, processing leases, capped backoff, and dead state handle redelivery and restarts. CRM uses unique shop/order key and Idempotency-Key, protecting the gap between remote acceptance and local completion. Transform preserves each line's engraving/message and excludes customer identity; only test orders are delivered.

**Test/demo:** Send the same event twice; restart SQLite; simulate CRM acceptance followed by local crash; force CRM offline then restore it. Inspect attempts/status without logging raw data.

**Edge cases:** At-least-once delivery, different delivery IDs for the same order, database failure, stale leases, dead work, and non-test orders. Run one worker per database; arbitrary production concurrency/reconciliation is conceptual.

**Interview:** Can you promise exactly once? No; retries can repeat requests. Idempotency at both inbox and CRM gives one stored business result for this scenario.

## Uninstall handling and debugging

**Status:** Implemented and verified locally; Shopify uninstall pending.

**Concept/example:** Uninstall transaction in `acceptEvent`, protected `processingResults` endpoint, CLI inspect, [debug exercises](debugging.md).

**How/why:** A verified uninstall disables processing and cancels pending orders durably. Status/attempt/error codes make failures inspectable without secret/PII logs. In-memory Admin tokens are process-local and not persisted by this backend.

**Test/demo:** Queue an order then uninstall; assert cancellation and no claim. Follow a failure from response to event ID, attempts, and CRM result.

**Edge cases:** In-flight CRM delivery cannot be recalled, reinstalls need deliberate reactivation, and inspection data needs protection.

**Interview:** Why not just remove an access token on uninstall? Queued work and installation state also need durable handling across restarts.

## Performance and SEO

**Status:** Implemented but awaiting Shopify measurements; fixture layout/image checks passed.

**Concept/example:** [image card](../snippets/demo-product-card.liquid), product image priority, deferred [demo layout](../layout/demo.liquid), one `structured_data` block in [product](../sections/demo-product.liquid), reused [meta-tags](../snippets/meta-tags.liquid).

**How/why:** Responsive width candidates/dimensions and fixed ratios reduce unnecessary bytes/layout shift. First product image is eager/high priority, later cards lazy. Demo drops legacy synchronous UI libraries. Titles/descriptions/canonical/OG tags and crawlable links remain server-rendered. One Product schema block avoids duplication inside the demo template.

**Test/demo:** View source and check headings, image srcset, canonical, JSON-LD; inspect app-injected duplication. Follow the comparable Lighthouse procedure in [performance](performance.md).

**Edge cases:** Apps add scripts/schema; variant media sizes differ; store content determines LCP. No metric improvement is claimed without paired measurements.

**Interview:** Why not quote a Lighthouse improvement from asset reduction? Static asset changes are evidence of a design choice, not measured user performance.

## Git, deployment, and maintenance

**Status:** Development branch implemented and verified; store deployment awaiting verification.

**Concept/example:** [deployment guide](deployment.md), `.shopifyignore`, [theme export](../scripts/export-theme.js), [Theme Check report](theme-check-results.json).

**How/why:** Separate branch and duplicate theme protect the mapped main workflow. Backend stays outside Shopify theme directories; a theme-only export prevents GitHub sync contamination. Release/rollback record theme IDs, commits, settings, and shared assignments.

**Test/demo:** Review git status/diff and check the export contains only theme folders. Verify mapping in Admin before any release.

**Edge cases:** CLI ignore is not GitHub ignore, merchant edits can conflict with Git, rollback does not undo placed orders or data mutations, and legacy Theme Check remains red.

**Interview:** What is a safe release? A reviewed commit previewed on a confirmed unpublished ID, verified with store tests, backed up, and published only after explicit authorization.

## Checkout extensions, Functions, and pixels

**Status:** Conceptual only. See [checkout module](checkout.md).

**Concept/example:** Themes own storefront Liquid; checkout UI extensions use supported checkout targets; Functions execute platform business logic; web pixels collect consent-aware analytics.

**How/why:** These have separate app deployment/capability boundaries. Store plan/version alone does not prove target availability. No checkout extension has been deployed.

**Test/demo:** Inspect this store's capabilities and extension targets before scaffolding; retain the existing cart personalization flow regardless of checkout customization.

**Edge cases:** Plan/target restrictions, accelerated checkout, consent, extension sandbox, and Functions distribution limitations.

**Interview:** Can Liquid customize checkout payment steps? Storefront theme Liquid is not the checkout extension runtime; use supported app APIs and verify eligibility.
