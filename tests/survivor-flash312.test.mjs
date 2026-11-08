import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';
import {onRequest as survivor} from '../functions/api/survivor.js';import {onRequestGet as micro,survivorStage} from '../functions/microgames.js';import {encode,decode} from '../functions/_shared/flash-protocol.js';

const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,is_banned INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.a).changes)}};}}
let chain=Promise.resolve();const db={prepare:q=>new Q(q),batch(qs){const task=chain.then(async()=>{sql.exec('BEGIN');try{const out=[];for(const q of qs)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}});chain=task.catch(()=>{});return task;}};
for(let i=1;i<=3;i++){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,?)').run(i,i===1?'admin1':'User'+i,i===1?1:0);const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(i).padStart(64,'0')))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,i,'2099-01-01');}
const cookie=u=>'session='+String(u).padStart(64,'0');
async function call(path,user,body){const r=await survivor({env:{DB:db},request:new Request('https://test.local'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local','Content-Type':'application/json',Cookie:cookie(user)},...(body?{body:JSON.stringify(body)}:{})})});return {status:r.status,...await r.json()};}
const types={wheel:'WOF',numbers:'NUMBERS',deal:'DEAL',match:'MATCHTHREE',guitar:'GUITAR',endurance:'ENDURANCE',maze:'MAZE',snow:'STARFLAKES',words:'WORDS',line:'LINEBALLS'};
async function flash(user,kind,subcontextId,fn,code,points){const payload={type:types[kind],function:fn,header:{context:'game',subcontext:'survivor',contextId:1,subcontextId,code},data:{points}};const r=await micro({env:{DB:db},request:new Request('https://test.local/microgames?data='+encodeURIComponent(encode(payload)),{headers:{Cookie:cookie(user)}})});return decode(await r.text());}

test('V312: el código de la prueba es un número que el SWF puede leer',()=>{
 assert.deepEqual(survivorStage(11),{day:1,mode:'tribe'});assert.deepEqual(survivorStage('32'),{day:3,mode:'immunity'});
 assert.deepEqual(survivorStage('1:tribe'),{day:1,mode:'tribe'});assert.ok(Number.isNaN(survivorStage('NaN').day));
 const page=fs.readFileSync(new URL('../survivor-challenge303.js',import.meta.url),'utf8');assert.match(page,/round:day\*10\+\(mode==='immunity'\?2:1\)/);assert.ok(!page.includes("round:day+':'+mode"));
});
test('V312: un náufrago carga su prueba de tribu y guarda el resultado por /microgames',async()=>{
 await call('/api/survivor',2);assert.equal((await call('/api/survivor?id=1',2,{action:'join'})).ok,true);
 await call('/api/survivor?id=1',1,{action:'fill_bots'});const started=await call('/api/survivor?id=1',1,{action:'start'});assert.equal(started.ok,true);
 const kind=started.match.challenge.kind,day=started.match.day;
 const begin=await flash(2,kind,day*10+1,'requestGameData');assert.equal(begin.error,0,JSON.stringify(begin));assert.ok(begin.header.code);assert.ok(begin.data.timeleft>0);
 const saved=await flash(2,kind,day*10+1,'requestSaveGameData',begin.header.code,321);assert.equal(saved.error,0,JSON.stringify(saved));assert.equal(saved.recorded,true);
 const after=await call('/api/survivor?id=1',2);assert.equal(after.match.me.played,true);assert.equal(after.match.me.score,321);
});
