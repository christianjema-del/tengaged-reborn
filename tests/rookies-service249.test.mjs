import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
import {ensureProfileSchema} from '../functions/_shared/auth.js';
import {ensureRookies,rookiesMatch,rookiesBets,placeBet,waitingRookies,rookiesListing,betLimit,profileBets} from '../functions/_shared/rookies-service.js';
import {onRequest as api} from '../functions/api/rookies.js';
import {DAY_MS,FINALE_MS} from '../functions/_shared/rookies-engine.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);CREATE TABLE game_chat(id INTEGER PRIMARY KEY,room TEXT,user_id INTEGER,body TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE user_inventory(user_id INTEGER,item_code TEXT,is_equipped INTEGER DEFAULT 0);CREATE TABLE shop_items(code TEXT,theme_code TEXT,category TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
let queue=Promise.resolve();const db={prepare:q=>new Q(q),batch:list=>{const next=queue.then(async()=>{sql.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}});queue=next.catch(()=>{});return next;}};
await ensureProfileSchema(db);await ensureRookies(db);
const money=id=>sql.prepare('SELECT t_money m,karma k FROM users WHERE id=?').get(id);
for(let id=1;id<=16;id++)sql.prepare('INSERT INTO users(id,username,t_money,is_admin) VALUES(?,?,10,?)').run(id,id===16?'admin1':'U'+id,id===16?1:0);
for(const id of [17,18])sql.prepare('INSERT INTO users(id,username,t_money) VALUES(?,?,10)').run(id,'U'+id);
sql.exec("INSERT INTO shop_items VALUES('color-card-yellow','yellow','Tarjetas de color'),('color-card-orange','orange','Tarjetas de color'),('color-card-gold','gold','Tarjetas de color');INSERT INTO user_inventory VALUES(14,'color-card-gold',1),(17,'color-card-yellow',1),(18,'color-card-orange',1)");
const users=Array.from({length:13},(_,i)=>({id:i+1,username:'U'+(i+1)})),bettor={id:14,username:'U14'},white={id:15,username:'U15'},admin={id:16,username:'admin1',is_admin:1};
await waitingRookies(db);const id=(await rookiesListing(db,null)).find(g=>g.phase==='waiting').id;
for(const u of users)await rookiesMatch(db,id,u,{action:'join'});
await assert.rejects(()=>placeBet(db,id,bettor,1),/día 1/);
const t=Date.now();await rookiesMatch(db,id,admin,{action:'start'},t);
await assert.rejects(()=>placeBet(db,id,users[0],2),/en la que juegas/,'un inscrito no apuesta');
await assert.rejects(()=>placeBet(db,id,white,2),/amarillo/,'blanco no apuesta');
await assert.rejects(()=>placeBet(db,id,null,2),/Inicia sesión/);
const results=await Promise.allSettled(Array.from({length:14},()=>placeBet(db,id,bettor,1)));
assert.equal(results.filter(r=>r.status==='fulfilled').length,10,'no se gasta más de lo que se tiene');assert.equal(money(14).m,0);
const yellow={id:17,username:'U17'},orange={id:18,username:'U18'};assert.deepEqual([1,2,3,4,12].map(betLimit),[0,2,4,6,22],'cada tarjeta suma 2 T$');
const capped=await Promise.allSettled(Array.from({length:5},()=>placeBet(db,id,yellow,3)));assert.equal(capped.filter(r=>r.status==='fulfilled').length,2,'la amarilla apuesta 2 T$ aunque pulse a la vez');assert.equal(money(17).m,8);
assert.match(capped.find(r=>r.status==='rejected').reason.message,/2 T\$/);const usedUp=await rookiesBets(db,id,yellow);assert.equal(usedUp.canBet,false);assert.equal(usedUp.spent,2);
for(const target of [3,4,5,6])await placeBet(db,id,orange,target);await assert.rejects(()=>placeBet(db,id,orange,7),/4 T\$/,'la naranja apuesta 4 T$ repartidos');assert.equal(money(18).m,6);
const info=await rookiesBets(db,id,bettor);assert.equal(info.players.find(p=>p.id===1).total,10);assert.equal(info.canBet,true);
sql.exec('UPDATE users SET t_money=2 WHERE id=14');await placeBet(db,id,bettor,2);await placeBet(db,id,bettor,2);
const profile=await profileBets(db,14,1,Date.now());assert.equal(profile.open,id,'el perfil ofrece la partida abierta');assert.deepEqual(profile.items.map(x=>[x.amount,x.target,x.matchId,x.status]),[[2,'U2',id,'playing'],[10,'U1',id,'playing']]);
assert.equal((await profileBets(db,18,1,Date.now())).items.length,4);assert.deepEqual((await profileBets(db,15,1,Date.now())).items,[],'sin apuestas');assert.equal((await profileBets(db,14,99,Date.now())).page,1,'la página se limita');
// El usuario 1 es con diferencia el más activo: gana la partida.
for(let n=0;n<40;n++)sql.prepare('INSERT INTO game_chat(room,user_id,body) VALUES(?,1,?)').run('rookies:'+id,'hola');
for(let n=0;n<20;n++)sql.prepare('INSERT INTO game_chat(room,user_id,body) VALUES(?,2,?)').run('rookies:'+id,'hola');
for(let n=0;n<10;n++)sql.prepare('INSERT INTO game_chat(room,user_id,body) VALUES(?,3,?)').run('rookies:'+id,'hola');
for(let n=0;n<5;n++)sql.prepare('INSERT INTO game_chat(room,user_id,body) VALUES(?,4,?)').run('rookies:'+id,'hola');
let at=t,m;for(let i=0;i<12;i++){at+=DAY_MS;m=(await rookiesMatch(db,id,null,null,at)).match;if(m.phase==='finale')break;}
assert.equal(m.phase,'finale');await assert.rejects(()=>placeBet(db,id,bettor,1),/día 1/,'apuestas cerradas');
const before=money(14).m;await Promise.all(Array.from({length:6},()=>rookiesMatch(db,id,null,null,at+FINALE_MS)));await rookiesMatch(db,id,null,null,at+FINALE_MS+1);
m=(await rookiesMatch(db,id,null,null,at+FINALE_MS+2)).match;assert.equal(m.phase,'finished');
const place=n=>m.players.find(p=>p.id===n).placement;const chat=n=>sql.prepare('SELECT COUNT(*) n FROM game_chat WHERE room=? AND user_id=?').get('rookies:'+id,n).n,finalists=m.players.filter(p=>p.placement<=4).sort((a,b)=>a.placement-b.placement);assert.equal(finalists.length,4);for(let i=1;i<4;i++)assert.ok(chat(finalists[i-1].id)>=chat(finalists[i].id),'entre los finalistas gana el más activo de toda la partida');assert.equal(m.winner,finalists[0].username);
const mult={1:2,2:1.75,3:1.5,4:1.25,5:1},expected=10*(mult[place(1)]||0)+2*(mult[place(2)]||0);assert.equal(money(14).m,before+expected,'pagos con los multiplicadores y una sola vez');
const done=await profileBets(db,14,1,at+FINALE_MS+3);assert.equal(done.open,null,'partida terminada: nada abierto');for(const x of done.items){const n=x.target==='U1'?1:2,paid=x.amount*(mult[place(n)]||0);assert.equal(x.status,paid>0?'won':'lost');assert.equal(x.payout,paid);}
const winner=m.players.find(p=>p.placement===1),prizeUser=money(winner.id);assert.equal(prizeUser.k,80,'premio Rookies Slow una sola vez');assert.ok(prizeUser.m>=60);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM rookies_results WHERE match_id=? AND pending=0').get(id).n,sql.prepare('SELECT COUNT(*) n FROM rookies_results WHERE match_id=?').get(id).n);
await rookiesMatch(db,id,null,null,at+FINALE_MS+5);assert.equal(money(winner.id).k,80);
const call=async(uid,path,body)=>{const token=String(uid).padStart(64,'0');sql.prepare('INSERT OR IGNORE INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),uid,'2099-01-01');return api({env:{DB:db},request:new Request('https://test.local/'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local',Cookie:'session='+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})});};
assert.equal((await call(1,'api/rookies')).status,200);assert.equal((await call(1,'api/rookies?id='+id,{action:'start'})).status,403);assert.equal((await call(14,'api/rookies?id='+id+'&bets=1')).status,200);
console.log('PASS Rookies servicio: apuestas sin saldo negativo, permisos, multiplicadores, premios únicos, actividad y API.');
