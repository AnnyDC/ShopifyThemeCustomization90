# Independent practice

## Exercises and acceptance criteria

1. Add optional initials (maximum 8 characters). It must survive add/cart/checkout/webhook/CRM and remain separate from another initials value. Extend the transformation allowlist and one integration test.
2. Add a second shared size-guide metaobject. Product reference overrides section fallback; missing content is omitted. Demonstrate editing one entry updates two products.
3. Add protected dead-event replay. Only dead events can return to pending, and existing CRM order idempotency still prevents duplicates. No unauthenticated replay endpoint.
4. Add a gift wrap checkbox property. Empty/unchecked values must not appear; the cart visibly shows the selected wrap. Quantity changes must target the correct personalized line.
5. Preserve engraving while changing variants and after editor replacement. Explain which state is local versus server-rendered; add a browser test for your chosen policy.
6. Extend GraphQL tests for HTTP 429 Retry-After and transient network errors. Verify bounded attempts and permanent-error failure without exposing credentials.
7. Fix one legacy image-dimension Theme Check error. Use the actual image aspect ratio; document before/after findings without claiming a Lighthouse gain.
8. Add installation reactivation after reinstall. Cancelled orders must stay cancelled; only newly accepted test orders can process after authenticated reactivation.

## Hints (separate from solutions)

1. Follow the existing `properties[...]` field, cart property loop, and orders.js allowlist; identity is a Shopify line key.
2. Read `.value` on a metaobject reference and use metafield_tag for rich text.
3. Add a transaction, validate status, and reuse the existing inspection-token boundary; rate-limit deliberate replay.
4. Native checkbox values are only submitted when checked; make the property name descriptive.
5. connectedCallback can initialize state, but server section replacement may discard form values. Choose and document a policy.
6. Inject fetcher/sleep; count calls rather than waiting in real time.
7. Inspect asset dimensions; image_tag can generate width/height from Shopify image objects.
8. Installation state is durable; do not reset it merely because the process starts.

No complete solutions are included, so these remain independent exercises.
