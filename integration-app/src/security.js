import { createHmac, timingSafeEqual } from 'node:crypto';

export function safeEqual(left, right) {
  const a = Buffer.from(String(left || '')); const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}
export function verifyWebhook(rawBody, signature, secret) {
  if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(signature || '')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  return safeEqual(signature, expected);
}
export function signWebhook(rawBody, secret) { return createHmac('sha256', secret).update(rawBody).digest('base64'); }
export async function readRawBody(request, limit = 1024 * 1024) {
  const chunks = []; let length = 0;
  for await (const chunk of request) { length += chunk.length; if (length > limit) { const error = new Error('Payload too large'); error.status = 413; throw error; } chunks.push(chunk); }
  return Buffer.concat(chunks);
}
