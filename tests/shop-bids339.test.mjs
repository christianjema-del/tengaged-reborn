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
// V339: la regla antigua (solo dejaba subir la puja) se sustituye sola.
sql.exec(`DROP TRIGGER tengaged_shop_bid_update_guard;CREATE TRIGGER tengaged_shop_bid_update_guard BEFORE UPDATE OF amount ON player_shop_bids BEGIN SELECT CASE WHEN NEW.amount<=OLD.amount OR NEW.shop_id<>OLD.shop_id THEN RAISE(ABORT,'Nueva puja no válida o saldo insuficiente') END; END`);
assert.equal((await call(null,0)).status,200);
assert.ok(!/NEW\.amount<=OLD\.amount/.test(sql.prepare("SELECT sql FROM sqlite_master WHERE name='tengaged_shop_bid_update_guard'").get().sql));
sql.exec("UPDATE users SET t_money=300");sql.prepare('INSERT INTO player_shops(id,owner_id,name) VALUES(1,1,?)').run('EL REINO');
const bid=(amount,user=1)=>call({action:'bid',amount},user),current=()=>sql.prepare('SELECT amount FROM player_shop_bids WHERE shop_id=1').get()?.amount??null;
let r=await bid(200);assert.equal(r.status,200,JSON.stringify(r));assert.equal(current(),200);
r=await bid(50);assert.equal(r.status,200,JSON.stringify(r));assert.equal(current(),50,'se puede bajar');assert.match(r.message,/bajada de 200 a 50/);
r=await bid(120);assert.equal(r.status,200);assert.equal(current(),120,'y volver a subir');
assert.equal((await bid(120)).status,400,'la misma cantidad no cambia nada');
assert.equal((await bid(301)).status,409,'nunca por encima del saldo');
r=await bid(0);assert.equal(r.status,200);assert.equal(current(),null,'con 0 se retira');assert.equal((await bid(0)).status,400);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,300,'pujar no cobra nada');
assert.equal((await bid(-5)).status,400);
console.log('PASS pujas de tienda: subir, bajar, retirar con 0, sin cobrar al pujar y con la regla antigua sustituida');
