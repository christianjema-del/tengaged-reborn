import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {onRequest as mail} from '../functions/api/mail.js';
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)");
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let id=1;id<=3;id++){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['Alice','Bob','Carol'][id-1]);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex'),id,'2099-01-01');}
const call=async(user,body,origin='https://test.local')=>{const r=await mail({request:new Request('https://test.local/api/mail',{method:body?'POST':'GET',headers:{Origin:origin,...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});return {status:r.status,...await r.json()};};
await call(1);
sql.prepare("INSERT INTO private_messages(sender,recipient,subject,body) VALUES(1,2,'a','b'),(3,2,'c','d'),(1,2,'e','f'),(2,3,'g','h')").run();
assert.equal((await call(2)).unread,3);
assert.equal((await call(2,{action:'read_all'},'https://evil.test')).status,403);
let r=await call(2,{action:'read_all'});assert.equal(r.ok,true);assert.equal(r.unread,0);assert.equal(r.marked,3);assert.match(r.message,/3 correos marcados como leídos/);
assert.equal((await call(2)).unread,0);assert.equal((await call(3)).unread,1,'los correos de otros no se tocan');
r=await call(2,{action:'read_all'});assert.equal(r.marked,0);assert.match(r.message,/No tenías/);
assert.equal((await call(0,{action:'read_all'})).status,401);
