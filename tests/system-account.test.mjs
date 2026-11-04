import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureSystemAccount} from '../functions/_shared/system-account.js';
import {onRequestPost as register} from '../functions/api/register.js';
import {onRequestPost as login} from '../functions/api/login.js';
import {onRequest as shops} from '../functions/api/player-shops.js';
import {onRequest as mail} from '../functions/api/mail.js';
import {onRequestGet as hof} from '../functions/api/hall-of-fame.js';
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,email TEXT UNIQUE,password_hash TEXT,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0,is_admin INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);INSERT INTO users(id,username,email,password_hash,t_money) VALUES(1,'Seller','seller@example.test','test',100)");
class S{constructor(q,args=[]){this.q=q;this.args=args;}bind(...args){return new S(this.q,args);}async first(){return sql.prepare(this.q).get(...this.args)||null;}async all(){return {results:sql.prepare(this.q).all(...this.args)};}async run(){const r=sql.prepare(this.q).run(...this.args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const out=[];for(const s of ss)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
async function call(fn,path,user,body){const r=await fn({request:new Request('https://test.local/'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local',...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});return {status:r.status,...await r.json()};}
async function session(id){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');}
const sysid=await ensureSystemAccount(db);assert.equal(await ensureSystemAccount(db),sysid);
const system=sql.prepare('SELECT * FROM users WHERE id=?').get(sysid);
assert.equal(system.username,'Tengaged');assert.equal(system.is_system,1);assert.equal(system.is_admin,0);assert.ok(system.password_hash.startsWith('system-disabled:'));
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM private_messages').get().n,0);
const signup={username:'Alice',email:'alice@example.test',password:'test-password'};
const alice=await call(register,'api/register',null,signup);assert.equal(alice.status,200);await session(alice.id);await session(1);
let inbox=await call(mail,'api/mail',alice.id);
assert.equal(inbox.messages.length,1);assert.equal(inbox.unread,1);
assert.equal(inbox.messages[0].sender,'Tengaged');assert.equal(inbox.messages[0].system_sender,1);
assert.ok(inbox.messages[0].body.includes('Hola, Alice'));
assert.ok(inbox.messages[0].body.includes('Editar avatar'));
assert.equal((await call(register,'api/register',null,signup)).status,409);
assert.equal((await call(register,'api/register',null,{...signup,username:'tEnGaGeD',email:'other@example.test'})).status,409);
assert.equal((await call(mail,'api/mail',alice.id)).messages.length,1);
assert.equal((await call(mail,'api/mail',alice.id,{action:'send',recipient:'Tengaged',body:'Hello'})).status,403);
assert.equal((await call(mail,'api/mail',alice.id,{action:'block',recipient:'Tengaged'})).status,403);
// Even a forced known password cannot turn the automation account into a player.
const testHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('test-password'))).toString('hex');
sql.prepare('UPDATE users SET password_hash=? WHERE id=?').run(testHash,sysid);
assert.equal((await call(login,'api/login',null,{username:'Tengaged',password:'test-password'})).status,403);
await session(sysid);
assert.equal((await call(mail,'api/mail',sysid)).status,401);
assert.equal((await call(shops,'api/player-shops',sysid,{action:'create',name:'Forbidden',description:'Cannot play'})).status,401);
assert.equal((await call(shops,'api/player-shops',1)).status,200);
sql.exec("INSERT INTO player_shops(id,owner_id,name,active) VALUES(1,1,'Shop',1);INSERT INTO community_designs(id,user_id,author,title,description,theme_code,layer_type) VALUES(1,1,'Seller','Hair gift','','sky','hair');INSERT INTO player_shop_stock VALUES(1,1,2,10)");
const gift={action:'gift',shop_id:1,design_id:1,recipient:'Alice',message:'Enjoy your new hair!'};
assert.equal((await call(shops,'api/player-shops',1,gift)).status,200);
inbox=await call(mail,'api/mail',alice.id);assert.equal(inbox.messages.length,2);assert.equal(inbox.unread,2);
assert.ok(inbox.messages[0].body.includes('Seller te ha regalado'));
assert.ok(inbox.messages[0].body.includes('Enjoy your new hair!'));
assert.equal((await call(shops,'api/player-shops',1,gift)).status,409);
assert.equal((await call(mail,'api/mail',alice.id)).messages.length,2);
// A notification failure rolls back the whole gift, including stock and money.
sql.exec("INSERT INTO community_designs(id,user_id,author,title,description,theme_code) VALUES(2,1,'Seller','Second gift','','sky');INSERT INTO player_shop_stock VALUES(1,2,1,10);CREATE TRIGGER test_message_failure BEFORE INSERT ON private_messages WHEN NEW.system_event LIKE 'gift:%' BEGIN SELECT RAISE(ABORT,'test failure');END;");
const before=JSON.stringify(sql.prepare('SELECT id,t_money FROM users ORDER BY id').all());
assert.equal((await call(shops,'api/player-shops',1,{...gift,design_id:2})).status,409);
assert.equal(sql.prepare('SELECT quantity FROM player_shop_stock WHERE design_id=2').get().quantity,1);
assert.equal(sql.prepare("SELECT 1 FROM user_inventory WHERE user_id=? AND item_code='userdesign-2'").get(alice.id),undefined);
assert.equal(JSON.stringify(sql.prepare('SELECT id,t_money FROM users ORDER BY id').all()),before);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM player_shop_gifts').get().n,1);
sql.exec('DROP TRIGGER test_message_failure');
assert.equal((await call(shops,'api/player-shops',1,{...gift,design_id:2})).status,200);
assert.equal((await call(mail,'api/mail',alice.id)).messages.length,3);
assert.equal((await hof({env:{DB:db}})).status,200);
assert.equal((await (await hof({env:{DB:db}})).json()).leaders.some(u=>u.username==='Tengaged'),false);
await call(mail,'api/mail',alice.id,{action:'read',id:inbox.messages[0].id});
assert.equal((await call(mail,'api/mail',alice.id)).unread,2);
// Registration and its welcome are one atomic insertion as well.
sql.exec("CREATE TRIGGER test_welcome_failure BEFORE INSERT ON private_messages WHEN NEW.system_event LIKE 'welcome:%' BEGIN SELECT RAISE(ABORT,'test failure');END;");
assert.equal((await call(register,'api/register',null,{username:'Carol',email:'carol@example.test',password:'test-password'})).status,500);
assert.equal(sql.prepare("SELECT 1 FROM users WHERE username='Carol'").get(),undefined);
sql.exec('DROP TRIGGER test_welcome_failure');
assert.equal((await call(register,'api/register',null,{username:'Carol',email:'carol@example.test',password:'test-password'})).status,200);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM private_messages WHERE system_event LIKE 'welcome:%'").get().n,2);
console.log('PASS: reserved send-only system account, one welcome per registration, one gift notification per success, dedication, unread counts, disabled login and atomic rollback.');
