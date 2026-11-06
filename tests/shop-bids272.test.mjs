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
let queue=Promise.resolve();
const db={prepare:q=>new S(q),batch:ss=>{const job=queue.then(async()=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}});queue=job.catch(()=>{});return job;}};
for(let id=1;id<=7;id++){
 sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['Seller','Buyer','Recipient','Other','Five','Six','Seven'][id-1]);
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex');
 sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');
}
async function call(body,user=2,origin='https://test.local'){
 const r=await shops({request:new Request('https://test.local/api/player-shops',{method:body?'POST':'GET',headers:{Origin:origin,...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}
assert.equal((await call(null,0)).status,200);
// Old triggers from production must disappear without touching any balance.
sql.exec(`CREATE TRIGGER IF NOT EXISTS tengaged_shop_bid_insert_charge AFTER INSERT ON player_shop_bids BEGIN UPDATE users SET t_money=t_money-NEW.amount; END`);
sql.exec(`DROP TRIGGER tengaged_shop_bid_update_guard;CREATE TRIGGER tengaged_shop_bid_update_guard BEFORE UPDATE OF amount ON player_shop_bids BEGIN SELECT CASE WHEN NEW.amount-OLD.amount<0 THEN RAISE(ABORT,'x') END; END`);
assert.equal((await call(null,0)).status,200);
assert.equal(sql.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE '%bid%charge'").all().length,0);
sql.exec("UPDATE users SET t_money=100");
for(const [id,name] of [[1,'Uno'],[2,'Dos'],[3,'Tres'],[4,'Cuatro'],[5,'Cinco'],[6,'Seis'],[7,'Siete']])sql.prepare('INSERT INTO player_shops(id,owner_id,name) VALUES(?,?,?)').run(id,id,name);
const money=id=>sql.prepare('SELECT t_money FROM users WHERE id=?').get(id).t_money,all=()=>[1,2,3,4,5,6,7].map(money);
const bid=(amount,user)=>call({action:'bid',amount},user);
assert.equal((await bid(50,1)).status,200);assert.equal(money(1),100);
assert.equal((await bid(70,1)).status,200);assert.equal(money(1),100);
assert.equal((await bid(70,1)).status,400);
assert.equal((await bid(101,1)).status,409);
for(const [user,amount] of [[2,60],[3,50],[4,40],[5,30],[6,20],[7,10]])assert.equal((await bid(amount,user)).status,200);
assert.deepEqual(all(),[100,100,100,100,100,100,100]);
sql.exec('UPDATE users SET t_money=5 WHERE id=2'); // spent the money before the round ended
const close=()=>sql.exec("UPDATE player_shop_cycles SET ends_at=strftime('%s','now')-1 WHERE settled=0");
const active=()=>sql.prepare('SELECT id FROM player_shops WHERE active=1 ORDER BY id').all().map(x=>x.id);
close();await Promise.all([call(null,0),call(null,0),call(null,0)]); // simultaneous visits must settle once
assert.deepEqual(active(),[1,3,4,5,6]);
assert.deepEqual(all(),[30,5,50,60,70,80,100]);
await call(null,0);assert.deepEqual(all(),[30,5,50,60,70,80,100]);
// A round without bids closes every showcase and charges nobody.
close();await call(null,0);assert.deepEqual(active(),[]);assert.equal(money(1),30);
console.log('shop bids ok');
