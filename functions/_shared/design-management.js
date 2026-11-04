// Withdrawal keeps existing wardrobe purchases and artwork recoverable.
export async function ensureDesignManagement(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS withdrawn_designs(design_id INTEGER PRIMARY KEY,withdrawn_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS design_updates(key TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 if(await db.prepare("SELECT key FROM design_updates WHERE key='wardrobes92'").first())return;
 const expected=[[15,'Roja'],[16,'Peliii'],[17,'Bigotes'],[18,'Ojos'],[19,'Ojitos'],[20,'Fondito'],[21,'Pelito 2']];
 const cristi=await db.prepare("SELECT id FROM users WHERE LOWER(username)='cristi'").first();
 const admin=await db.prepare("SELECT id FROM users WHERE LOWER(username)='admin1'").first();
 if(!cristi||!admin)return;
 for(const [id,title] of expected){const d=await db.prepare('SELECT user_id,title FROM community_designs WHERE id=?').bind(id).first();if(d?.user_id!==cristi.id||d.title!==title)return;}
 // Atomic, idempotent and guarded by the observed author, IDs and titles.
 await db.batch([
 ...[15,16,17,19,20,21].map(id=>db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM design_updates WHERE key='wardrobes92')").bind(cristi.id,'userdesign-'+id)),
 db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?, 'userdesign-17' WHERE NOT EXISTS(SELECT 1 FROM design_updates WHERE key='wardrobes92')").bind(admin.id),
 db.prepare("INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT 18 WHERE NOT EXISTS(SELECT 1 FROM design_updates WHERE key='wardrobes92')"),
 db.prepare("INSERT OR IGNORE INTO design_updates(key) VALUES('wardrobes92')")]);
}
