# Performance and SEO review

## Static before/after evidence

Original `layout/theme.liquid` synchronously includes jQuery, Bootstrap, noUiSlider, Swiper, remote URL Parse, and Shopify money helper scripts. The demo layout includes one deferred `demo.js` and one `demo.css`; those legacy dependencies are not requested by the demo layout. Shopify `content_for_header` and installed apps can still add scripts. Preserved legacy templates keep their own assets.

The legacy product section used membership-based variant lookup and inline DOMContentLoaded handlers. The demo ships only its product variant data (limited to the small demo catalog) and renders catalog/care/cart content server-side. Product cards paginate through Shopify instead of fetching the entire collection.

Product hero image: explicit Shopify image_tag dimensions, width candidates 400/700/1000/1400, responsive sizes, eager/high priority. Cards: fixed ratio, 200/400/600/800 widths, first two eager, later lazy. Cart thumbnails: 100/200 widths and fixed 80px box. Variant image updates retain responsive candidates. CSS defines grid tracks/ratios to reduce layout movement; no metric gain has been measured.

The hero policy is intended for the default product template above the fold. If merchants add a product section below other sections, revisit its priority. Images and app scripts must be checked in the real preview.

## Comparable measurement procedure

1. Preview the former-live legacy theme `136168243363` and current live demo `167196295331` using identical products, images, language, currency, apps, and test device.
2. Use the same Chrome/Lighthouse versions, viewport, network/CPU throttling, and cache policy. Run at least three times per page and report median results with dates/preview theme IDs.
3. Test home, collection, and product. Record LCP element/time, CLS contributions, JavaScript transfer/evaluation, request count, and total bytes. Save reports outside theme folders.
4. For INP use supported interaction measurements/field data; a single Lighthouse navigation score is not proof of field INP. Development-store traffic is unlikely to provide representative field data.
5. Explain remaining changes due to content/apps rather than attributing everything to theme code.

| Metric | Legacy preview | Demo preview | Status |
| --- | --- | --- | --- |
| LCP | Not measured | Not measured | Store access needed |
| CLS | Not measured | Not measured | Fixture overflow checks are not CLS measurements |
| INP | Not measured | Not measured | Real interactions/field data needed |
| Lighthouse score | Not measured | Not measured | No score or percentage gain claimed |

## SEO

Demo layout escapes title/description and retains canonical/OG/social tags; the reused OG shop name is now escaped. Product has one Shopify-generated Product JSON-LD block. Check app injection for duplicate Product markup. Main shopping/content templates have one primary h1; card/benefit headings follow beneath it. Collection forms/navigation/card URLs are crawlable; product descriptions/specifications are available without JavaScript.

Verify pagination canonicals, filter URLs, localized storefront canonicals, merchant descriptions, unavailable products, missing images, and schema validity against an actual preview. The development store's password protection can prevent external crawlers/testing tools; that is not evidence of a theme SEO failure.
