const ready=new WeakMap();
export async function ensureProfileClassic166(db){if(ready.has(db))return ready.get(db);const task=(async()=>{
 await db.prepare(`CREATE TABLE IF NOT EXISTS profile_donations166(donor_id INTEGER NOT NULL,recipient_id INTEGER NOT NULL,day TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(donor_id,recipient_id,day))`).run();
 await db.prepare(`CREATE INDEX IF NOT EXISTS profile_donations_recipient166 ON profile_donations166(recipient_id,day)`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS profile_donation_guard166 BEFORE INSERT ON profile_donations166 BEGIN
 SELECT CASE WHEN NEW.donor_id=NEW.recipient_id OR NEW.day<>strftime('%Y-%m-%d','now') OR NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.donor_id AND is_banned=0 AND is_system=0 AND is_test_bot=0) OR NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.recipient_id AND is_banned=0 AND is_system=0 AND is_test_bot=0) THEN RAISE(ABORT,'DONATION_NOT_ALLOWED166') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM profile_donations166 WHERE recipient_id=NEW.recipient_id AND day=NEW.day)>=30 THEN RAISE(ABORT,'DONATION_LIMIT166') END; END`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS profile_donation_apply166 AFTER INSERT ON profile_donations166 BEGIN UPDATE users SET t_money=ROUND(COALESCE(t_money,0)+0.1,2) WHERE id=NEW.recipient_id; END`).run();
 })();ready.set(db,task);try{await task;}catch(e){ready.delete(db);throw e;}}
