import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
const ready141=new WeakMap();
export async function ensureSocial(db){if(ready141.has(db))return ready141.get(db);const task=setupSocial(db);ready141.set(db,task);try{return await task;}catch(e){ready141.delete(db);throw e;}}
async function setupSocial(db){
 if(await schemaReady170(db,'social-170'))return;
 await ensureProfileSchema(db);
 await db.prepare('CREATE TABLE IF NOT EXISTS friend_order(owner INTEGER NOT NULL,friend INTEGER NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(owner,friend))').run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS friendships (sender INTEGER NOT NULL,receiver INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(sender,receiver),CHECK(sender<receiver))`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS friend_requests (sender INTEGER NOT NULL,receiver INTEGER NOT NULL,PRIMARY KEY(sender,receiver))`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS game_chat (id INTEGER PRIMARY KEY AUTOINCREMENT,room TEXT NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 await db.prepare('CREATE TABLE IF NOT EXISTS game_chat_votes(message_id INTEGER NOT NULL,user_id INTEGER NOT NULL,value INTEGER NOT NULL CHECK(value IN (-1,1)),PRIMARY KEY(message_id,user_id))').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS game_chat_room ON game_chat(room,id)').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS game_chat_user_time141 ON game_chat(user_id,created_at)').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS game_chat_room_time141 ON game_chat(room,created_at)').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS game_chat_room_user141 ON game_chat(room,user_id)').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS users_banned141 ON users(is_banned,id)').run();
 await db.prepare('CREATE INDEX IF NOT EXISTS users_lower141 ON users(lower(username))').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS game_chat_totals141(room TEXT PRIMARY KEY,total INTEGER NOT NULL DEFAULT 0)').run();
 await db.prepare('CREATE TRIGGER IF NOT EXISTS game_chat_count_insert141 AFTER INSERT ON game_chat BEGIN INSERT INTO game_chat_totals141(room,total) VALUES(NEW.room,1) ON CONFLICT(room) DO UPDATE SET total=total+1; END').run();
 await db.prepare('CREATE TRIGGER IF NOT EXISTS game_chat_count_delete141 AFTER DELETE ON game_chat BEGIN UPDATE game_chat_totals141 SET total=MAX(0,total-1) WHERE room=OLD.room; END').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS social_migrations141(name TEXT PRIMARY KEY)').run();
 const migrated=await db.prepare("SELECT name FROM social_migrations141 WHERE name='counts'").first();
 if(!migrated)await db.batch([db.prepare('INSERT INTO game_chat_totals141(room,total) SELECT room,COUNT(*) FROM game_chat GROUP BY room ON CONFLICT(room) DO UPDATE SET total=excluded.total'),db.prepare("INSERT OR IGNORE INTO social_migrations141(name) VALUES('counts')")]);

 await db.prepare('CREATE TABLE IF NOT EXISTS game_chat_positive141(room TEXT NOT NULL,user_id INTEGER NOT NULL,total INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(room,user_id))').run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS chat_positive_insert141 AFTER INSERT ON game_chat_votes BEGIN INSERT INTO game_chat_positive141(room,user_id,total) SELECT c.room,c.user_id,1 FROM game_chat c WHERE c.id=NEW.message_id AND NEW.value=1 AND NEW.user_id<>c.user_id ON CONFLICT(room,user_id) DO UPDATE SET total=total+1; END`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS chat_positive_delete141 AFTER DELETE ON game_chat_votes BEGIN UPDATE game_chat_positive141 SET total=MAX(0,total-1) WHERE (room,user_id)=(SELECT c.room,c.user_id FROM game_chat c WHERE c.id=OLD.message_id AND OLD.value=1 AND OLD.user_id<>c.user_id); END`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS chat_positive_update141 AFTER UPDATE ON game_chat_votes BEGIN UPDATE game_chat_positive141 SET total=MAX(0,total-1) WHERE (room,user_id)=(SELECT c.room,c.user_id FROM game_chat c WHERE c.id=OLD.message_id AND OLD.value=1 AND OLD.user_id<>c.user_id); INSERT INTO game_chat_positive141(room,user_id,total) SELECT c.room,c.user_id,1 FROM game_chat c WHERE c.id=NEW.message_id AND NEW.value=1 AND NEW.user_id<>c.user_id ON CONFLICT(room,user_id) DO UPDATE SET total=total+1; END`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS chat_positive_remove_message141 BEFORE DELETE ON game_chat BEGIN UPDATE game_chat_positive141 SET total=MAX(0,total-(SELECT COUNT(*) FROM game_chat_votes WHERE message_id=OLD.id AND value=1 AND user_id<>OLD.user_id)) WHERE room=OLD.room AND user_id=OLD.user_id; END`).run();
 const positivesReady=await db.prepare("SELECT name FROM social_migrations141 WHERE name='positives'").first();
 if(!positivesReady)await db.batch([db.prepare('INSERT INTO game_chat_positive141(room,user_id,total) SELECT c.room,c.user_id,COUNT(*) FROM game_chat c JOIN game_chat_votes v ON v.message_id=c.id AND v.value=1 AND v.user_id<>c.user_id GROUP BY c.room,c.user_id ON CONFLICT(room,user_id) DO UPDATE SET total=excluded.total'),db.prepare("INSERT OR IGNORE INTO social_migrations141(name) VALUES('positives')")]);

 await db.prepare('CREATE TABLE IF NOT EXISTS game_chat_activity142(room TEXT NOT NULL,user_id INTEGER NOT NULL,last_id INTEGER NOT NULL,last_at TEXT NOT NULL,PRIMARY KEY(room,user_id))').run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS chat_activity_insert142 AFTER INSERT ON game_chat BEGIN INSERT INTO game_chat_activity142(room,user_id,last_id,last_at) VALUES(NEW.room,NEW.user_id,NEW.id,NEW.created_at) ON CONFLICT(room,user_id) DO UPDATE SET last_id=excluded.last_id,last_at=excluded.last_at WHERE excluded.last_id>game_chat_activity142.last_id; END`).run();
 const activityReady=await db.prepare("SELECT name FROM social_migrations141 WHERE name='activity142'").first();
 if(!activityReady)await db.batch([db.prepare('INSERT INTO game_chat_activity142(room,user_id,last_id,last_at) SELECT c.room,c.user_id,c.id,c.created_at FROM game_chat c JOIN (SELECT room,user_id,MAX(id) AS last_id FROM game_chat GROUP BY room,user_id) m ON c.id=m.last_id WHERE true ON CONFLICT(room,user_id) DO UPDATE SET last_id=excluded.last_id,last_at=excluded.last_at WHERE excluded.last_id>game_chat_activity142.last_id'),db.prepare("INSERT OR IGNORE INTO social_migrations141(name) VALUES('activity142')")]);

 await markSchema170(db,'social-170');
}
export function sameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin;}
