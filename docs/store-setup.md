# Store setup (awaiting authenticated Shopify access)

Store: `code-with-anny.myshopify.com`. Use test catalog records and a duplicate unpublished theme.

Delivered theme: `Interview personalized demo`, ID `167193444515`, role unpublished. [Preview](https://code-with-anny.myshopify.com/?preview_theme_id=167193444515), [editor](https://code-with-anny.myshopify.com/admin/themes/167193444515/editor). The CLI authenticated and uploaded a separate copy of repository theme files. For this delivery skip creation of another duplicate and use this ID. Live theme remains `136168243363`, ShopifyThemeCustomization90/main.

## Products, collections, and menus

1. Admin -> Products -> Add product: `Engraved travel bottle`, a descriptive title/description, an actual product photograph, vendor `Practice Studio`, type `Personalized gifts`, price 30.00 in store currency. Publish to the Online Store sales channel.
2. Add Finish (`Silver`, `Gold`) and Size (`Small`, `Large`) options. Set variant-specific images and inventory. Give one variant compare-at price 40.00; set another to zero stock with continue-selling disabled. Delete one combination to test unavailable selection. Keep the demo below 250 variants per product; it does not implement remote high-variant selection.
3. Add another gift with a long title and missing image/metafields. Add enough products for pagination, or set page size to 4.
4. Products -> Collections -> Create collection `Personalized gifts`, handle `personalized-gifts`, manual collection; add these products and publish to Online Store. Add a collection description.
5. Content -> Menus (older admin: Online Store -> Navigation): main menu includes Home, the collection, and Care & FAQ. Footer menu includes Care & FAQ and configured policies. Use Shopify resource links.

## Metafields and care metaobject

1. Settings -> Custom data -> Products -> Add definition: `Material`, namespace/key `custom.material`, single-line text. Add `Dimensions`, `custom.dimensions`, single-line text. Enable storefront read access where offered. Populate `Stainless steel` and `500 ml` on the bottle.
2. Settings -> Custom data -> Metaobjects -> Add definition: name `Care guide`, type `care_guide`. Add required Title (`title`, single-line text) and Instructions (`instructions`, rich text). Enable Storefronts read access. Enable publishable status if offered.
3. Content -> Metaobjects -> Care guide -> Add entry: title `Bottle care`; instructions describing handwashing and avoiding abrasive cleaners. Set Active if publishable status is enabled.
4. Settings -> Custom data -> Products -> Add definition `Care guide`, key `custom.care_guide`, type Metaobject reference -> Care guide. Enable storefront read access. Reference the same entry on two products.
5. In Customize -> product section choose the fallback care-guide setting. Product reference overrides the section fallback; missing content hides the guide. Connect a compatible dynamic source using the editor's data-source button when offered. Static reference selection also works; not all setting types accept dynamic sources.

Create `care_guide` before configuring the guide selector because the schema declares that type. Upload succeeded; definition/entry existence and storefront access remain unverified. The backend updates material values, not definitions.

## Unpublished theme and assignments

1. Online Store -> Themes -> mapped theme -> menu -> Duplicate. Name it `Interview personalized demo`; confirm it is not Current theme.
2. From this repository run `npx.cmd --yes @shopify/cli theme list --store code-with-anny.myshopify.com`. Authenticate through Shopify login if asked. Record the duplicate's ID and unpublished role.
3. Run `npx.cmd --yes @shopify/cli theme push --store code-with-anny.myshopify.com --theme UNPUBLISHED_THEME_ID`. Replace the ID with the verified duplicate. Do not use allow-live or publish.
4. Open its Preview link. Default home/product/collection/cart/page templates already use the demo layout, so normal shopping links work without shared resource assignment changes.
5. Customize -> home -> Demo featured products -> choose `Personalized gifts`, heading/count; configure benefit blocks. Header/footer groups -> choose menus and logo. Product -> engraving limit and care guide. Drawer is a static section.
6. Online Store -> Pages -> Add page `Care & FAQ`, handle `care-faq`; enter care content. Its default template works. Add FAQ blocks in the duplicate's page section.
7. Named template preview URLs: `/products/HANDLE?view=personalized&preview_theme_id=ID`, `/collections/personalized-gifts?view=demo&preview_theme_id=ID`, `/pages/care-faq?view=care&preview_theme_id=ID`.
8. Product/collection/page -> Theme template -> personalized/demo/care is the assignment location. Admin pickers normally reflect published-theme templates, so use the defaults and view URLs while unpublished. Do not publish merely to expose the picker. Make named assignments when templates are available during an authorized release. Assignments are shared store data, not private preview settings.

For active editing run `npx.cmd --yes @shopify/cli theme dev --store code-with-anny.myshopify.com --theme UNPUBLISHED_THEME_ID` and use the returned preview URL.

## Filters and checkout

Install the free Shopify Search & Discovery app if missing. Apps -> Search & Discovery -> Filters -> add Availability, Price, Finish, and Size. `collection.filters` exposes configured filters; the GET form preserves active filters while sorting, and Shopify pagination URLs preserve query context. Check collection size and currency behavior against Shopify's filter constraints.

Settings -> Payments -> activate `(for testing) Bogus Gateway`, or Shopify Payments test mode if available. Bogus Gateway: name `Bogus Gateway`, card number `1` succeeds, `2` declines, `3` simulates gateway failure; future expiry and any three-digit security code. Configure a shipping zone/rate and stocked location for the test address. Use no real card.

Add Engraving `Anny` and `Sam` on the same variant; verify two lines. Complete a successful test checkout. Admin -> Orders -> line properties should retain both. Keep the backend in real mode behind HTTPS with registered webhooks; `npm.cmd run inspect` should show completion and one CRM order with both properties. Orders not explicitly marked `test: true` are skipped.

Sources: [Theme push](https://shopify.dev/docs/api/shopify-cli/theme/theme-push), [Storefront filters](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering), [Test orders](https://help.shopify.com/en/manual/checkout-settings/test-orders/processing-test-order), [High-variant guidance](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products).
