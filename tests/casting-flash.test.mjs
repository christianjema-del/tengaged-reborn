import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {fresh,act,advance,view,challengeFor,CHALLENGES} from '../functions/_shared/casting-legacy.js';
import {ensure} from '../functions/_shared/casting-service.js';
import {encode,decode} from '../functions/_shared/flash-protocol.js';
import {onRequestGet} from '../functions/microgames.js';
import {onRequest as profileApi} from '../functions/api/profile.js';
import {onRequest as castingApi} from '../functions/api/castings.js';
const admin={username:'Alice',is_admin:true},bob={username:'Bob',is_admin:false},now=Date.now();
function game(){const s=fresh(1,now);act(s,admin,{action:'join'},now);act(s,bob,{action:'join'},now);act(s,{username:'Carol'},{action:'join'},now);act(s,admin,{action:'start'},now);return s;}
for(let sample=0;sample<30;sample++){
 const s=game(),sequence=[];
 for(let round=1;round<=21;round++){
  sequence.push(challengeFor(s));const restored=JSON.parse(JSON.stringify(s));assert.equal(challengeFor(restored),challengeFor(s));
  const output=JSON.stringify(view(s,admin));assert.ok(!output.includes('challengeBag'));assert.ok(!output.includes('flashAttempts'));
  // Drive actual elimination transition, retaining three active fixture players.
  s.phase='elimination';s.nominees=['Bob','Carol'];s.ballots={};s.deadline=now;
  advance(s,now,true);s.players.find(p=>p.status==='eliminated').status='active';
 }
 assert.equal(new Set(sequence.slice(0,10)).size,10);assert.equal(new Set(sequence.slice(10,20)).size,10);assert.notEqual(sequence[9],sequence[10]);assert.notEqual(sequence[19],sequence[20]);
}
const database=new DatabaseSync(':memory:');
class Statement{
 constructor(sql,values=[]){this.sql=sql;this.values=values;}
 bind(...values){return new Statement(this.sql,values);}
 async first(){return database.prepare(this.sql).get(...this.values)||null;}
 async all(){return {results:database.prepare(this.sql).all(...this.values)};}
 async run(){const r=database.prepare(this.sql).run(...this.values);return {meta:{changes:Number(r.changes)}};}
}
let queue=Promise.resolve();const db={prepare:sql=>new Statement(sql),batch(statements){const work=queue.then(async()=>{database.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());database.exec('COMMIT');return result;}catch(e){database.exec('ROLLBACK');throw e;}});queue=work.catch(()=>{});return work;}};
database.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
await ensure(db);
const cookieToken='a'.repeat(64),tokenHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(cookieToken))).toString('hex');
database.prepare('INSERT INTO users(id,username,is_admin) VALUES(1,?,1)').run('Alice');database.prepare('INSERT INTO sessions VALUES(?,1,?)').run(tokenHash,'2099-01-01');
function write(s){database.prepare('UPDATE casting_matches SET state=?,revision=revision+1 WHERE id=1').run(JSON.stringify(s));}
function state(){return JSON.parse(database.prepare('SELECT state FROM casting_matches WHERE id=1').get().state);}
function request(payload,signed=true){return new Request('https://example.test/microgames?data='+encode(payload),{headers:signed?{Cookie:'session='+cookieToken,'Sec-Fetch-Site':'same-origin'}:{}});}
async function bridge(type,fn,header,points,signed=true){const r=await onRequestGet({request:request({type,function:fn,header,data:{points}},signed),env:{DB:db}});return {status:r.status,body:decode(await r.text())};}
const types={wheel:'WOF',numbers:'NUMBERS',deal:'DEAL',match:'MATCH3',guitar:'GUITAR',endurance:'ENDURANCE',maze:'MAZE',snow:'STARFLAKES',words:'WORDS',line:'LINEBALLS'};
for(const kind of CHALLENGES){
 const s=game();s.selectedChallenge=kind;write(s);
 const header={context:'game',contextId:1,subcontext:'casting',subcontextId:1};
 assert.equal((await bridge(types[kind],'requestGameData',header,null,false)).status,400);
 const opened=await bridge(types[kind],'requestGameData',header);assert.equal(opened.status,200);assert.ok(opened.body.data.timeleft>0);assert.equal(state().players[0].health,80);
 const repeat=await bridge(types[kind],'requestGameData',header);assert.equal(repeat.body.header.code,opened.body.header.code);assert.equal(state().players[0].health,80);
 assert.equal((await bridge(types[kind],'requestSaveGameData',{...header,code:'wrong'},10)).status,400);
 const pending=state();pending.flashAttempts.alice.startedAt-=2000;write(pending);
 assert.equal((await bridge(types[kind],'requestSaveGameData',{...header,code:opened.body.header.code},'100')).status,400);
 const saved=await bridge(types[kind],'requestSaveGameData',{...header,code:opened.body.header.code},1234);assert.equal(saved.status,200);assert.equal(saved.body.recorded,true);assert.equal(state().flashScores.alice.points,1234);assert.equal(state().reactions.alice,-1234);
 const retry=await bridge(types[kind],'requestSaveGameData',{...header,code:opened.body.header.code},9999);assert.equal(retry.status,200);assert.equal(database.prepare('SELECT best_score FROM minigame_scores WHERE user_id=1 AND kind=?').get(kind).best_score,1234);assert.equal(database.prepare('SELECT plays FROM minigame_scores WHERE user_id=1 AND kind=?').get(kind).plays,1);assert.equal(state().flashScores.alice.points,1234);
 assert.equal((await bridge(types[kind],'requestSaveGameData',{...header,subcontextId:2,code:opened.body.header.code},1234)).status,400);
 // Demo saves do not mutate the match.
 const snapshot=JSON.stringify(state());const demo=await bridge(types[kind],'requestSaveGameData',{},999999);assert.equal(demo.body.recorded,false);assert.equal(JSON.stringify(state()),snapshot);
 const publicState=view(state(),admin);assert.ok(!JSON.stringify(publicState).includes(opened.body.header.code));
}

