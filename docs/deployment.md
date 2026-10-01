# Development and safe deployment

Branch: `interview-demo/personalized-products`. Main is reported as Shopify-mapped; mapping has not been independently inspected. The user authorized publication of a GitHub-connected demo theme on 2026-10-01. Do not merge into or push `main`.

Release record (2026-10-01): live GitHub-connected demo theme `167196295331`, repository `AnnyDC/ShopifyThemeCustomization90`, branch `interview-demo/personalized-products`, reviewed branch tip `9bccf0b`. Shopify CLI confirmed the live role and Git remote confirmed the commit; an Admin screenshot showed the repo/branch badge on the live card. Former live `136168243363` (`main`), CLI-only demo `167193444515`, and pre-release backup `167195410595` are unpublished. No merge into `main`. Storefront/cart/checkout and webhook verification remain outstanding.

## Review workflow

Run `npm.cmd ci`, `npm.cmd run check`, `npm.cmd test`, and `npx.cmd --yes @shopify/cli theme check`. Review `git diff --check`, template changes, merchant settings, and the manual checklist. Since this branch now deploys directly to the live theme, develop future theme-code changes on a new branch connected to an unpublished preview theme; merge into the live-connected branch only after review. `.shopifyignore` excludes backend/docs/tests for CLI upload.

## GitHub synchronization

Connect the pushed `interview-demo/personalized-products` branch directly. Shopify's GitHub integration ignores folders outside the default theme structure, so `integration-app/`, `docs/`, `scripts/`, and `tests/` remain separate from synchronized theme files. `.shopifyignore` applies to CLI uploads only. `node scripts/export-theme.js` is an optional theme-only artifact for review or a future isolated repository, not a prerequisite for connecting this branch. Keep main's connection intact.

The connected theme was added using Shopify Admin's Import -> Connect from GitHub flow, then published. Shopify created theme `167196295331` rather than attaching the branch to CLI-uploaded theme `167193444515`. Its live card showed the repo/branch badge. Admin changes to a connected theme commit back to the branch, so pull/review them before later pushes.

Admin -> Online Store -> Themes -> connected theme card -> inspect GitHub connection details. Record repo/branch/theme ID rather than inferring mapping from local remotes. A PR should state preview ID, reviewed commit, tests, setup changes, and legacy findings. Keep secrets in environment/CI secret stores.

## Authorized release

1. Keep the unpublished prior-live backup `167195410595` and former live `136168243363`; record settings/template assignments.
2. Confirm the live GitHub card and branch tip before later releases. Do not push unreviewed theme-code changes directly to the live-connected branch.
3. Run purchase, keyboard/mobile, SEO, and webhook checks where store configuration permits; document any unverified behavior explicitly.
4. For later changes, preview a separate branch/theme, review, then merge into the live-connected branch with explicit release approval.
5. Observe storefront errors and queue statuses after releases.

## Rollback and maintenance

With release approval, republish the prior theme; restore changed shared template assignments if needed. Backend rollback is independent: preserve SQLite, fix/revert code, restart, inspect pending/dead events. Theme rollback does not undo orders/metafield changes/CRM deliveries.

Load demo.js once; preserve data attributes and custom-element lifecycle handling. Test properties, line keys, null sections, and editor replacements after changes. Selectively port upstream fixes rather than importing all of Dawn. Keep the lockfile and test API-version upgrades. Existing store-dependent Lighthouse CI secrets have not been verified.
