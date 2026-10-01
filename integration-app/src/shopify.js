const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class ShopifyAdmin {
  constructor(configuration, { fetcher = fetch, sleep = pause } = {}) { this.configuration = configuration; this.fetcher = fetcher; this.sleep = sleep; }
  async accessToken() {
    if (this.token && this.expiresAt > Date.now() + 60000) return this.token;
    if (!this.tokenPromise) this.tokenPromise = this.fetchToken().finally(() => { this.tokenPromise = null; });
    return this.tokenPromise;
  }
  async fetchToken() {
    const config = this.configuration;
    const response = await this.fetcher(`https://${config.shop}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: config.clientId, client_secret: config.clientSecret }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Authentication failed (${response.status}); verify same-organization app installation.`);
    const body = await response.json(); if (!body.access_token || !body.expires_in) throw new Error('Invalid authentication response.');
    this.token = body.access_token; this.expiresAt = Date.now() + body.expires_in * 1000; return this.token;
  }
  async graphql(query, variables = {}, { retry = true } = {}) {
    if (this.configuration.mock) throw new Error('Admin API is disabled in mock mode.');
    for (let attempt = 0; attempt < 5; attempt++) {
      let response;
      try {
        response = await this.fetcher(`https://${this.configuration.shop}/admin/api/${this.configuration.apiVersion}/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await this.accessToken() }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(10000) });
      } catch { if (!retry || attempt === 4) throw new Error('Admin API network or authentication failure.'); await this.sleep(500 * 2 ** attempt); continue; }
      if (response.status === 401) { this.token = null; if (attempt === 0) continue; }
      if (response.status === 429 || response.status >= 500) { if (!retry || attempt === 4) throw new Error(`Admin API transient failure (${response.status}).`); const seconds = Number(response.headers.get('retry-after')); await this.sleep(Math.min(30000, seconds > 0 ? seconds * 1000 : 500 * 2 ** attempt)); continue; }
      if (!response.ok) throw new Error(`Admin API failed (${response.status}).`);
      const result = await response.json();
      if (result.errors?.length) {
        if (retry && result.errors.every((error) => error.extensions?.code === 'THROTTLED') && attempt < 4) {
          const cost = result.extensions?.cost; const deficit = Math.max(0, (cost?.requestedQueryCost || 1) - (cost?.throttleStatus?.currentlyAvailable || 0)); const restoreRate = cost?.throttleStatus?.restoreRate || 1;
          await this.sleep(Math.min(30000, Math.max(500, deficit / restoreRate * 1000) + 100 * attempt)); continue;
        }
        throw new Error(`GraphQL errors: ${result.errors.map((error) => error.extensions?.code || 'QUERY_ERROR').join(',')}`);
      }
      if (!result.data) throw new Error('Admin API returned no data.'); return result.data;
    }
    throw new Error('Admin API retries exhausted.');
  }
  async *products() {
    let cursor = null;
    do {
      const { products } = await this.graphql('query DemoProducts($cursor: String) { products(first: 25, after: $cursor) { nodes { id title handle metafield(namespace: "custom", key: "material") { value } } pageInfo { hasNextPage endCursor } } }', { cursor });
      yield products.nodes;
      if (!products.pageInfo.hasNextPage) break;
      if (!products.pageInfo.endCursor || products.pageInfo.endCursor === cursor) throw new Error('Pagination cursor did not advance.');
      cursor = products.pageInfo.endCursor;
    } while (true);
  }
  async setMaterial(productId, material) {
    if (!/^gid:\/\/shopify\/Product\/\d+$/.test(productId) || !material.trim() || material.length > 200) throw new Error('Valid product GID and material (1-200 characters) required.');
    const data = await this.graphql('mutation DemoMaterial($fields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $fields) { metafields { id namespace key value } userErrors { field message code } } }', { fields: [{ ownerId: productId, namespace: 'custom', key: 'material', type: 'single_line_text_field', value: material.trim() }] });
    if (data.metafieldsSet.userErrors.length) throw new Error(`Metafield rejected: ${data.metafieldsSet.userErrors.map((error) => error.code || 'USER_ERROR').join(',')}`);
    return data.metafieldsSet.metafields;
  }
  async subscribe() {
    const base = new URL(this.configuration.publicUrl); if (base.protocol !== 'https:') throw new Error('PUBLIC_URL must be HTTPS.');
    const subscriptions = [];
    for (const [topic, path] of [['ORDERS_CREATE', '/webhooks/orders-create'], ['APP_UNINSTALLED', '/webhooks/app-uninstalled']]) {
      const uri = new URL(path, base).href;
      const existing = await this.graphql('query DemoSubscriptions { webhookSubscriptions(first: 250) { nodes { id topic uri } } }');
      if (existing.webhookSubscriptions.nodes.some((subscription) => subscription.topic === topic && subscription.uri === uri)) continue;
      const data = await this.graphql('mutation DemoSubscribe($topic: WebhookSubscriptionTopic!, $subscription: WebhookSubscriptionInput!) { webhookSubscriptionCreate(topic: $topic, webhookSubscription: $subscription) { webhookSubscription { id topic uri } userErrors { field message } } }', { topic, subscription: { uri, format: 'JSON' } }, { retry: false });
      if (data.webhookSubscriptionCreate.userErrors.length) throw new Error('Webhook subscription rejected. Check scopes and callback URL.');
      subscriptions.push(data.webhookSubscriptionCreate.webhookSubscription);
    }
    return subscriptions;
  }
}
