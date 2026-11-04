export async function ensureFriendLists(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS friend_links(owner INTEGER NOT NULL,friend INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(owner,friend),CHECK(owner<>friend))').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS friend_migrations130(key TEXT PRIMARY KEY)').run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS friend_lists_import130 AFTER INSERT ON friend_migrations130 WHEN NEW.key='lists130' BEGIN
 INSERT OR IGNORE INTO friend_links(owner,friend) SELECT sender,receiver FROM friendships WHERE status='accepted';
 INSERT OR IGNORE INTO friend_links(owner,friend) SELECT receiver,sender FROM friendships WHERE status='accepted';
 INSERT OR IGNORE INTO friend_links(owner,friend) SELECT sender,receiver FROM friend_requests WHERE sender<>receiver;
 END`).run();
 await db.prepare("INSERT OR IGNORE INTO friend_migrations130(key) VALUES('lists130')").run();
}
