export async function ensureCastingSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS casting_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    casting_id INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS casting_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    casting_id INTEGER NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS casting_resources (
    casting_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    keys INTEGER NOT NULL DEFAULT 0,
    apples INTEGER NOT NULL DEFAULT 3,
    health INTEGER NOT NULL DEFAULT 100,
    PRIMARY KEY(casting_id, username)
  )`).run();
  await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS casting_players_unique_user
    ON casting_players(casting_id, LOWER(username))`).run();
  await db.prepare(`INSERT OR IGNORE INTO casting_resources(casting_id,username,keys,apples,health)
    SELECT casting_id,username,0,3,100 FROM casting_players`).run();
}

export async function listCastingPlayers(db) {
  const result = await db.prepare(`
    SELECT p.username, p.joined_at, COALESCE(r.keys,0) AS keys,
           COALESCE(r.apples,3) AS apples, COALESCE(r.health,100) AS health
    FROM casting_players p
    LEFT JOIN casting_resources r ON r.casting_id=p.casting_id AND LOWER(r.username)=LOWER(p.username)
    WHERE p.casting_id=1 ORDER BY p.id ASC
  `).all();
  return result.results || [];
}
