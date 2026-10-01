# Modernization log

Date: 2026-10-01. Branch: interview-demo/personalized-products. Initial CLI upload went to unpublished theme `167193444515`. Shopify subsequently connected the branch and published theme `167196295331`; `main` was not merged. Storefront password blocks actual rendering/cart verification.

| Existing state | Change and reason | Evidence/remaining verification |
| --- | --- | --- |
| Clean main checkout, no backend | Created separate development branch and integration-app directory | Branch pushed; no merge into main; connected theme publication verified separately |
| Committed conflict markers in README | Replaced with project architecture/setup/navigation | Markdown content review |
| Custom layout comments out landmark/cart/globals and loads six synchronous scripts | Added demo layout with semantic main/skip link, shared section groups and one deferred script | Theme Check reports no demo issues; Chromium fixture checks; Shopify pending |
| Static HTML header/footer links and mock cart submenu | Demo sections use menus, routes, policies, actual counts, existing icons | Structure checks; real menu/editor verification pending |
| Home uses many legacy catalog/design sections | Configurable real featured collection + benefits blocks; default JSON updated | JSON/schema checks; legacy version remains in Git/history |
| Product variant matching uses unordered membership | Positional match, unavailable/sold-out states, money/image/quantity updates, line properties | Chromium fixture tests pass; real Shopify data pending |
| Cart foundation disconnected from custom layout | One demo AJAX implementation, native forms, line keys, bundled sections/null fallback | Browser fixture checks; checkout pending |
| No custom data learning scenario | Material/dimensions and shared care-guide reference/fallback | Definition instructions; Shopify metafield/editor checks pending |
| No integration app | Raw HMAC, durable SQLite inbox, lease/retry worker, idempotent mock CRM, protected inspect, uninstall | Seven backend tests initially passed; live mock flow recorded separately |
| No Admin API example | Client credentials, cursor products, material mutation, webhook subscriptions, error handling | Mocked API tests pass; real scopes/installation pending |
| Invalid legacy section schema `templates` key | Changed to enabled_on.templates | Schema error disappears from Theme Check |
| OG shop name unescaped | Escaped in reused SEO snippet | Code review; preview view-source pending |
| No interview guides | Topic guide, debugging/practice/walkthrough/checklists/release/performance notes | Files present and linked from README |

After schema fix, repository Theme Check reports 44 errors and 52 warnings. Every file with remaining findings matches HEAD/original content; no new demo file is reported. See theme-check-results.json. Errors are mostly legacy image dimensions/parser-blocking scripts; warnings include unused/orphaned objects and complex facets. They remain recorded debt rather than suppressed checks.

No measured LCP/CLS/INP/Lighthouse before/after scores are available. Static asset/loading differences are documented without claiming a performance score gain. No Safari/Firefox/physical-device or screen-reader result is claimed.
