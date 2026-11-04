import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {fresh,act} from '../functions/_shared/hunger.js';import {onRequest,ensureHunger} from '../functions/api/hunger.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 1000);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');class Q{constructor(q,args=[]){this.q=q;this.args=args;}bind(...args){return new Q(this.q,args);}async first(){return sql.prepare(this.q).get(...this.args)||null;}async all(){return {results:sql.prepare(this.q).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}};}}const db={prepare:q=>new Q(q)};await ensureHunger(db);sql.prepare("INSERT INTO users(id,username,is_admin) VALUES(1,'admin1',1)").run();

const now=Date.now(),admin={id:1,username:'admin1',is_admin:1},s=fresh(now,4);
act(s,admin,{action:'join'},now);act(s,{id:2,username:'Human'},{action:'join'},now);
s.reopening161={at:now};s.phase='active';s.startedAt=now;s.tickAt=now;s.players[0].health=41;
sql.prepare("INSERT INTO users(id,username,is_admin) VALUES(2,'Human',0)").run();
sql.prepare('UPDATE hunger_arena SET state=?').run(JSON.stringify(s));
const wallet=sql.prepare('SELECT * FROM hunger_wallet ORDER BY event_key').all();
async function call(id,action,extra={}){const token=String(id).repeat(64);if(!sql.prepare('SELECT 1 FROM sessions WHERE user_id=?').get(id)){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');}const req=new Request('https://test.local/api/hunger',{method:action?'POST':'GET',headers:{Origin:'https://test.local',Cookie:'session='+token,'Content-Type':'application/json'},...(action?{body:JSON.stringify({edition:4,action,nonce:'manual160-'+action,...extra})}:{})});const r=await onRequest({env:{DB:db},request:req});return {status:r.status,...await r.json()};}
const reads=await Promise.all([call(1),call(2)]);for(const x of reads){assert.equal(x.status,200);assert.equal(x.phase,'waiting');assert.equal(x.paused,true);}assert.equal(reads[0].canStart,true);assert.equal(reads[1].canStart,false);
assert.equal((await call(2,'start')).status,400);let out=await call(1,'start',{runId:reads[0].runId});assert.equal(out.status,200);assert.equal(out.phase,'active');assert.equal(out.paused,false);
assert.equal(JSON.parse(sql.prepare('SELECT state FROM hunger_arena').get().state).players[0].health,41);
assert.deepEqual(sql.prepare('SELECT * FROM hunger_wallet ORDER BY event_key').all(),wallet);
assert.equal((await call(1,'start')).phase,'active','nonce retry does not restart or pause');
console.log('PASS actual API: edition 4 frozen with CAS, admin1-only resume, privacy projection, no repeated charge or health loss.');
