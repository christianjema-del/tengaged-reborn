import {schemaReady170,markSchema170} from './schema-ready170.js';
export async function ensureGameHistorySchema(db) {
 if(await schemaReady170(db,'history-171'))return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS user_game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    game_type TEXT NOT NULL,
    game_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    placement TEXT,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT
  )`).run();
  await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS user_game_history_unique
    ON user_game_history(game_type, game_id, LOWER(username))`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS user_game_history_user_idx
    ON user_game_history(LOWER(username), joined_at DESC)`).run();
 await markSchema170(db,'history-171');
}
