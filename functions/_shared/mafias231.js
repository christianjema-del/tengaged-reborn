import {COLOR_LEVELS} from '../../color-level-catalog.js';
const ready=new WeakMap();
export const admissionVotes231=n=>Math.max(1,Math.min(20,Math.ceil(n/2)));
export const presidentVotes231=n=>Math.max(1,Math.min(10,Math.ceil(n*.2)));
export async function ensureMafias231(db){if(ready.has(db))return ready.get(db);const task=(async()=>{
 for(const q of [
 `CREATE TABLE IF NOT EXISTS mafias(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL COLLATE NOCASE UNIQUE,description TEXT NOT NULL DEFAULT '',founder_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS mafia_members(user_id INTEGER PRIMARY KEY,mafia_id INTEGER NOT NULL,role TEXT NOT NULL DEFAULT 'member',joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE INDEX IF NOT EXISTS mafia_members_mafia ON mafia_members(mafia_id)`,
 `CREATE TABLE IF NOT EXISTS mafia_votes231(mafia_id INTEGER NOT NULL,voter_id INTEGER NOT NULL,target_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(mafia_id,voter_id,target_id))`,
 `CREATE TABLE IF NOT EXISTS mafia_comments231(id INTEGER PRIMARY KEY AUTOINCREMENT,mafia_id INTEGER NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,private INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE INDEX IF NOT EXISTS mafia_comments_room231 ON mafia_comments231(mafia_id,private,id)`,
 `CREATE TABLE IF NOT EXISTS mafia_raffle231(week INTEGER NOT NULL,mafia_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(week,mafia_id,user_id))`,
 `CREATE TABLE IF NOT EXISTS mafia_raffle_winners231(week INTEGER NOT NULL,mafia_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(week,mafia_id))`,
 `CREATE TRIGGER IF NOT EXISTS mafia_create231 AFTER INSERT ON mafias BEGIN SELECT CASE WHEN EXISTS(SELECT 1 FROM mafia_members WHERE user_id=NEW.founder_id) THEN RAISE(ABORT,'MAFIA_ALREADY_MEMBER') END; INSERT INTO mafia_members(user_id,mafia_id,role) VALUES(NEW.founder_id,NEW.id,'leader'); INSERT INTO mafia_votes231(mafia_id,voter_id,target_id) VALUES(NEW.id,NEW.founder_id,NEW.founder_id); END`
 ])await db.prepare(q).run();
 for(const col of ["motto231 TEXT NOT NULL DEFAULT ''","emblem231 TEXT NOT NULL DEFAULT ''"])try{await db.prepare('ALTER TABLE mafias ADD COLUMN '+col).run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
 })();ready.set(db,task);try{return await task;}catch(e){ready.delete(db);throw e;}}
export const validUser231="COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND COALESCE(u.is_banned,0)=0";
export const pointExpr231="COALESCE((SELECT CASE s.theme_code "+COLOR_LEVELS.map((l,i)=>"WHEN '"+l.code+"' THEN "+(i+1)).join(' ')+" ELSE 1 END FROM user_inventory i JOIN shop_items s ON s.code=i.item_code WHERE i.user_id=u.id AND i.is_equipped=1 AND s.category='Tarjetas de color' LIMIT 1),1)";
export async function canCreateMafia231(db,user){if(!user||user.is_system||user.is_test_bot)return false;if(user.is_admin)return true;return !!await db.prepare("SELECT 1 FROM user_inventory WHERE user_id=? AND item_code IN ("+COLOR_LEVELS.filter(l=>l.power>=30).map(l=>"'"+l.itemCode+"'").join(',')+")").bind(user.id).first();}
export async function reconcileMafia231(db,id){
 const n=Number((await db.prepare("SELECT COUNT(*) AS n FROM mafia_members m JOIN users u ON u.id=m.user_id WHERE m.mafia_id=? AND m.role<>'aspirant' AND "+validUser231).bind(id).first()).n),required=admissionVotes231(n);
 await db.prepare(`UPDATE mafia_members SET role='member' WHERE mafia_id=? AND role='aspirant' AND (SELECT COUNT(*) FROM mafia_votes231 v JOIN mafia_members m ON m.user_id=v.voter_id AND m.mafia_id=v.mafia_id JOIN users u ON u.id=m.user_id WHERE v.mafia_id=mafia_members.mafia_id AND v.target_id=mafia_members.user_id AND m.role<>'aspirant' AND ${validUser231})>=?`).bind(id,required).run();
 const members=(await db.prepare(`SELECT m.user_id,m.role,COUNT(v.voter_id) AS votes FROM mafia_members m JOIN users u ON u.id=m.user_id LEFT JOIN mafia_votes231 v ON v.mafia_id=m.mafia_id AND v.target_id=m.user_id AND EXISTS(SELECT 1 FROM mafia_members q JOIN users qu ON qu.id=q.user_id WHERE q.user_id=v.voter_id AND q.mafia_id=m.mafia_id AND q.role<>'aspirant' AND COALESCE(qu.is_banned,0)=0) WHERE m.mafia_id=? AND m.role<>'aspirant' AND ${validUser231} GROUP BY m.user_id ORDER BY votes DESC,m.joined_at,m.user_id`).bind(id).all()).results;
 const current=members.find(p=>p.role==='leader'),next=members[0];if(!next)return;
 if(!current||(current.votes<presidentVotes231(members.length)&&next.votes>current.votes)){
 await db.batch([db.prepare("UPDATE mafia_members SET role='member' WHERE mafia_id=? AND role='leader'").bind(id),db.prepare("UPDATE mafia_members SET role='leader' WHERE mafia_id=? AND user_id=? AND role='member'").bind(id,next.user_id),db.prepare('UPDATE mafias SET founder_id=(SELECT user_id FROM mafia_members WHERE mafia_id=? AND role=\'leader\' LIMIT 1) WHERE id=?').bind(id,id)]);
 }
}
