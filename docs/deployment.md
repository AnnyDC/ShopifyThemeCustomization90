# Development and safe deployment

Branch: `interview-demo/personalized-products`. Main is reported as Shopify-mapped; mapping has not been independently inspected. The user authorized publication of a GitHub-connected demo theme on 2026-10-01. Do not merge into or push `main`.

Current delivery: CLI login/list succeeded; live theme remains `136168243363`, and CLI-uploaded demo `167193444515` is unpublished and not GitHub-connected. Unpublished rollback copy of the current live theme: `167195410595` (Pre-interview live backup 2026-10-01). No merge into main or theme publication has occurred. Detailed GitHub connection settings still need Admin verification.

## Review workflow

Run `npm.cmd ci`, `npm.cmd run check`, `npm.cmd test`, and `npx.cmd --yes @shopify/cli theme check`. Review `git diff --check`, template changes, merchant settings, and the manual checklist. Preview with CLI theme dev against the unpublished duplicate or push to its confirmed ID. `.shopifyignore` excludes backend/docs/tests for CLI upload.

## GitHub synchronization

Connect the pushed `interview-demo/personalized-products` branch directly. Shopify's GitHub integration ignores folders outside the default theme structure, so `integration-app/`, `docs/`, `scripts/`, and `tests/` remain separate from synchronized theme files. `.shopifyignore` applies to CLI uploads only. `node scripts/export-theme.js` is an optional theme-only artifact for review or a future isolated repository, not a prerequisite for connecting this branch. Keep main's connection intact.

In Shopify Admin, go to Online Store -> Themes -> Theme library -> Add theme -> Connect from GitHub. Choose account `AnnyDC`, repository `ShopifyThemeCustomization90`, and branch `interview-demo/personalized-products`. Shopify creates a **new unpublished theme** with this connection; it does not attach the branch to CLI-uploaded theme `167193444515`. Record the new theme ID, confirm its card shows the exact repo/branch and latest commit, preview it, then publish **that connected theme**. Do not publish the CLI demo when the requirement is a Git-connected live theme. Admin changes to a connected theme commit back to the branch, so pull/review them before later pushes.

Admin -> Online Store -> Themes -> connected theme card -> inspect GitHub connection details. Record repo/branch/theme ID rather than inferring mapping from local remotes. A PR should state preview ID, reviewed commit, tests, setup changes, and legacy findings. Keep secrets in environment/CI secret stores.

## Authorized release

1. Keep the unpublished prior-live backup `167195410595`; record current live ID/commit/settings/template assignments.
2. Connect the pushed development branch as above, confirm the new unpublished connected theme ID and GitHub card, and ensure custom data definitions and merchant/app-block settings are correct.
3. Run purchase, keyboard/mobile, SEO, and webhook checks where store configuration permits; document any unverified behavior explicitly.
4. With the user's 2026-10-01 publication authorization, publish the verified GitHub-connected theme, not `main` or the CLI-only copy.
5. Record released theme/commit and observe storefront errors and queue statuses.

## Rollback and maintenance

With release approval, republish the prior theme; restore changed shared template assignments if needed. Backend rollback is independent: preserve SQLite, fix/revert code, restart, inspect pending/dead events. Theme rollback does not undo orders/metafield changes/CRM deliveries.

Load demo.js once; preserve data attributes and custom-element lifecycle handling. Test properties, line keys, null sections, and editor replacements after changes. Selectively port upstream fixes rather than importing all of Dawn. Keep the lockfile and test API-version upgrades. Existing store-dependent Lighthouse CI secrets have not been verified.
