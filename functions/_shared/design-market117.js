export async function ensureDesignMarket(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS design_market_meta117(key TEXT PRIMARY KEY,value INTEGER NOT NULL)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS design_auction_cycles117(slot INTEGER PRIMARY KEY,created_at TEXT DEFAULT CURRENT_TIMESTAMP)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS auction_awards117(auction_id INTEGER PRIMARY KEY,buyer_id INTEGER NOT NULL,seller_id INTEGER NOT NULL,design_id INTEGER NOT NULL,amount INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP)').run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS auction_credit117 AFTER INSERT ON auction_awards117 BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.buyer_id AND t_money>=NEW.amount) THEN RAISE(ABORT,'Saldo insuficiente') END;
 UPDATE users SET t_money=t_money-NEW.amount WHERE id=NEW.buyer_id;
 UPDATE users SET t_money=t_money+NEW.amount WHERE id=NEW.seller_id AND id<>NEW.buyer_id;
 INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(NEW.buyer_id,'userdesign-'||NEW.design_id);
 UPDATE design_auctions SET status='sold',settled_at=CURRENT_TIMESTAMP WHERE id=NEW.auction_id;
 END`).run();
 const slot=Math.floor(Date.now()/43200000);await db.prepare("INSERT OR IGNORE INTO design_market_meta117(key,value) VALUES('started',?)").bind(slot).run();
 const initial=await db.prepare("SELECT value FROM design_market_meta117 WHERE key='started'").first();
 if(slot>initial.value)await db.batch([
 db.prepare('INSERT OR IGNORE INTO design_auction_cycles117(slot) VALUES(?)').bind(slot),
 db.prepare(`INSERT INTO design_auctions(design_id,seller_id,starting_bid,ends_at)
 SELECT d.id,d.user_id,10,datetime('now','+12 hours') FROM community_designs d
 WHERE changes()=1 AND d.image_data IS NOT NULL AND d.created_at>=datetime('now','-3 days')
 AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=d.id)
 AND NOT EXISTS(SELECT 1 FROM design_auctions WHERE design_id=d.id)
 AND d.initial_points159+COALESCE((SELECT SUM(value*weight) FROM design_likes WHERE design_id=d.id),0)>0
 ORDER BY d.initial_points159+COALESCE((SELECT SUM(value*weight) FROM design_likes WHERE design_id=d.id),0) DESC,d.created_at,d.id LIMIT 1`)
 ]);
 return (slot+1)*43200000;
}
export async function settleDesignAuctions(db){
 const expired=(await db.prepare("SELECT id FROM design_auctions WHERE status='open' AND ends_at<=CURRENT_TIMESTAMP ORDER BY id LIMIT 30").all()).results;
 for(const a of expired)await db.batch([
 db.prepare(`INSERT OR IGNORE INTO auction_awards117(auction_id,buyer_id,seller_id,design_id,amount)
 SELECT a.id,a.highest_bidder_id,a.seller_id,a.design_id,a.current_bid FROM design_auctions a
 WHERE a.id=? AND a.status='open' AND a.ends_at<=CURRENT_TIMESTAMP AND a.current_bid>0
 AND EXISTS(SELECT 1 FROM users WHERE id=a.highest_bidder_id AND t_money>=a.current_bid)` ).bind(a.id),
 db.prepare("UPDATE design_auctions SET status='unsold',settled_at=CURRENT_TIMESTAMP WHERE id=? AND status='open' AND ends_at<=CURRENT_TIMESTAMP AND NOT EXISTS(SELECT 1 FROM auction_awards117 WHERE auction_id=?)").bind(a.id,a.id)
 ]);
}