// Simultaneous starts reserve only one attempt and one health charge.
let concurrent=game();concurrent.selectedChallenge='match';write(concurrent);const concurrentHeader={context:'game',contextId:1,subcontext:'casting',subcontextId:1};
const starts=await Promise.all([bridge('MATCH3','requestGameData',concurrentHeader),bridge('MATCH3','requestGameData',concurrentHeader)]);assert.equal(starts[0].status,200);assert.equal(starts[1].status,200);assert.equal(starts[0].body.header.code,starts[1].body.header.code);assert.equal(state().players[0].health,80);
concurrent=state();concurrent.flashAttempts.alice.startedAt-=2000;write(concurrent);const saves=await Promise.all([bridge('MATCH3','requestSaveGameData',{...concurrentHeader,code:starts[0].body.header.code},15),bridge('MATCH3','requestSaveGameData',{...concurrentHeader,code:starts[1].body.header.code},50)]);assert.equal(saves[0].status,200);assert.equal(saves[1].status,200);assert.ok([15,50].includes(state().flashScores.alice.points));assert.equal(saves[0].body.data.points,saves[1].body.data.points);assert.equal(state().events.filter(e=>e.text.includes('termina Match Three')).length,1);
// Partially completed legacy rounds retain their original assignment and scores.
const legacy=game();delete legacy.scoringMode;delete legacy.challengeRound;delete legacy.selectedChallenge;legacy.reactions.alice=123;const oldKind=challengeFor(legacy);advance(legacy,now);assert.equal(legacy.reactions.alice,123);assert.equal(challengeFor(legacy),oldKind);assert.equal(legacy.scoringMode,undefined);

let s=state();assert.throws(()=>act(s,admin,{action:'challenge',score:100,duration_ms:2000}),/automáticamente/);assert.throws(()=>act(s,admin,{action:'flash_start',kind:challengeFor(s),round:1}),/minijuego/);assert.throws(()=>act(s,admin,{action:'reaction',reaction_ms:100}),/original/);
// The HTTP action endpoint cannot acquire the trusted bridge capability via JSON.
const originalError=console.error;console.error=()=>{};const direct=await castingApi({request:new Request('https://example.test/api/castings?id=1',{method:'POST',headers:{Cookie:'session='+cookieToken,Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify({action:'flash_start',kind:challengeFor(s),round:1,trustedFlash:true})}),env:{DB:db}});console.error=originalError;assert.equal(direct.status,400);
// Highest raw score wins; saving and retrying the final score awards a single reward.
s=game();s.players.pop();s.selectedChallenge='match';write(s);let h={context:'game',contextId:1,subcontext:'casting',subcontextId:1};const opening=await bridge('MATCH3','requestGameData',h);s=state();s.flashAttempts.alice.startedAt-=2000;s.reactions.bob=-20;write(s);const final=await bridge('MATCH3','requestSaveGameData',{...h,code:opening.body.header.code},30);assert.equal(final.status,200);assert.equal(state().winner,'Alice');assert.equal(database.prepare('SELECT karma FROM users WHERE id=1').get().karma,40);
assert.equal((await bridge('MATCH3','requestSaveGameData',{...h,code:opening.body.header.code},40)).status,200);assert.equal(database.prepare('SELECT karma FROM users WHERE id=1').get().karma,40);
// The profile uses actual active Casting health and the account registration date.
database.exec("ALTER TABLE users ADD COLUMN created_at TEXT");database.prepare('UPDATE users SET created_at=? WHERE id=1').run('2026-01-01 12:00:00');
const profileState=game();profileState.players[0].health=80;write(profileState);
const profileResponse=await profileApi({request:new Request('https://example.test/api/profile?username=Alice',{headers:{Cookie:'session='+cookieToken}}),env:{DB:db}});assert.equal(profileResponse.status,200);const profileData=(await profileResponse.json()).profile;assert.equal(profileData.casting_health,80);assert.equal(profileData.created_at,'2026-01-01 12:00:00');assert.equal(profileData.games[0].status,'active');
console.log('PASS: random bags, persistence, all ten encrypted start/save flows, session checks, wrong/stale tokens, replay, demo isolation, hidden tokens, direct action rejection, scoring and exactly-once winner reward.');
