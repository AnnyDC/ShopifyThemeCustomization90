# Validation record

Date: 2026-10-01. Local Windows Node 24.18.0.

## Checks performed

- Theme structure/schema/snippet/translation script: 76 checks passed on the first run. Config JSON is also validated in the final version.
- Backend tests: seven passed. Covers exact-byte HMAC, line personalization, SQLite reopen/dedup, retry/dead/stale lease/non-test skip, uninstall, HTTP acceptance/CRM idempotency/auth, mocked GraphQL throttle/cursors/userErrors.
- Chromium tests: two passed. Covers option matching, unavailable/sold-out, error recovery, duplicate submission, different engravings, quantity/removal by line keys, null sections, locale URL, Escape/focus return, section replacement, loaded imagery and no horizontal overflow at 375/768/1440.
- Mobile and desktop fixture screenshots visually inspected: text/forms fit, media is visible, no overlapping elements. Fixture is test HTML using actual demo.css/demo.js, not Shopify-rendered Liquid.
- Running local backend: signed test order accepted; repeat identified as duplicate; one event completed on attempt one and one CRM record retained Engraving and Gift message. No real Shopify order was used.
- Final `npm.cmd test`: nine tests passed, zero failed. Final structure check: 76 checks passed. `git diff --check` passed with Windows LF/CRLF notices only. Credentials/database paths are confirmed ignored by Git.
- An added full Tab-cycle assertion initially failed; explicit Tab/Shift-Tab drawer wrapping fixed it. The final nine-test run passes including that assertion. Fifteen learning/setup documents have 55 checked local links, all resolving.
- Shopify Theme Check: full command exits 1; 44 errors and 52 warnings remain, all in files unchanged from original HEAD. No demo files reported. Machine report: theme-check-results.json. Report script deliberately succeeds when demo files are clean; this does not mean the full theme passes.
- Dependency install reported zero vulnerabilities at installation; this is not a permanent security guarantee.

## Awaiting verification

Shopify CLI login and theme upload succeeded. On 2026-10-01, Shopify CLI confirmed live theme `167196295331`; an Admin screenshot showed its GitHub badge for `ShopifyThemeCustomization90/interview-demo/personalized-products`, and Git remote reported branch tip `9bccf0b`. Former live `136168243363` and CLI-only demo `167193444515` are unpublished. Browser-control inventory has no connected browser/native app. An earlier isolated real-preview Chromium check was blocked by storefront password; it did not claim page/cart success. Machine record: storefront-verification.json.

Configure STOREFRONT_PASSWORD in ignored integration-app/.env locally, then run `node --env-file-if-exists=integration-app/.env scripts/verify-storefront.js` from root. It tests actual Shopify home/collection/product/cart with reversible isolated guest-cart entries and removes them afterward; no checkout is submitted. Set PREVIEW_URL locally to another verified unpublished theme when needed.

Real Liquid rendering, theme editor/metaobject dynamic sources, real Shopify cart/checkout, app installation/client credentials/scopes, live Admin query/mutation/subscriptions, Shopify-signed webhook delivery, and connected personalized test purchase.

Also pending: Safari/Firefox/Edge-specific checks, physical iOS/Android devices, screen reader, and comparative LCP/CLS/INP/Lighthouse measurement. None is marked passed.

## Repeat checks

From root: `npm.cmd run check`, `npm.cmd test`, `node scripts/theme-check-report.js`, `git diff --check`. Backend-only: `node --test` from integration-app. Fixtures are meaningful browser interaction tests but cannot validate Shopify server behavior.
