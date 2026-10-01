# Optional checkout module

**Coverage: Conceptual only.** No authenticated store capabilities were available, so no checkout extension, Function, or pixel was deployed. Main personalization remains in the product form/cart and Shopify order line properties.

| Surface | Purpose | Example to explain | Relationship to this project |
| --- | --- | --- | --- |
| Theme Liquid/JS | Storefront product, collection, content, cart | Engraving form and AJAX drawer | Implemented |
| Checkout UI extension | UI on supported checkout targets in an app sandbox | Confirm personalized-gift details on an eligible target | Capability assessment pending |
| Shopify Function | Platform business logic through a supported Function API | Validate personalization or apply a gift discount | Conceptual; API/distribution eligibility must be checked |
| Web pixel | Customer-event analytics with privacy/consent handling | Track a checkout event without sending engraving text | Conceptual; not a fulfillment integration |

Checkout UI extensions on information/shipping/payment steps require Shopify Plus eligibility; other targets have their own rules. A partner development store label and theme version do not establish this store's available targets. Verify its checkout editor, app development configuration, target, and test capabilities before scaffolding. [Shopify checkout extension overview](https://shopify.dev/docs/api/checkout-extensions).

Functions availability depends on Function API and app distribution/store eligibility; do not assume a custom Function app is supported just because theme apps work. [Shopify Function APIs](https://shopify.dev/docs/api/functions/latest).

Web pixels run in sandboxes and must respect declared customer privacy permissions. They cannot replace reliable order webhooks for CRM delivery. Never send engraving/gift text as analytics data. [Web pixel overview](https://shopify.dev/docs/api/pixels), [pixel privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy).

When access is available, choose the smallest eligible target that displays an existing order/cart property, generate an extension with Shopify CLI, run app dev on the same development store, and validate supported components/permissions plus accelerated checkout. Keep this optional module separate from the completed storefront/integration code.
