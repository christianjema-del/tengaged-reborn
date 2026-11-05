import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {ensureProfileSchema} from '../functions/_shared/auth.js';
import {duelMatch,ensureDuel} from '../functions/_shared/duel-service212.js';
import {freshDuel} from '../functions/_shared/duel212.js';
import {gamePrize} from '../prize-catalog.js';
assert.deepEqual([1,2,3,4].map(n=>gamePrize('duel',n)),[{karma:30,money:60},{karma:15,money:35},{karma:10,money:20},{karma:0,money:0}]);
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes)}};}}
let queue=Promise.resolve();const db={prepare:q=>new S(q),batch:list=>{const next=queue.then(async()=>{sql.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}});queue=next.catch(()=>{});return next;}};
await ensureProfileSchema(db);await ensureDuel(db);
for(const [id,name] of [[1,'Ana'],[2,'Bea'],[3,'Cris'],[4,'Dani']])sql.prepare('INSERT INTO users(id,username,t_money,karma) VALUES(?,?,100,5)').run(id,name);
function match(id,players,scores){const now=Date.now(),s=freshDuel(id,now-5000);Object.assign(s,{phase:'final',round:12,stage:20,startedAt:now-4000,deadline:now-1000,challenge:'match',players,manualStart172:{kind:'duel',game:id,run:null,by:'admin1',at:now-4000}});s.runs=Object.fromEntries(scores.map(([pid,score])=>[pid,{saved:true,score,startedAt:now-3000,savedAt:now-2000,duration:100}]));sql.prepare('INSERT INTO duel_matches(id,revision,state) VALUES(?,0,?)').run(id,JSON.stringify(s));}
const person=(id,username,extra={})=>({id,username,bot:false,status:'active',placement:null,joinedAt:Date.now()-9000,...extra});
match(1,[person(1,'Ana'),person(2,'Bea'),person(3,'Cris'),person(4,'Dani',{status:'eliminated',placement:4})],[[1,300],[2,200],[3,100]]);
await Promise.all(Array.from({length:6},()=>duelMatch(db,1,null)));await duelMatch(db,1,null);
const state=JSON.parse(sql.prepare('SELECT state FROM duel_matches WHERE id=1').get().state);assert.equal(state.phase,'finished');assert.equal(state.winner,'Ana');
const money=n=>sql.prepare('SELECT karma,t_money FROM users WHERE username=?').get(n);
assert.deepEqual({...money('Ana')},{karma:35,t_money:160});assert.deepEqual({...money('Bea')},{karma:20,t_money:135});assert.deepEqual({...money('Cris')},{karma:15,t_money:120});assert.deepEqual({...money('Dani')},{karma:5,t_money:100},'el cuarto no cobra');
assert.equal(sql.prepare('SELECT COUNT(*) n FROM duel_results WHERE match_id=1 AND pending=0').get().n,3);
const stats=sql.prepare("SELECT wins,points FROM user_stats WHERE username='Ana'").get();assert.deepEqual({...stats},{wins:1,points:30});
// Un bot en el podio no cobra y no quita el premio del puesto a los humanos.
match(2,[{id:-1,username:'Bot',bot:true,status:'active',placement:null},person(2,'Bea'),person(3,'Cris')],[[-1,900],[2,200],[3,100]]);await duelMatch(db,2,null);
assert.deepEqual({...money('Bea')},{karma:35,t_money:170},'Bea segunda');assert.equal(sql.prepare('SELECT COUNT(*) n FROM duel_results WHERE match_id=2').get().n,2);
const faq=readFileSync(new URL('../faq.html',import.meta.url),'utf8');assert.ok(faq.indexOf('ROOKIES SLOW')<faq.indexOf('EL DUELO')&&faq.indexOf('EL DUELO')<faq.indexOf('SUPERVIVIENTES'));for(const cell of ['30K-60T$','15K-35T$','10K-20T$'])assert.ok(faq.includes('<td>'+cell+'</td>'));
console.log('PASS El Duelo: premios de los tres primeros, pago único con lecturas simultáneas, bots sin cobro y tabla de premios.');
