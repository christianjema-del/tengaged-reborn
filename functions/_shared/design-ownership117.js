import {ensureAvatar} from './avatar-settings.js';
// Archive old automatic author grants before removing them. Purchased and expressly granted pieces stay.
export async function fixAuthorGrants(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS design_owner_archive117(user_id INTEGER,item_code TEXT,is_equipped INTEGER,design_id INTEGER,PRIMARY KEY(user_id,item_code))').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS design_owner_migrations117(key TEXT PRIMARY KEY)').run();if(await db.prepare("SELECT key FROM design_owner_migrations117 WHERE key='author-grants'").first())return;
 await ensureAvatar(db);const tables=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name));
 const protectedClauses=["d.title NOT LIKE '[REGAGED]%'","NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=d.id)"];
 if(tables.has('wardrobe_imports'))protectedClauses.push('NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE design_id=d.id AND user_id=i.user_id)');
 if(tables.has('player_shop_sales'))protectedClauses.push('NOT EXISTS(SELECT 1 FROM player_shop_sales WHERE design_id=d.id AND buyer_id=i.user_id)');
 if(tables.has('player_shop_gifts'))protectedClauses.push('NOT EXISTS(SELECT 1 FROM player_shop_gifts WHERE design_id=d.id AND recipient_id=i.user_id)');
 protectedClauses.push("NOT (LOWER(d.author)='cristi' AND EXISTS(SELECT 1 FROM design_updates WHERE key='wardrobes92') AND ((d.id=15 AND d.title='Roja') OR (d.id=16 AND d.title='Peliii') OR (d.id=17 AND d.title='Bigotes') OR (d.id=19 AND d.title='Ojitos') OR (d.id=20 AND d.title='Fondito') OR (d.id=21 AND d.title='Pelito 2')))");
 protectedClauses.push("NOT EXISTS(SELECT 1 FROM design_auctions WHERE design_id=d.id AND highest_bidder_id=i.user_id AND status='sold')");
 await db.batch([
 db.prepare(`INSERT OR IGNORE INTO design_owner_archive117(user_id,item_code,is_equipped,design_id) SELECT i.user_id,i.item_code,i.is_equipped,d.id FROM user_inventory i JOIN community_designs d ON i.item_code='userdesign-'||d.id AND d.user_id=i.user_id WHERE ${protectedClauses.join(' AND ')} AND NOT EXISTS(SELECT 1 FROM design_owner_migrations117 WHERE key='author-grants')`),
 db.prepare("DELETE FROM user_avatar_layers WHERE EXISTS(SELECT 1 FROM design_owner_archive117 a WHERE a.user_id=user_avatar_layers.user_id AND a.design_id=user_avatar_layers.design_id) AND NOT EXISTS(SELECT 1 FROM design_owner_migrations117 WHERE key='author-grants')"),
 db.prepare("DELETE FROM user_inventory WHERE EXISTS(SELECT 1 FROM design_owner_archive117 a WHERE a.user_id=user_inventory.user_id AND a.item_code=user_inventory.item_code) AND NOT EXISTS(SELECT 1 FROM design_owner_migrations117 WHERE key='author-grants')"),
 db.prepare("INSERT OR IGNORE INTO design_owner_migrations117(key) VALUES('author-grants')")]);
}
