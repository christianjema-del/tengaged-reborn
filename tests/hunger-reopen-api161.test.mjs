import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {fresh,act} from '../functions/_shared/hunger.js';import {onRequest,ensureHunger} from '../functions/api/hunger.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 1000);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');class Q{constructor(q,args=[]){this.q=q;this.args=args;}bind(...args){return new Q(this.q,args);}async first(){return sql.prepare(this.q).get(...this.args)||null;}async all(){return {results:sql.prepare(this.q).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}};}}const db={prepare:q=>new Q(q)};await ensureHunger(db);sql.prepare("INSERT INTO users(id,username,is_admin) VALUES(1,'admin1',1)").run();

const now=Date.now(),s=fresh(now-86400000,4);s.manualStartVersion=160;s.phase='waiting';s.manualPause160={at:now-1000};s.startedAt=now-86400000;
s.players=['Peach','Lamine','Cristi','PauCubarsi'].map((username,i)=>({id:i+2,username,bot:false,health:3,arrows:2,placement:null}));
for(const p of s.players){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(p.id,p.username);s.ops.push({key:'hunger:4:entry:'+p.id,user:p.id,money:-20,karma:0});}
s.players.push({id:-401,username:'Tributo_01',bot:true,health:70});s.receipts=['old-action'];
sql.prepare('UPDATE hunger_arena SET state=?').run(JSON.stringify(s));
const before=sql.prepare('SELECT * FROM users ORDER BY id').all();
async function read(){const r=await onRequest({env:{DB:db},request:new Request('https://test.local/api/hunger')});assert.equal(r.status,200);return r.json();}
for(const r of await Promise.all([read(),read(),read()])){assert.equal(r.phase,'waiting');assert.equal(r.paused,false);assert.equal(r.players.length,4);assert.deepEqual(r.players.map(p=>p.username),['Peach','Lamine','Cristi','PauCubarsi']);assert.equal(r.startAt,null);assert.equal('reopening161' in r,false);}
const saved=JSON.parse(sql.prepare('SELECT state FROM hunger_arena').get().state);assert.equal(saved.reopening161.previous.players.length,5);assert.ok(saved.players.every(p=>p.health===70));
await read();assert.deepEqual(sql.prepare('SELECT * FROM users ORDER BY id').all(),before);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM hunger_wallet').get().n,4);
console.log('PASS actual API V161 Hunger: four retained users, zero bots, public enrollment reopened, private backup, CAS concurrent reads and no duplicate debits.');
