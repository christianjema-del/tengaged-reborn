import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as shops} from '../functions/api/player-shops.js';
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
sql.exec("UPDATE users SET t_money=100;INSERT INTO player_shops(id,owner_id,name,active) VALUES(101,1,'Mi tienda',1);INSERT INTO community_designs(id,user_id,author,title,description,theme_code) VALUES(1001,1,'Seller','Pelo','','sky'),(1002,1,'Seller','Ojos','','sky'),(1003,2,'Buyer','Ajeno','','sky')");
const stock=(design_id,quantity,price=10)=>call({action:'stock',design_id,quantity,price},1);
assert.equal((await stock(1003,1)).status,403);
assert.equal((await stock(1001,0)).status,400);
assert.equal((await stock(1001,6)).status,200);
assert.equal((await stock(1001,4,30)).status,200);
let row=sql.prepare('SELECT quantity,price FROM player_shop_stock WHERE design_id=1001').get();
assert.equal(row.quantity,10);assert.equal(row.price,30);
assert.equal((await stock(1002,500)).status,200);
assert.equal((await stock(1002,1000)).status,200);
let data=await call(null,1);assert.equal(data.stock_posted,1510);assert.equal(data.stock_limit,undefined);
assert.equal((await call({action:'purchase',shop_id:101,design_id:1001},2)).status,200);
data=await call(null,1);assert.equal(data.stock_posted,1510);assert.deepEqual(data.my_sold.map(x=>[x.design_id,x.sold]),[[1001,1]]);
sql.exec('INSERT INTO withdrawn_designs(design_id) VALUES(1002)');
assert.equal((await call(null,1)).stock_posted,10);
assert.equal((await call(null,2)).stock_posted,0);
console.log('shop stock ok');
