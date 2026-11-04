// Durable completion markers: Cloudflare can provide a new D1 binding wrapper on
// each request. WeakMap caches alone therefore repeat every DDL/seed operation.
// A marker is written only after the complete, idempotent migration succeeds.
export async function schemaReady170(db,key){
 try{return !!await db.prepare('SELECT name FROM schema_ready170 WHERE name=?').bind(key).first();}
 catch(error){if(/no such table[^\n]*schema_ready170/i.test(String(error?.message||error)))return false;throw error;}
}
export async function markSchema170(db,key){
 await db.prepare('CREATE TABLE IF NOT EXISTS schema_ready170(name TEXT PRIMARY KEY,completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 await db.prepare('INSERT OR IGNORE INTO schema_ready170(name) VALUES(?)').bind(key).run();
}
