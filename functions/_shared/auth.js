import {schemaReady170,markSchema170} from './schema-ready170.js';
const ADMIN_USERNAME = "admin1";
const schemaReady = new WeakMap();

export async function ensureProfileSchema(db) {
  if (schemaReady.has(db)) return schemaReady.get(db);
  const setup = (async () => {
  if(await schemaReady170(db,'profile-170'))return;
  const knownColumns=new Set((await db.prepare("PRAGMA table_info(users)").all()).results.map(c=>c.name));
  // These additive changes let existing D1 accounts keep working while new
  // profile and moderation fields are introduced.
  for (const sql of [
    "ALTER TABLE users ADD COLUMN is_moderator INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN t_money INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN ban_reason TEXT",
    "ALTER TABLE users ADD COLUMN banned_at TEXT",
    "ALTER TABLE users ADD COLUMN ban_until TEXT",
    "ALTER TABLE users ADD COLUMN red_nose_until TEXT",
    "ALTER TABLE users ADD COLUMN red_nose_reason TEXT",
    "ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN is_test_bot INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN last_seen_at TEXT"
  ]) {
    const added=sql.match(/ADD COLUMN (\w+)/i)?.[1];
    if(knownColumns.has(added))continue;
    try { await db.prepare(sql).run(); } catch (error) {
      if (!/duplicate column/i.test(String(error.message || error))) throw error;
    }
  }

  await db.prepare('CREATE INDEX IF NOT EXISTS users_active141 ON users(is_banned,is_system,is_test_bot,last_seen_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS users_lookup141 ON users(lower(username))').run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER NOT NULL,
    target_user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

 await markSchema170(db,'profile-170');  })();
  schemaReady.set(db, setup);
  try {
    await setup;
  } catch (error) {
    schemaReady.delete(db);
    throw error;
  }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function getSessionUser(request, db) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(part => part.trim()).find(part => part.startsWith("session="))?.slice(8);
  if (!token) return null;

  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const tokenHash = await sha256(token);
  // Selecting the row keeps old installations (without the role column yet)
  // readable in one query. Only the explicit public fields below are returned.
  const session=await db.prepare(`SELECT users.*,sessions.expires_at FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? LIMIT 1`).bind(tokenHash).first();

  if (!session || session.is_banned) return null;
  if(session.username.toLowerCase()==='tengaged'){
    const system=await db.prepare('SELECT is_system FROM users WHERE id=?').bind(session.id).first();
    if(system?.is_system)return null;
  }
  if (session.username.toLowerCase() === ADMIN_USERNAME && !session.is_admin) {
    await db.prepare("UPDATE users SET is_admin=1 WHERE id=?").bind(session.id).run();
    session.is_admin = 1;
  }
  // Heartbeat: authenticated requests record recent activity without writing every second.
  try {
    if(!session.last_seen_at||Date.now()-Date.parse(session.last_seen_at.replace(' ','T')+(session.last_seen_at.endsWith('Z')?'':'Z'))>60000)await db.prepare("UPDATE users SET last_seen_at=CURRENT_TIMESTAMP WHERE id=? AND (last_seen_at IS NULL OR last_seen_at < datetime('now','-30 seconds'))").bind(session.id).run();
  } catch (error) { if (!/no such column/i.test(String(error.message || error))) console.warn("Activity heartbeat:",error); }
  return { id: session.id, username: session.username, is_admin: Boolean(session.is_admin), is_moderator:Boolean(session.is_moderator), must_change_password:Boolean(session.must_change_password) };
}

export function jsonError(message, status) {
  return Response.json({ ok: false, message }, { status });
}

export { ADMIN_USERNAME };
