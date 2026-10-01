export function transformOrder(shop, order) {
  if (!order || !order.id || !Array.isArray(order.line_items)) throw new Error('Invalid order');
  return {
    orderKey: `${shop}:${order.id}`, shop, orderId: String(order.id), orderName: order.name || '',
    test: order.test === true, currency: order.currency, total: order.total_price,
    items: order.line_items.map((item) => ({ lineId: String(item.id), variantId: item.variant_id ? String(item.variant_id) : null, title: item.title, quantity: item.quantity, price: item.price, personalization: Object.fromEntries((item.properties || []).filter((property) => ['Engraving', 'Gift message'].includes(property.name) && property.value !== null).map((property) => [property.name, String(property.value)])) }))
  };
}
export async function processNextEvent(database, configuration, { fetcher = fetch, now = Date.now(), logger = console } = {}) {
  const { claimEvent } = await import('./database.js');
  const event = claimEvent(database, now); if (!event) return false;
  try {
    const order = transformOrder(event.shop, JSON.parse(event.payload));
    if (!order.test) {
      database.prepare("UPDATE events SET status='skipped',last_error='non_test_order',completed_at=? WHERE shop=? AND event_id=? AND status='processing'").run(now, event.shop, event.event_id);
      return true;
    }
    const response = await fetcher(configuration.crmUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${configuration.crmToken}`, 'Idempotency-Key': order.orderKey }, body: JSON.stringify(order), signal: AbortSignal.timeout(10000) });
    if (!response.ok) { const error = new Error('CRM response'); error.code = `crm_http_${response.status}`; throw error; }
    database.prepare("UPDATE events SET status='completed',completed_at=?,last_error=NULL WHERE shop=? AND event_id=? AND status='processing'").run(now, event.shop, event.event_id);
    logger.info(JSON.stringify({ event: 'order_delivered', eventId: event.event_id, attempts: event.attempts }));
  } catch (error) {
    const code = /^crm_http_\d+$/.test(error.code || '') ? error.code : 'delivery_failed';
    const status = event.attempts >= 6 ? 'dead' : 'pending';
    const delay = Math.min(300000, 1000 * 2 ** event.attempts);
    database.prepare("UPDATE events SET status=?,next_attempt=?,last_error=?,lease_until=0 WHERE shop=? AND event_id=? AND status='processing'").run(status, now + delay, code, event.shop, event.event_id);
    logger.warn(JSON.stringify({ event: 'order_delivery_failed', eventId: event.event_id, attempts: event.attempts, status, code }));
  }
  return true;
}
