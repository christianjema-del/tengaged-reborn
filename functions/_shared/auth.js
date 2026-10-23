const ADMIN_USERNAME = "admin1";
const schemaReady = new WeakMap();

export async function ensureProfileSchema(db) {
  if (schemaReady.has(db)) return schemaReady.get(db);
  const setup = (async () => {
  // These additive changes let existing D1 accounts keep working while new
  // profile and moderation fields are introduced.
  for (const sql of [
    "ALTER TABLE users ADD COLUMN t_money INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN ban_reason TEXT",
    "ALTER TABLE users ADD COLUMN banned_at TEXT",
    "ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN is_test_bot INTEGER NOT NULL DEFAULT 0"
  ]) {
    try { await db.prepare(sql).run(); } catch (error) {
      if (!/duplicate column/i.test(String(error.message || error))) throw error;
    }
  }

  await db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER NOT NULL,
    target_user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  })();
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
  const session = await db.prepare(`
    SELECT users.id, users.username, users.is_admin, users.is_banned, sessions.expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? LIMIT 1
  `).bind(tokenHash).first();

  if (!session || !session.expires_at || Date.parse(session.expires_at) <= Date.now() || session.is_banned) return null;
  if (session.username.toLowerCase() === ADMIN_USERNAME && !session.is_admin) {
    await db.prepare("UPDATE users SET is_admin=1 WHERE id=?").bind(session.id).run();
    session.is_admin = 1;
  }
  return { id: session.id, username: session.username, is_admin: Boolean(session.is_admin) };
}

export function jsonError(message, status) {
  return Response.json({ ok: false, message }, { status });
}

export { ADMIN_USERNAME };
