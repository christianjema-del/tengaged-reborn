import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
import {freshRace,actRace,advanceRace,LEG_MS} from '../functions/_shared/race356.js';
import {onRequest as race} from '../functions/api/race.js';
import {ensureRace} from '../functions/_shared/race-service356.js';
import {gamePrize} from '../prize-catalog.js';
// V376: la Race #53 (evento) triplica los premios del 1.º al 3.º; del 4.º al 6.º sigue sin premio;
// el resto de Race paga los premios normales.
const T=Date.UTC(2026,10,16,12,0),admin={id:1,username:'admin1',is_admin:1};
function harness(){
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
 class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
 const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const q of items)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return {sql,db};
}
function session(sql,id,username,isAdmin=0){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,?)').run(id,username,isAdmin);const tok=String(id).repeat(64).slice(0,64);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(tok).digest('hex'),id,'2099-01-01');return tok;}
async function playToFinish(sql,db,id,users){
 await ensureRace(db);
 // Se simula con id=0 (partida normal de 8 minutos por etapa) para terminar la carrera rápido; la
 // propia API corrige el id al leerla y es ese id real el que decide si triplica el premio.
 const s=freshRace(0,T);for(const u of users)actRace(s,u,{action:'join'},T);actRace(s,admin,{action:'fill_bots'},T);actRace(s,admin,{action:'start'},T);
 let now=T;for(let i=0;i<10&&s.phase!=='finished';i++){now+=LEG_MS+1000;advanceRace(s,now);}
 await db.prepare('INSERT INTO race_matches(id,revision,state) VALUES(?,0,?)').bind(id,JSON.stringify(s)).run();
 return {s,now};
}
{
 const {sql,db}=harness(),ana={id:20,username:'Ana'},leo={id:21,username:'Leo'};
 session(sql,1,'admin1',1);const tokA=session(sql,20,'Ana'),tokL=session(sql,21,'Leo');
 await playToFinish(sql,db,53,[ana,leo]);
 const call=async(path,id,token)=>{const r=await race({env:{DB:db},request:new Request('https://t.local'+path,{method:'GET',headers:{Cookie:'session='+token}})});return {status:r.status,...await r.json()};};
 await call('/api/race?id=53',20,tokA);await call('/api/race?id=53',21,tokL);
 const paid=sql.prepare('SELECT user_id,placement,karma,money FROM race_results ORDER BY user_id').all();
 const winner=paid.find(p=>p.placement===1);
 const normal=gamePrize('race',1);
 assert.equal(winner.karma,normal.karma*3,'Race #53 triplica el karma del 1.º');
 assert.equal(winner.money,normal.money*3,'Race #53 triplica el dinero del 1.º: 360 T$');
 assert.equal(winner.money,360);assert.equal(winner.karma,180);
}
{
 const {sql,db}=harness(),ana={id:20,username:'Ana'},leo={id:21,username:'Leo'};
 session(sql,1,'admin1',1);const tokA=session(sql,20,'Ana'),tokL=session(sql,21,'Leo');
 await playToFinish(sql,db,70,[ana,leo]);
 const call=async(path,id,token)=>{const r=await race({env:{DB:db},request:new Request('https://t.local'+path,{method:'GET',headers:{Cookie:'session='+token}})});return {status:r.status,...await r.json()};};
 await call('/api/race?id=70',20,tokA);await call('/api/race?id=70',21,tokL);
 const paid=sql.prepare('SELECT user_id,placement,karma,money FROM race_results ORDER BY user_id').all();
 const winner=paid.find(p=>p.placement===1),normal=gamePrize('race',1);
 assert.equal(winner.karma,normal.karma,'el resto de Race paga el premio normal (sin triplicar)');
 assert.equal(winner.money,normal.money);
}
console.log('PASS V376: Race #53 triplica los premios del 1.º al 3.º (180K/360T$ el 1.º); el resto de Race sigue igual');
