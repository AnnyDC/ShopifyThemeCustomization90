# Practical debugging exercises

Work only on the development branch/unpublished preview. Capture the smallest failing request and restore behavior before moving on.

| Scenario | Reproduce and inspect | Expected diagnosis/fix | Verification |
| --- | --- | --- | --- |
| Wrong variant added | Select options with reused values across positions; inspect form `id`, URL variant, and add payload | Check `demo.js:updateVariant` compares index/value, not array membership | Positional browser test; Admin cart/order variant agrees |
| Cart UI remains stale | Force a bundled section to null, or rename data-section-id | Inspect POST section IDs, sections_url, returned HTML, `refreshCart` source selector | Independent sections fallback runs; page/drawer/count agree |
| Missing metafield | Clear custom.material, change namespace, or set care entry Draft | Inspect definition type/storefront access, `.value`, and fallback precedence in demo-product-details | Optional spec hidden; section guide fallback works |
| Duplicate webhook | Run demo twice with the same event ID or force worker crash after CRM acceptance | Check inbox primary key and CRM order_key; do not use process memory as dedup | One durable event/result after restart; one CRM order |
| Integration failure | Point CRM_URL to an unused localhost port | Inspect attempts/status/last_error; distinguish HMAC, persistence, API, and CRM layers | Restore URL; retry completes, or sixth failed attempt is dead |
| Section re-render breaks form | Replace product section through editor or clone/replace in fixture | Verify connectedCallback/disconnectedCallback and abortable listeners; avoid DOMContentLoaded-only wiring | One request per submission after multiple replacements |
| HMAC rejected | Sign JSON then change whitespace | Verify exact byte buffer, secret source, header base64, and middleware order | Invalid event never enters inbox; matching bytes accepted |
| API returns HTTP 200 but fails | Simulate top-level errors or mutation userErrors | Inspect GraphQL envelope and codes rather than HTTP only | Mutation throws; no success claimed |

Do not log `.env`, auth headers, raw orders, or tokens while debugging. Use event IDs/status codes and protected local inspection. An AJAX mutation can succeed before UI refresh fails: inspect cart before another add.
