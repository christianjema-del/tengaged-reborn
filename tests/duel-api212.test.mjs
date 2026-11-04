import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as extras} from '../functions/api/profile-extras.js';
import {onRequest as friends} from '../functions/api/friends.js';
import {onRequest as mail} from '../functions/api/mail.js';
import {onRequest as groups} from '../functions/api/groups.js';
import {onRequest as questions} from '../functions/api/questions.js';
import {onRequest as blog} from '../functions/api/blog.js';
import {onRequest as feed} from '../functions/api/community-feed.js';
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)");
class S{
 constructor(q,args=[]){this.q=q;this.args=args;}
 bind(...args){return new S(this.q,args);}
 async first(){return sql.prepare(this.q).get(...this.args)||null;}
 async all(){return {results:sql.prepare(this.q).all(...this.args)};}
 async run(){const r=sql.prepare(this.q).run(...this.args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let id=1;id<=4;id++){
 sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['Alice','Bob','Carol','Dave'][id-1]);
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).padStart(64,'0')))).toString('hex');
 sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');
}
async function call(fn,path,user=1,body,method,origin='https://test.local'){
 const r=await fn({request:new Request('https://test.local/'+path,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(user?{Cookie:'session='+String(user).padStart(64,'0')}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}


import {ensureProfileSchema} from '../functions/_shared/auth.js';
import {onRequest as duel} from '../functions/api/duel.js';
import {onRequest as chat} from '../functions/api/game-chat.js';
import {duelMatch,duelListing} from '../functions/_shared/duel-service212.js';
await ensureProfileSchema(db);
for(let id=5;id<=13;id++){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,'Player'+id);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).padStart(64,'0')))).toString('hex'),id,'2099-01-01');}
sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(999,?,1)').run('admin1');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(999).padStart(64,'0')))).toString('hex'),999,'2099-01-01');
let d=await call(duel,'api/duel',0);assert.equal(d.status,200);assert.equal(d.matches[0].id,1);assert.equal(d.matches[0].phase,'waiting');
assert.equal((await call(duel,'api/duel?id=1',0,{action:'join'})).status,401);
assert.equal((await call(duel,'api/duel?id=1',1,{action:'join'},undefined,'https://wrong.local')).status,403);
for(let id=1;id<=12;id++){d=await call(duel,'api/duel?id=1',id,{action:'join',welcome:'Hola'});assert.equal(d.status,200);}
assert.equal(d.match.phase,'waiting');assert.equal((await call(duel,'api/duel?id=1',1,{action:'start'})).status,403);d=await call(duel,'api/duel?id=1',999,{action:'start'});assert.equal(d.status,200);assert.equal(d.match.phase,'immunity');assert.equal(d.match.players.length,12);assert.equal((await call(duel,'api/duel?id=1',13,{action:'join'})).status,400);
d=await call(duel,'api/duel',0);assert.equal(d.matches.filter(m=>m.phase==='waiting').length,1);assert.equal(d.matches.find(m=>m.phase==='waiting').id,2);
assert.equal((await call(duel,'api/duel?id=1',1,{action:'flash_finish',points:999999})).status,400);
assert.equal(sql.prepare("SELECT COUNT(*) n FROM user_game_history WHERE game_type='DUEL' AND game_id='1'").get().n,12);
assert.equal(sql.prepare('SELECT SUM(t_money) n FROM users').get().n,0);
let c=await call(chat,'api/game-chat?type=duel&id=1',1,{message:'Hola duelo'});assert.equal(c.status,200,JSON.stringify(c));
c=await call(chat,'api/game-chat?type=duel&id=1',0);assert.equal(c.canVote,false);assert.ok(c.messages.some(m=>m.body==='Hola duelo'));
assert.equal((await call(chat,'api/game-chat?type=duel&id=1',13,{message:'Intruso'})).status,403);
assert.equal((await call(chat,'api/game-chat?type=duel&id=1',2,{action:'vote',message_id:1,value:1})).status,400);
const raw=JSON.parse(sql.prepare('SELECT state FROM duel_matches WHERE id=1').get().state);const t=Date.now();const r=await duelMatch(db,1,{id:1,username:'Alice'},{action:'flash_start',stage:raw.stage,kind:raw.challenge},true,'WOF',t);assert.ok(r.attempt.token);assert.ok(r.data);
const saved=await duelMatch(db,1,{id:1,username:'Alice'},{action:'flash_finish',stage:raw.stage,kind:raw.challenge,token:r.attempt.token,points:1500},true,'WOF',t+2000);assert.equal(saved.match.me.score,1500);assert.equal((await duelMatch(db,1,{id:2,username:'Bob'})).match.players[0].score,undefined);
console.log('PASS Duel API SQLite: auth/CSRF, 12 seats and next lobby, no fees, profile history, real public chat, no votes, outsider protection, trusted bridge and score privacy');
// Separate transactions serialize in D1; stale reads must retry their revision CAS.
const originalBatch=db.batch.bind(db);let transaction=Promise.resolve();db.batch=items=>{const next=transaction.then(()=>originalBatch(items));transaction=next.catch(()=>{});return next;};
await Promise.all(Array.from({length:12},(_,i)=>duelMatch(db,2,{id:i+1,username:i<4?['Alice','Bob','Carol','Dave'][i]:'Player'+(i+1)},{action:'join'})));
const simultaneous=JSON.parse(sql.prepare('SELECT state FROM duel_matches WHERE id=2').get().state);assert.equal(simultaneous.players.length,12);assert.equal(new Set(simultaneous.players.map(p=>p.id)).size,12);assert.equal(simultaneous.phase,'waiting');await duelMatch(db,2,{id:999,username:'admin1',is_admin:1},{action:'start'});const started=JSON.parse(sql.prepare('SELECT state FROM duel_matches WHERE id=2').get().state);assert.equal(started.events.filter(e=>e.text.startsWith('Día 1:')).length,1);
console.log('PASS 12 simultaneous joins retain every player and start exactly once');
import {onRequestGet as microgames} from '../functions/microgames.js';
import {encode,decode} from '../functions/_shared/flash-protocol.js';
async function bridge(payload){const u=new URL('https://test.local/microgames');u.searchParams.set('data',encode(payload));const response=await microgames({env:{DB:db},request:new Request(u,{headers:{Origin:u.origin,Cookie:'session='+String(2).padStart(64,'0')}})});return {status:response.status,...decode(await response.text())};}
const head={context:'game',contextId:'1',subcontext:'duel',subcontextId:'1'};const begin=await bridge({type:'WOF',function:'requestGameData',header:head});assert.equal(begin.error,0);assert.ok(begin.header.code);
const resumed=JSON.parse(sql.prepare('SELECT state FROM duel_matches WHERE id=1').get().state);resumed.runs[2].startedAt-=2000;sql.prepare('UPDATE duel_matches SET state=? WHERE id=1').run(JSON.stringify(resumed));
const end=await bridge({type:'WOF',function:'requestSaveGameData',header:{...head,code:begin.header.code},data:{points:1234}});assert.equal(end.error,0);assert.equal(end.recorded,true);assert.equal((await duelMatch(db,1,{id:2})).match.me.score,1234);
console.log('PASS original SWF encoded bridge starts and records a real Duel attempt');
d=await call(duel,'api/duel',0);const lobby=d.matches.find(m=>m.phase==='waiting').id;
assert.equal((await call(duel,'api/duel?id='+lobby,1,{action:'join',notifyOnStart:true})).status,200);
for(let id=2;id<=12;id++)assert.equal((await call(duel,'api/duel?id='+lobby,id,{action:'join'})).status,200);
assert.equal((await call(duel,'api/duel?id='+lobby,999,{action:'start'})).status,200);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM private_messages WHERE system_event=?').get('duel:start:'+lobby+':1').n,1);
console.log('PASS opted-in internal start notification is delivered exactly once');

d=await call(duel,'api/duel',0);const botLobby=d.matches.find(m=>m.phase==='waiting').id;assert.equal((await call(duel,'api/duel?id='+botLobby,1,{action:'fill_bots'})).status,403);d=await call(duel,'api/duel?id='+botLobby,999,{action:'fill_bots'});assert.equal(d.status,200);assert.equal(d.match.phase,'waiting');assert.equal(d.match.players.filter(p=>p.bot).length,12);assert.equal(sql.prepare("SELECT COUNT(*) n FROM user_game_history WHERE game_type='DUEL' AND game_id=?").get(String(botLobby)).n,0);console.log('PASS owner-only bot filling, waiting and no bot profile histories');
