# Manual verification checklist

Local results are recorded in validation.md. Every unchecked item below requires a real preview or external configuration; it is not a claimed pass.

## Storefront

- [ ] Confirm preview theme ID is unpublished and main mapping unchanged.
- [ ] Merchant settings: menus/logo/benefit blocks/featured collection/count; editor reload and reorder.
- [ ] Real product/collection data, collection links, filtering/sorting/pagination and no-results state.
- [ ] Every variant combination: valid, deleted/unavailable, sold out, compare-at, URL-linked selection, variant image and fallback.
- [ ] Quantity min/max/step, zero/negative/decimal rejection on product form; inventory changes after render.
- [ ] Optional/whitespace/maximum-length engraving, multiline message, HTML characters escaped in cart.
- [ ] Same variant/same properties merges; different properties separate; edit/remove only chosen line.
- [ ] Cart page and drawer agree on count/subtotal/discounts/empty state; bundled sections and null fallback.
- [ ] Double-submit/loading/error states; offline network; mutation succeeds but UI refresh fails.
- [ ] Native no-JS product/cart submission and checkout.
- [ ] Missing material/dimensions/guide; product guide -> section fallback -> hidden; inactive metaobject.

## Accessibility and devices

- [ ] Keyboard navigation/menus, skip link, visible focus, form labels and error/status announcements.
- [ ] Drawer open/tab/shift-tab/Escape/backdrop/close; restore focus after line removal and header replacement.
- [ ] Screen-reader headings and status timing; 200% zoom; reduced motion; mobile touch targets.
- [ ] 375px, 768px, 1440px real Liquid pages; long words/titles, missing images, portrait/landscape media.
- [ ] Chrome/Edge, Firefox, Safari, iOS/Android physical device checks. Local automated coverage is Chromium only.

## Connected test order

- [ ] Test gateway confirmed; shipping zone/rate/inventory permit checkout; no real card.
- [ ] Successful/declined/error test transactions; order line properties match cart.
- [ ] Same-organization app installation, minimum scopes, protected-data settings, pinned API version.
- [ ] Real GraphQL cursor pages and metafield mutation visible in theme.
- [ ] HTTPS subscriptions topic/URI/version correct; no obsolete tunnel subscriptions.
- [ ] Real webhook signature accepted; invalid/tampered signature rejected without persistence.
- [ ] Duplicate delivery/restart creates no second CRM business record.
- [ ] Inbox stored before 200; storage outage gives retryable failure.
- [ ] CRM outage retries/recovery; dead state inspectable; non-test order skipped.
- [ ] Verified uninstall disables queued work; reinstall handling deliberate.

## SEO, performance, and deployment

- [ ] Page title/description/canonical/OG values and heading hierarchy; one Product JSON-LD block including app output.
- [ ] Responsive image dimensions/srcset, LCP loading policy, layout stability, no unnecessary demo dependencies.
- [ ] Comparable Lighthouse runs on legacy and demo previews with same content/device/network; record LCP/CLS/INP limits honestly.
- [ ] Theme Check reviewed, baseline legacy debt documented, diff/check/tests pass for changes.
- [ ] Theme-only export excludes app/secrets; GitHub mapping independently verified.
- [ ] Backup prior theme/settings/shared assignments; release approval recorded; rollback rehearsed on demo theme.
