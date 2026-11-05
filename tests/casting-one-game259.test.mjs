import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {fresh,act,HOUR_MS} from '../functions/_shared/casting-daily.js';import {ensure,match} from '../functions/_shared/casting-service.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.a).changes)}};}}
let queue=Promise.resolve();const db={prepare:q=>new Q(q),batch(items){const r=queue.then(async()=>{sql.exec('BEGIN');try{const out=[];for(const s of items)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}});queue=r.catch(()=>{});return r;}};
await ensure(db);sql.exec('DELETE FROM casting_matches');
const user={id:1,username:'Ricardito'},now=Date.now();
// Casting 1 en juego con Ricardito dentro; Casting 2 en espera.
const running=fresh(1,now-HOUR_MS);act(running,user,{action:'join'},now);running.phase='immunity';running.round=1;running.deadline=now+HOUR_MS;
const open=fresh(2,now);
const put=(id,s)=>sql.prepare('INSERT OR REPLACE INTO casting_matches(id,revision,state) VALUES(?,0,?)').run(id,JSON.stringify(s));put(1,running);put(2,open);
const inOpen=()=>JSON.parse(sql.prepare('SELECT state FROM casting_matches WHERE id=2').get().state).players.length;
await assert.rejects(()=>match(db,2,{...user,username:'RICARDITO'},{action:'join'}),/Ya estás en el Casting #1/,'no se une mientras sigue en juego');assert.equal(inOpen(),0);
// Expulsado ya puede unirse.
running.players[0].status='eliminated';running.players[0].placement=20;put(1,running);await match(db,2,user,{action:'join'});assert.equal(inOpen(),1);
// Tampoco a otro en espera mientras sigue inscrito en uno: tras terminar el Casting vale.
running.players[0].status='active';running.players[0].placement=null;put(1,running);await assert.rejects(()=>match(db,1,user,{action:'join'}),/Ya estás en el Casting #2/);
running.phase='finished';running.players[0].placement=1;put(1,running);const free={id:2,username:'Otro'};await match(db,2,free,{action:'join'});assert.equal(inOpen(),2,'sin Casting activo se une con normalidad');
console.log('PASS Casting: un solo Casting activo por jugador hasta ser expulsado o terminar.');
