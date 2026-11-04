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
assert.equal((await call(null,0)).status,200);
sql.exec("UPDATE users SET t_money=100;DELETE FROM user_inventory;DELETE FROM withdrawn_designs;INSERT INTO player_shops(id,owner_id,name,active) VALUES(101,1,'Mi tienda',1);INSERT INTO community_designs(id,user_id,author,title,description,theme_code) VALUES(1001,1,'Seller','Pelo','','sky');INSERT INTO player_shop_stock VALUES(101,1001,4,10)");
assert.equal((await call({action:'purchase',shop_id:101,design_id:1001},2)).status,200);
assert.equal((await call({action:'gift',shop_id:101,design_id:1001,recipient:'Recipient',message:'Para ti'},4)).status,200);
let data=await call(null,0),shop=data.shops.find(s=>s.id===101);
assert.equal(shop.lifetime_value,20);assert.equal(shop.cycle_value,20);
assert.equal(data.public_sales[0].buyer,'Buyer');assert.equal(data.public_gifts[0].recipient,'Recipient');assert.equal(data.public_gifts[0].message,'Para ti');
assert.equal(data.inventory.length,0);assert.equal(data.recent_sales.length,0);
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a96kAAAAASUVORK5CYII=';
assert.equal((await call({action:'set_logo',image_data:png},2)).status,403);
assert.equal((await call({action:'set_logo',image_data:'data:image/svg+xml;base64,AAAA'},1)).status,400);
assert.equal((await call({action:'set_logo',image_data:png},1)).status,200);
data=await call(null,0);assert.equal(data.shops.find(s=>s.id===101).has_logo,1);
const r=await shops({request:new Request('https://test.local/api/player-shops?image=101'),env:{DB:db}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.equal(new Uint8Array(await r.arrayBuffer())[0],137);
assert.equal((await call({action:'set_logo',image_data:null},1)).status,200);
assert.equal((await call(null,0)).shops.find(s=>s.id===101).has_logo,0);
sql.exec('UPDATE users SET is_banned=1 WHERE id=3');assert.equal((await call(null,0)).public_gifts.length,0);
sql.exec('INSERT INTO withdrawn_designs(design_id) VALUES(1001)');data=await call(null,0);assert.equal(data.public_sales.length,0);assert.equal(data.products.some(x=>x.design_id===1001),false);
console.log('PASS: public shopping totals, real purchases/gifts, guest privacy, authorized shop logos, invalid uploads, image delivery and withdrawn designs.');
