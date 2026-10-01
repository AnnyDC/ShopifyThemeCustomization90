# Eight-minute interview walkthrough

1. **Business problem (45 seconds):** a gift needs personalization without turning every engraving into a variant. Explain the practice-store/test-payment constraint and status of actual store verification.
2. **Architecture (60 seconds):** show README flow diagram, alternate demo layout, JSON templates/section groups, reusable snippets, and independent Node backend. Explain preserving legacy code and isolating the new journey.
3. **Merchant editing (60 seconds):** demonstrate collection/count/benefit settings, product material/dimensions, and one shared care guide. Point to schema and fallback logic.
4. **Product/cart (90 seconds):** demonstrate variant price/image/sold-out/unavailable behavior, engraving, two differently personalized lines, line-key quantity updates, section rendering, and checkout.
5. **Integration (90 seconds):** show raw HMAC before JSON, durable inbox before acknowledgment, retry lease, transformation, and CRM idempotency. Send duplicate mock delivery and inspect one business result; label this mock verification.
6. **Admin API (60 seconds):** show cursor iterator, material mutation, variables, userErrors, and throttling. State same-organization authentication assumptions and minimum scopes.
7. **Evidence (45 seconds):** show tests, mobile/desktop fixture screenshots, real-store checklist, and legacy Theme Check findings. Distinguish local mocks from real Shopify tests and avoid invented performance metrics.
8. **Release (30 seconds):** explain unpublished ID, separate theme-only branch/export, review, explicit publication approval, backup, and rollback.

Useful questions: Why line properties instead of variants? Why line keys? Why raw body? What if CRM succeeded but acknowledgment failed? What if a section is replaced? What remains unverified? Use the project files and tests to answer each.
