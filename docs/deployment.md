# Development and safe deployment

Branch: `interview-demo/personalized-products`. Main is reported as Shopify-mapped; mapping has not been independently inspected. Do not push main or publish without explicit user approval.

Current delivery: CLI login/list succeeded; live theme remains 136168243363 and demo copy 167193444515 is unpublished. Push future theme edits to that demo ID. No merge into main or theme publication has occurred. Detailed GitHub connection settings still need Admin verification.

## Review workflow

Run `npm.cmd ci`, `npm.cmd run check`, `npm.cmd test`, and `npx.cmd --yes @shopify/cli theme check`. Review `git diff --check`, template changes, merchant settings, and the manual checklist. Preview with CLI theme dev against the unpublished duplicate or push to its confirmed ID. `.shopifyignore` excludes backend/docs/tests for CLI upload.

## GitHub synchronization

Use a separate theme-only branch/repository connected to the duplicate. `.shopifyignore` is a CLI filter; do not assume GitHub sync honors it. `node scripts/export-theme.js` creates ignored `theme-export/` containing only assets/config/layout/locales/sections/snippets/templates. Review/export those folders into the separate theme repository and connect that branch to the duplicate. Keep main's connection intact.

Admin -> Online Store -> Themes -> duplicate -> inspect GitHub connection details. Record repo/branch/theme ID rather than inferring mapping from local remotes. A PR should state preview ID, reviewed commit, tests, setup changes, and legacy findings. Keep secrets in environment/CI secret stores.

## Authorized release

1. Download the previous theme; record ID/commit/settings/template assignments.
2. Push to the confirmed unpublished ID; ensure custom data definitions exist and merchant/app-block settings are correct.
3. Run purchase, keyboard/mobile, SEO, and webhook checks. Review scopes/API version.
4. Request explicit approval with the concrete commit and preview link. Merge/publish only after approval.
5. Record released theme/commit and observe storefront errors and queue statuses.

## Rollback and maintenance

With release approval, republish the prior theme; restore changed shared template assignments if needed. Backend rollback is independent: preserve SQLite, fix/revert code, restart, inspect pending/dead events. Theme rollback does not undo orders/metafield changes/CRM deliveries.

Load demo.js once; preserve data attributes and custom-element lifecycle handling. Test properties, line keys, null sections, and editor replacements after changes. Selectively port upstream fixes rather than importing all of Dawn. Keep the lockfile and test API-version upgrades. Existing store-dependent Lighthouse CI secrets have not been verified.
