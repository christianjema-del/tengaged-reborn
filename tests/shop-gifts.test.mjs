import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as shops} from '../functions/api/player-shops.js';
import {onRequest as avatar} from '../functions/api/avatar.js';
const sql=new DatabaseSync(':memory:');
sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class S{
 constructor(q,args=[]){this.q=q;this.args=args;}
 bind(...args){return new S(this.q,args);}
 async first(){return sql.prepare(this.q).get(...this.args)||null;}
 async all(){return {results:sql.prepare(this.q).all(...this.args)};}
 async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}};}
}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let id=1;id<=4;id++){
 sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['Seller','Buyer','Recipient','Other'][id-1]);
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex');
 sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');
}
async function call(body,user=2,origin='https://test.local'){
 const r=await shops({request:new Request('https://test.local/api/player-shops',{method:body?'POST':'GET',headers:{Origin:origin,...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}
assert.equal((await call()).status,200);
const oldGiftSQL=sql.prepare("SELECT sql FROM sqlite_master WHERE name='tengaged_shop_gift_guard'").get().sql.replace('AND sh.active=1','AND sh.active=1 AND sh.owner_id<>NEW.buyer_id AND sh.owner_id<>NEW.recipient_id');
sql.exec('DROP TRIGGER tengaged_shop_gift_guard');sql.exec(oldGiftSQL);
assert.equal((await call()).status,200);
assert.equal(sql.prepare("SELECT sql FROM sqlite_master WHERE name='tengaged_shop_gift_guard'").get().sql.includes('sh.owner_id<>NEW.buyer_id'),false);

// Existing deployments still have the old trigger; verify its automatic upgrade.
const legacySource=readFileSync(new URL('../functions/api/player-shops.js',import.meta.url),'utf8');
const legacyGuard=legacySource.replace('AND sh.active=1','AND sh.active=1 AND sh.owner_id<>NEW.buyer_id').match(/CREATE TRIGGER IF NOT EXISTS tengaged_shop_sale_guard[\s\S]*? END`/)[0].slice(0,-1);
sql.exec('DROP TRIGGER tengaged_shop_sale_guard');sql.exec(legacyGuard);
assert.equal((await call()).status,200);
assert.equal(sql.prepare("SELECT sql FROM sqlite_master WHERE name='tengaged_shop_sale_guard'").get().sql.includes('sh.owner_id<>NEW.buyer_id'),false);

sql.exec("UPDATE users SET t_money=100;INSERT INTO player_shops(id,owner_id,name,active) VALUES(1,1,'Test',0);INSERT INTO community_designs(id,user_id,author,title,description,theme_code) VALUES(1,1,'Seller','Hair','','sky');INSERT INTO player_shop_stock VALUES(1,1,3,10)");
const gift={action:'gift',shop_id:1,design_id:1,recipient:'Recipient',message:'Enjoy!'},buy={action:'purchase',shop_id:1,design_id:1};
const snapshot=()=>JSON.stringify({
 money:sql.prepare('SELECT id,t_money FROM users ORDER BY id').all(),
 stock:sql.prepare('SELECT * FROM player_shop_stock').all(),
 inventory:sql.prepare('SELECT * FROM user_inventory ORDER BY user_id,item_code').all(),
 gifts:sql.prepare('SELECT * FROM player_shop_gifts').all()
});
let before=snapshot();
assert.equal((await call(gift)).status,409);
assert.equal((await call(buy)).status,409);
assert.equal(snapshot(),before);
sql.exec('UPDATE player_shops SET active=1');
assert.equal((await call({...gift,recipient:'Nobody'})).status,404);
assert.equal((await call({...gift,recipient:'Buyer'})).status,400);
assert.equal((await call({...gift,recipient:''})).status,400);
assert.equal((await call(gift,0)).status,401);
assert.equal((await call(gift,2,'https://other.local')).status,403);
assert.equal((await call({...gift,recipient:'recipient'})).status,200);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money,90);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,110);
assert.equal(sql.prepare('SELECT quantity FROM player_shop_stock').get().quantity,2);
assert.equal(sql.prepare('SELECT message FROM player_shop_gifts LIMIT 1').get().message,'Enjoy!');
assert.ok(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=3 AND item_code='userdesign-1'").get());
before=snapshot();assert.equal((await call(gift)).status,409);assert.equal(snapshot(),before);
assert.equal((await call(buy)).status,200);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money,80);
const info=await call();assert.deepEqual(info.inventory,['userdesign-1']);
assert.equal((await call(undefined,1)).recent_sales.find(x=>x.recipient).recipient,'Recipient');
// Owner purchases use a real inventory unit, without creating currency.
const sellerMoney=sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money;
const remaining=sql.prepare('SELECT quantity FROM player_shop_stock').get().quantity;
assert.equal((await call(buy,1)).status,200);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,sellerMoney);
assert.equal(sql.prepare('SELECT quantity FROM player_shop_stock').get().quantity,remaining-1);
assert.ok(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=1 AND item_code='userdesign-1'").get());
assert.equal((await call(buy,1)).status,409);
sql.exec('UPDATE player_shop_stock SET quantity=1');
const ownerBalance=sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money;
assert.equal((await call({...gift,recipient:'Other'},1)).status,200);
assert.ok(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=4 AND item_code='userdesign-1'").get());
assert.equal(sql.prepare('SELECT quantity FROM player_shop_stock').get().quantity,0);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,ownerBalance);
assert.equal((await call({...gift,recipient:'Other'},1)).status,409);
sql.exec('UPDATE player_shop_stock SET quantity=1');

sql.exec('UPDATE users SET t_money=0 WHERE id=2');
before=snapshot();assert.equal((await call({...gift,recipient:'Other'})).status,409);assert.equal(snapshot(),before);
// Trigger itself protects against stale client state, even without API prechecks.
assert.throws(()=>sql.exec('INSERT INTO player_shop_gifts(shop_id,design_id,buyer_id,recipient_id,price) VALUES(1,1,2,4,10)'));
assert.equal(snapshot(),before);
sql.exec('UPDATE users SET t_money=100 WHERE id=2;UPDATE player_shop_stock SET quantity=0');
before=snapshot();assert.equal((await call({...gift,recipient:'Other'})).status,409);assert.equal(snapshot(),before);
console.log('PASS: inactive storefront, purchase, gift, recipient inventory, seller credit, stock, insufficient funds, duplicates, authentication, origin and atomic trigger rollback.');

sql.exec("UPDATE community_designs SET layer_type='hair',image_data='data:image/png;base64,YQ==' WHERE id=1");
async function avatarCall(body,user=3,query='?format=json'){
 const r=await avatar({request:new Request('https://test.local/api/avatar'+query,{method:body?'POST':'GET',headers:{Origin:'https://test.local',Cookie:'session='+String(user).repeat(64),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}
let wardrobe=await avatarCall();
assert.equal(wardrobe.status,200);
assert.equal(wardrobe.wardrobe[0].id,1);
assert.equal(wardrobe.wardrobe[0].has_image,1);
assert.equal(wardrobe.layers.length,0);
const settings=wardrobe.settings;
assert.equal((await avatarCall({settings,layers:{hair:1}})).status,200);
wardrobe=await avatarCall();assert.equal(wardrobe.layers[0].design_id,1);
assert.equal(sql.prepare("SELECT is_equipped FROM user_inventory WHERE user_id=3 AND item_code='userdesign-1'").get().is_equipped,1);
const prior=JSON.stringify(sql.prepare('SELECT * FROM user_avatar_settings').all());
assert.equal((await avatarCall({settings:{...settings,hair:2},layers:{shirt:1}})).status,403);
assert.equal(JSON.stringify(sql.prepare('SELECT * FROM user_avatar_settings').all()),prior);
sql.exec("DELETE FROM user_inventory WHERE user_id=4");
assert.equal((await avatarCall({settings,layers:{hair:1}},4)).status,403);
assert.equal((await avatarCall({settings,layers:{hair:999}})).status,403);
assert.equal((await avatarCall({settings,layers:{}})).status,200);
assert.equal((await avatarCall()).layers.length,0);
assert.equal(sql.prepare("SELECT is_equipped FROM user_inventory WHERE user_id=3 AND item_code='userdesign-1'").get().is_equipped,0);
assert.equal((await avatarCall(undefined,2)).wardrobe[0].id,1);
console.log('PASS: purchased and gifted designs enter wardrobe, owned layers save atomically, invalid ownership/category cannot change settings, removal preserves inventory.');

// A creator is not automatically an inventory owner. Gifts can target the seller.
sql.exec("UPDATE users SET t_money=100 WHERE id=2;INSERT INTO community_designs(id,user_id,author,title,description,theme_code,layer_type,image_data) VALUES(2,1,'Seller','Smile','','sky','mouth','data:image/png;base64,YQ==');INSERT INTO player_shop_stock VALUES(1,2,1,7)");
const senderBalance=sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money;
const recipientBalance=sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money;
assert.equal(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=1 AND item_code='userdesign-2'").get(),undefined);
assert.equal((await call({action:'gift',shop_id:1,design_id:2,recipient:'Seller'},2)).status,200);
assert.ok(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=1 AND item_code='userdesign-2'").get());
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money,senderBalance-7);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,recipientBalance+7);
assert.equal(sql.prepare('SELECT quantity FROM player_shop_stock WHERE design_id=2').get().quantity,0);
assert.equal((await avatarCall(undefined,1)).wardrobe.some(d=>d.id===2),true);
sql.exec('UPDATE player_shop_stock SET quantity=1 WHERE design_id=2');
assert.equal((await call({action:'gift',shop_id:1,design_id:2,recipient:'Seller'},2)).status,409);
console.log('PASS: gifts to shop owner use actual inventory, transfer once and appear in avatar wardrobe.');
