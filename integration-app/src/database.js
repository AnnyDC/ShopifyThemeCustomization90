import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS events (
      shop TEXT NOT NULL, event_id TEXT NOT NULL, topic TEXT NOT NULL, payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
      last_error TEXT, created_at INTEGER NOT NULL, completed_at INTEGER,
      PRIMARY KEY(shop, event_id));
    CREATE INDEX IF NOT EXISTS events_due ON events(status, next_attempt);
    CREATE TABLE IF NOT EXISTS crm_orders (order_key TEXT PRIMARY KEY, payload TEXT NOT NULL, received_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS installations (shop TEXT PRIMARY KEY, active INTEGER NOT NULL);`);
  return database;
}
export function acceptEvent(database, { shop, eventId, topic, payload }, now = Date.now()) {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = database.prepare('INSERT OR IGNORE INTO events(shop,event_id,topic,payload,created_at) VALUES(?,?,?,?,?)').run(shop, eventId, topic, JSON.stringify(payload), now);
    if (result.changes && topic === 'app/uninstalled') {
      database.prepare('INSERT INTO installations(shop,active) VALUES(?,0) ON CONFLICT(shop) DO UPDATE SET active=0').run(shop);
      database.prepare("UPDATE events SET status='cancelled' WHERE shop=? AND topic='orders/create' AND status IN ('pending','processing')").run(shop);
      database.prepare("UPDATE events SET status='completed',completed_at=? WHERE shop=? AND event_id=?").run(now, shop, eventId);
    }
    database.exec('COMMIT'); return Boolean(result.changes);
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}
export function claimEvent(database, now = Date.now()) {
  database.exec('BEGIN IMMEDIATE');
  try {
    const event = database.prepare(`SELECT e.* FROM events e LEFT JOIN installations i ON e.shop=i.shop
      WHERE e.topic='orders/create' AND COALESCE(i.active,1)=1
      AND ((e.status='pending' AND e.next_attempt<=?) OR (e.status='processing' AND e.lease_until<=?))
      ORDER BY e.created_at LIMIT 1`).get(now, now);
    if (event) database.prepare("UPDATE events SET status='processing',attempts=attempts+1,lease_until=? WHERE shop=? AND event_id=?").run(now + 60000, event.shop, event.event_id);
    database.exec('COMMIT'); return event ? { ...event, attempts: event.attempts + 1 } : null;
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}
export function recordCrmOrder(database, order) {
  return Boolean(database.prepare('INSERT OR IGNORE INTO crm_orders(order_key,payload,received_at) VALUES(?,?,?)').run(order.orderKey, JSON.stringify(order), Date.now()).changes);
}
export function processingResults(database) {
  return { events: database.prepare('SELECT shop,event_id,topic,status,attempts,last_error,created_at,completed_at FROM events ORDER BY created_at DESC LIMIT 100').all(), orders: database.prepare('SELECT payload FROM crm_orders ORDER BY received_at DESC LIMIT 100').all().map((row) => JSON.parse(row.payload)) };
}
