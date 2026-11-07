import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {onRequest as rename} from '../functions/api/change-username.js';
import {checkNewName} from '../functions/_shared/username-change296.js';
const sql=new DatabaseSync(':memory:');
sql.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money REAL DEFAULT 0,is_banned INTEGER DEFAULT 0,is_system INTEGER DEFAULT 0,is_test_bot INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sessions(id INTEGER PRIMARY KEY,token_hash TEXT,user_id INTEGER,expires_at TEXT);
CREATE TABLE user_stats(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,games_played INTEGER DEFAULT 0);
CREATE TABLE user_game_history(id INTEGER PRIMARY KEY,username TEXT NOT NULL,game_type TEXT,game_id TEXT,status TEXT DEFAULT 'active',placement TEXT,joined_at TEXT,finished_at TEXT);
CREATE UNIQUE INDEX ugh ON user_game_history(game_type,game_id,LOWER(username));
CREATE TABLE blog_posts(id INTEGER PRIMARY KEY,user_id INTEGER,author TEXT,title TEXT);
CREATE TABLE casting_matches(id INTEGER PRIMARY KEY,state TEXT,revision INTEGER DEFAULT 0);
CREATE TABLE hunger_arena(id INTEGER PRIMARY KEY,state TEXT,revision INTEGER DEFAULT 0);
CREATE TABLE hunger_history(edition INTEGER PRIMARY KEY,finished_at INTEGER,state TEXT);
`);
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}},env={DB:db};
const hex=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
const people=[[1,'admin1',9999],[2,'Lamine',1250.6],[3,'Peach',100],[4,'Giovanni',800],[5,'Tengaged',0]];
for(const [id,n,m] of people){sql.prepare('INSERT INTO users(id,username,email,t_money,is_admin,is_system) VALUES(?,?,?,?,?,?)').run(id,n,n+'@x.test',m,id===1?1:0,id===5?1:0);sql.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await hex(String(id).repeat(64)),id,'2099-01-01');}
sql.prepare("INSERT INTO user_stats(username) VALUES('Lamine'),('Peach')").run();
sql.prepare("INSERT INTO user_game_history(username,game_type,game_id) VALUES('Lamine','HUNGER','8'),('Lamine','CASTING','11'),('Peach','HUNGER','8')").run();
sql.prepare("INSERT INTO blog_posts(user_id,author,title) VALUES(2,'Lamine','Hola'),(3,'Peach','Lamine mola')").run();
const casting={players:[{username:'Lamine',status:'active'},{username:'Peach',status:'active'}],ballots:{lamine:'peach',peach:'lamine'},flashScores:{Lamine:120},events:[{text:'Lamine gana la inmunidad'}],winner:null};
const hunger={edition:8,phase:'active',players:[{id:2,username:'Lamine',weapon:'mace'},{id:4,username:'Giovanni'}],fights:[{attacker:2,names:{attacker:'Lamine'}}]};
sql.prepare('INSERT INTO casting_matches(id,state,revision) VALUES(11,?,5)').run(JSON.stringify(casting));
sql.prepare('INSERT INTO hunger_arena(id,state,revision) VALUES(1,?,10)').run(JSON.stringify(hunger));
sql.prepare('INSERT INTO hunger_history(edition,state) VALUES(7,?)').run(JSON.stringify({players:[{id:2,username:'Lamine'}]}));
const call=async(fn,id,path,body,origin='https://t.test')=>{const r=await fn({env,request:new Request('https://t.test/api/'+path,{method:body?'POST':'GET',headers:{Origin:origin,...(id?{Cookie:'session='+String(id).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})});return {status:r.status,...await r.json()};};

// Validación del nombre
assert.throws(()=>checkNewName('ab'),/entre 3 y 24/);assert.throws(()=>checkNewName('Lámine'),/sin tildes/);
assert.throws(()=>checkNewName('admin'),/reservado/);assert.throws(()=>checkNewName('bot_x'),/reservado/);assert.throws(()=>checkNewName('active'),/reservado/);assert.throws(()=>checkNewName('mace'),/reservado/);
assert.equal(checkNewName(' LamineKing '),'LamineKing');

// Consulta y bloqueos
let r=await call(rename,2,'change-username');assert.equal(r.ok,true);assert.equal(r.price,500);assert.equal(r.allowed,true);assert.equal(r.username,'Lamine');
assert.equal((await call(rename,null,'change-username')).status,401);
assert.equal((await call(rename,1,'change-username',{username:'Jefe'})).status,403,'admin1 no cambia de nombre');
assert.ok([401,403].includes((await call(rename,5,'change-username',{username:'Sistema2'})).status),'la cuenta del sistema no cambia');
assert.equal((await call(rename,2,'change-username',{username:'Otro'},'https://evil.test')).status,403);
r=await call(rename,3,'change-username',{username:'Melocoton'});assert.equal(r.status,402,'Peach no tiene 500 T$');assert.equal(sql.prepare("SELECT username FROM users WHERE id=3").get().username,'Peach');
r=await call(rename,2,'change-username',{username:'giovanni'});assert.equal(r.status,409,'nombre ocupado sin importar mayúsculas');
r=await call(rename,2,'change-username',{username:'Lamine'});assert.equal(r.status,400);

// Cambio real
r=await call(rename,2,'change-username',{username:'LamineKing'});assert.equal(r.ok,true,r.message);assert.equal(r.username,'LamineKing');assert.equal(Math.round(r.money*10)/10,750.6);
assert.equal(sql.prepare('SELECT username FROM users WHERE id=2').get().username,'LamineKing');
assert.deepEqual(sql.prepare("SELECT username FROM user_stats ORDER BY id").all().map(x=>x.username),['LamineKing','Peach']);
assert.deepEqual(sql.prepare("SELECT username FROM user_game_history ORDER BY id").all().map(x=>x.username),['LamineKing','LamineKing','Peach']);
assert.deepEqual(sql.prepare("SELECT author,title FROM blog_posts ORDER BY id").all().map(x=>x.author+':'+x.title),['LamineKing:Hola','Peach:Lamine mola']);
const c=JSON.parse(sql.prepare('SELECT state FROM casting_matches').get().state),cr=sql.prepare('SELECT revision FROM casting_matches').get().revision;
assert.equal(c.players[0].username,'LamineKing');assert.deepEqual(c.ballots,{lamineking:'peach',peach:'lamineking'});assert.deepEqual(c.flashScores,{LamineKing:120});assert.equal(c.events[0].text,'Lamine gana la inmunidad','el texto libre se conserva');assert.equal(cr,6);
const h=JSON.parse(sql.prepare('SELECT state FROM hunger_arena').get().state);assert.equal(h.players[0].username,'LamineKing');assert.equal(h.players[0].weapon,'mace');assert.equal(h.fights[0].names.attacker,'LamineKing');assert.equal(sql.prepare('SELECT revision FROM hunger_arena').get().revision,11);
assert.equal(JSON.parse(sql.prepare('SELECT state FROM hunger_history').get().state).players[0].username,'LamineKing');
const log=sql.prepare('SELECT * FROM username_changes296').all();assert.equal(log.length,1);assert.equal(log[0].old_username,'Lamine');assert.equal(log[0].new_username,'LamineKing');assert.equal(log[0].price,500);

// Sin límite de cambios, y el nombre viejo queda libre
r=await call(rename,2,'change-username',{username:'Lamine'});assert.equal(r.ok,true,r.message);assert.equal(Math.round(r.money*10)/10,250.6);
assert.equal(JSON.parse(sql.prepare('SELECT state FROM casting_matches').get().state).players[0].username,'Lamine');
r=await call(rename,2,'change-username',{username:'Laminito'});assert.equal(r.status,402,'ya no le llega el dinero');
assert.equal(sql.prepare('SELECT COUNT(*) n FROM username_changes296').get().n,2);

// Interfaz
const profile=readFileSync(new URL('../profile.html',import.meta.url),'utf8');
assert.match(profile,/id="profileGiftLink"[\s\S]*?<\/a><a id="profileRenameLink" class="profile-square-button profile-rename-button" href="\/change-username.html"[^>]*><span class="profile-tmoney" aria-hidden="true">T\$<\/span><\/a><\/nav>/);
const mailPage=readFileSync(new URL('../mail-page.js',import.meta.url),'utf8');assert.match(mailPage,/Marcar todos como leídos/);assert.match(mailPage,/action:'read_all'/);
assert.match(readFileSync(new URL('../mail.html',import.meta.url),'utf8'),/mail-page\.js\?v=29[68]/);
console.log('username change 296 ok');
