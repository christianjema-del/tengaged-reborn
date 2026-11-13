import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
import {freshRace,actRace,advanceRace,raceView,TRANSPORTS,RACE_START_MONEY,LEG_MS,pairsAlive,travellerPoints} from '../functions/_shared/race356.js';
import {onRequest as race} from '../functions/api/race.js';
// V356: Race. 12 viajeros, 6 parejas al azar, presupuesto y transporte; elimina a la pareja con menos puntos en cada etapa.
const T=Date.UTC(2026,10,13,12,0),admin={id:1,username:'admin1',is_admin:1},ana={id:20,username:'Ana'},leo={id:21,username:'Leo'};
{
 const s=freshRace(5,T);actRace(s,ana,{action:'join'},T);actRace(s,leo,{action:'join'},T);
 assert.throws(()=>actRace(s,ana,{action:'start'},T),/admin1/);actRace(s,admin,{action:'fill_bots'},T);assert.equal(s.players.length,12);
 actRace(s,admin,{action:'start'},T+1000);assert.equal(s.phase,'leg');assert.equal(s.leg,1);
 assert.equal(s.pairs.length,6);assert.ok(s.pairs.every(pr=>pr.members.length===2));assert.equal(new Set(s.pairs.flatMap(pr=>pr.members)).size,12,'cada viajero en una sola pareja');
 assert.ok(s.players.filter(p=>!p.bot).every(p=>p.money===RACE_START_MONEY),'500 € para cada usuario');
 // Transporte: paga, se puede cambiar (devuelve lo anterior) y no se puede pasar del presupuesto.
 actRace(s,ana,{action:'transport',kind:'car',stage:s.stage},T+2000);assert.equal(s.players.find(p=>p.id===20).money,RACE_START_MONEY-180);
 actRace(s,ana,{action:'transport',kind:'train',stage:s.stage},T+3000);assert.equal(s.players.find(p=>p.id===20).money,RACE_START_MONEY-120,'cambiar devuelve el anterior');
 s.players.find(p=>p.id===21).money=50;assert.throws(()=>actRace(s,leo,{action:'transport',kind:'bus',stage:s.stage},T+3000),/dinero/);actRace(s,leo,{action:'transport',kind:'walk',stage:s.stage},T+3000);
 // Prueba por el puente del minijuego: un intento, y después ya no se cambia el transporte.
 assert.throws(()=>actRace(s,ana,{action:'flash_start',stage:s.stage,kind:s.challenge},T+4000),/no permitida/,'solo desde el minijuego');
 actRace(s,ana,{action:'flash_start',stage:s.stage,kind:s.challenge},T+4000,true);const tok=s.runs[20].token;
 assert.throws(()=>actRace(s,ana,{action:'transport',kind:'bus',stage:s.stage},T+5000),/decidido/);
 actRace(s,ana,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:tok,points:1000},T+10000,true);assert.equal(travellerPoints(s,s.players.find(p=>p.id===20)),1200,'tren +20 %');
 actRace(s,leo,{action:'flash_start',stage:s.stage,kind:s.challenge},T+4000,true);actRace(s,leo,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:s.runs[21].token,points:500},T+10000,true);
 // V358: aunque todos ya hayan jugado, la etapa dura siempre 8 minutos enteros (el transporte se puede cambiar hasta el final).
 const leg1Deadline=s.deadline;assert.equal(leg1Deadline-T,LEG_MS+1000,'8 minutos desde que empezó la etapa');
 assert.equal(advanceRace(s,T+11000),false,'con todos listos pero sin agotar los 8 minutos, sigue abierta');assert.equal(s.leg,1);
 assert.equal(advanceRace(s,leg1Deadline-1000),false,'un segundo antes, tampoco');assert.equal(s.leg,1);
 // A los 8 minutos se cierra y sale la pareja con menos puntos (una de bots, con 0).
 advanceRace(s,leg1Deadline);assert.equal(s.leg,2);assert.equal(pairsAlive(s).length,5);assert.equal(s.history[0].results.length,6);
 const out=s.pairs.find(pr=>pr.status==='eliminated');assert.equal(out.placement,6);assert.ok(out.members.every(id=>s.players.find(p=>p.id===id).placement===6));
 const v=raceView(s,ana,leg1Deadline);assert.equal(v.me.money,RACE_START_MONEY-120);assert.ok(v.route&&v.route.length===2);assert.ok(v.players.every(p=>!('score' in p)),'las puntuaciones no se ven antes de llegar');
 // Las etapas siguientes se cierran por tiempo hasta la final entre dos parejas.
 let now=T+11000;for(let i=0;i<10&&s.phase!=='finished';i++){now+=LEG_MS+1000;for(const u of [ana,leo]){const me=s.players.find(p=>p.id===u.id);if(me.status==='active'&&!s.runs[u.id]){actRace(s,u,{action:'flash_start',stage:s.stage,kind:s.challenge},now-LEG_MS+5000,true);actRace(s,u,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:s.runs[u.id].token,points:800},now-LEG_MS+9000,true);}}advanceRace(s,now);}
 assert.equal(s.phase,'finished');const places=s.pairs.map(pr=>pr.placement).sort((a,b)=>a-b);assert.deepEqual(places,[1,2,3,4,5,6],'una posición por pareja');
 assert.ok(s.players.filter(p=>p.placement===1).length===2,'la pareja ganadora: los dos con el 1.º');assert.ok(s.winner.includes(' y '));
 assert.equal(s.players.find(p=>p.id===20).placement,1,'la pareja con usuarios reales que juegan gana a las de bots');
}
// V357: el dinero y el transporte de las demás parejas son privados; solo se ven los tuyos y los de tu pareja.
{
 const s=freshRace(7,T);s.phase='leg';s.leg=2;s.stage=2;s.deadline=T+LEG_MS;s.challenge='GUITAR';
 s.players=[{id:20,username:'Ana',status:'active',placement:null,money:380,pair:1},{id:-701,username:'Bot · R7 · 1',bot:true,status:'active',placement:null,money:500,pair:1},
  {id:-702,username:'Bot · R7 · 2',bot:true,status:'active',placement:null,money:440,pair:2},{id:-703,username:'Bot · R7 · 3',bot:true,status:'active',placement:null,money:320,pair:2}];
 s.pairs=[{id:1,members:[20,-701],status:'active',placement:null},{id:2,members:[-702,-703],status:'active',placement:null}];
 s.choices={20:'train',[-701]:'walk',[-702]:'car',[-703]:'bus'};
 s.history=[{leg:1,stage:1,from:'Madrid',to:'Lisboa',challenge:'GUITAR',results:[{pair:1,points:900,members:[{id:20,username:'Ana',score:400,points:480,transport:'train'},{id:-701,username:'Bot · R7 · 1',score:420,points:420,transport:'walk'}]},{pair:2,points:700,members:[{id:-702,username:'Bot · R7 · 2',score:300,points:390,transport:'car'},{id:-703,username:'Bot · R7 · 3',score:310,points:310,transport:'bus'}]}]}];
 const mine=raceView(s,{id:20,username:'Ana'},T);
 const me357=mine.players.find(p=>p.id===20),partner357=mine.players.find(p=>p.id===-701),rival1=mine.players.find(p=>p.id===-702),rival2=mine.players.find(p=>p.id===-703);
 assert.equal(me357.money,380,'tu dinero se ve');assert.equal(me357.transport,'train');
 assert.equal(partner357.money,500,'el dinero de tu pareja se ve');assert.equal(partner357.transport,'walk');
 assert.equal(rival1.money,null,'el dinero de otra pareja es privado');assert.equal(rival1.transport,null,'su transporte también');
 assert.equal(rival2.money,null);assert.equal(rival2.transport,null);
 const h=mine.history[0],myResult=h.results.find(r=>r.pair===1),otherResult=h.results.find(r=>r.pair===2);
 assert.equal(myResult.members.find(m=>m.id===20).transport,'train','tu etapa anterior: tu transporte se ve');
 assert.equal(myResult.members.find(m=>m.id===-701).transport,'walk','y el de tu pareja');
 assert.ok(otherResult.members.every(m=>m.transport===null),'el transporte de otra pareja en etapas pasadas sigue siendo privado');
 assert.ok(otherResult.members.every(m=>Number.isFinite(m.points)),'los puntos de la etapa ya cerrada sí son públicos');
 const rival=raceView(s,{id:-702,username:'Bot · R7 · 2'},T);assert.equal(rival.players.find(p=>p.id===20).money,null,'y al revés');
}
// Panel de la etapa, insignias de equipo e icono de transporte: diseño de la web (V357).
{
 const page=readFileSync(new URL('../race-page356.js',import.meta.url),'utf8');
 assert.doesNotMatch(page,/race-transport-badge/,'ya no se dibuja el transporte sobre los avatares de arriba');
 assert.match(page,/Equipo\s*'\+p\.pair/,'las plazas muestran «Equipo N»');
 assert.match(page,/race-team-badge race-team-/,'con una clase de color por equipo');
 const css=readFileSync(new URL('../race356.css',import.meta.url),'utf8');
 for(const n of [1,2,3,4,5,6])assert.match(css,new RegExp('\\.race-team-'+n+'\\{background:'));
 assert.match(css,/assets\/formats\/race\.png/,'la cabecera lleva la tarjeta de inscripción de fondo');
 const games=readFileSync(new URL('../games-list258.css',import.meta.url),'utf8');
 assert.match(games,/type-cell\.race,[\s\S]{0,200}background:#bfe0f2/,'la lista de juegos pinta Race del color de su tarjeta');
}
// Inicio automático a los 10 minutos (como Frookies, Casting, Rookies y El Duelo).
{const s=freshRace(6,T);actRace(s,ana,{action:'join'},T);advanceRace(s,T+600001);assert.equal(s.phase,'leg');assert.equal(s.players.length,12);assert.equal(s.pairs.length,6);}
// API con base de datos: inscribirse, completar, iniciar, elegir transporte y premios al terminar.
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const q of items)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const tok=n=>({1:'a',20:'b',21:'c'})[n].repeat(64);for(const [id,u,a] of [[1,'admin1',1],[20,'Ana',0],[21,'Leo',0]]){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,?)').run(id,u,a);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(tok(id)).digest('hex'),id,'2099-01-01');}
const call=async(path,id,body)=>{const r=await race({env:{DB:db},request:new Request('https://t.local'+path,{method:body?'POST':'GET',headers:{Origin:'https://t.local','Content-Type':'application/json',...(id?{Cookie:'session='+tok(id)}:{})},body:body?JSON.stringify(body):undefined})});return {status:r.status,...await r.json()};};
let r=await call('/api/race');assert.equal(r.status,200);const lobby=r.matches.find(m=>m.phase==='waiting').id;
assert.equal((await call('/api/race?id='+lobby,20,{action:'join'})).status,200);assert.equal((await call('/api/race?id='+lobby,21,{action:'join'})).status,200);
assert.equal((await call('/api/race?id='+lobby,20,{action:'fill_bots'})).status,403);assert.equal((await call('/api/race?id='+lobby,1,{action:'fill_bots'})).status,200);
r=await call('/api/race?id='+lobby,1,{action:'start'});assert.equal(r.status,200);assert.equal(r.match.phase,'leg');
r=await call('/api/race?id='+lobby,20,{action:'transport',kind:'bus',stage:r.match.stage});assert.equal(r.status,200);assert.equal(r.match.me.money,440);assert.equal(r.match.me.transport,'bus');
assert.equal(sql.prepare("SELECT COUNT(*) n FROM user_game_history WHERE game_type='RACE'").get().n,2,'aparece en el historial de los dos');
assert.equal((await call('/api/race?id='+lobby,20,{action:'flash_finish',points:999})).status,400,'la puntuación solo entra por el minijuego');
r=await call('/api/race');assert.ok(r.matches.some(m=>m.phase==='waiting'&&m.id!==lobby),'se abre otra sala');
assert.equal((await call('/api/race?id='+r.matches.find(m=>m.phase==='waiting').id,20,{action:'join'})).status,400,'una partida de Race a la vez');
// Premios: forzar el final y comprobar el pago único.
{const row=sql.prepare('SELECT state FROM race_matches WHERE id=?').get(lobby),s=JSON.parse(row.state);let now=Date.now();for(let i=0;i<10&&s.phase!=='finished';i++){now+=LEG_MS+1000;advanceRace(s,now);}sql.prepare('UPDATE race_matches SET state=? WHERE id=?').run(JSON.stringify(s),lobby);}
await call('/api/race?id='+lobby,20);await call('/api/race?id='+lobby,21);
const paid=sql.prepare('SELECT user_id,placement,karma,money,pending FROM race_results ORDER BY user_id').all();assert.ok(paid.every(p=>p.pending===0));
for(const p of paid){const u=sql.prepare('SELECT karma,t_money FROM users WHERE id=?').get(p.user_id);assert.equal(u.karma,p.karma);assert.equal(u.t_money,p.money,'pagado una vez');}
// Página, inscripción y lista de juegos.
const page=readFileSync(new URL('../race.html',import.meta.url),'utf8');for(const t of ['race-page356.js?v=358','game-chat.js?v=356','race356.css?v=358','Cómo funciona Race'])assert.ok(page.includes(t),t);
assert.match(readFileSync(new URL('../enrollment-formats.js',import.meta.url),'utf8'),/race:\{name:'Race',image:'race\.png',implemented:true/);
assert.match(readFileSync(new URL('../functions/microgames.js',import.meta.url),'utf8'),/header\.subcontext==='race'/);
assert.match(readFileSync(new URL('../original-flash.js',import.meta.url),'utf8'),/options\.race\?'race'/);
assert.ok(Object.keys(TRANSPORTS).includes('walk')&&TRANSPORTS.walk.cost===0,'andar es gratis');

// V358: etapas de 8 minutos exactos, siempre completos.
assert.equal(LEG_MS,8*60000,'cada etapa dura 8 minutos');

// V358: lo que suma cada transporte (con «?» si aún no se conoce tu puntuación) y el transporte de tu pareja.
{
 const pageJs=readFileSync(new URL('../race-page356.js',import.meta.url),'utf8');
 assert.match(pageJs,/\(\+'\+\(me\.saved\?Math\.round\(me\.score\*t\.bonus\):'\?'\)\+'\)'/,'entre paréntesis lo que suma, o «?» si no se sabe aún');
 assert.match(pageJs,/ptransport\.icon\+' '\+ptransport\.name:' · todavía no ha elegido transporte'/,'bajo el presupuesto, el transporte de tu pareja');
 assert.doesNotMatch(pageJs,/race-transport-badge/,'ya no se dibuja el transporte sobre los avatares de arriba');
}

// V358: tarjetas de transporte con el estilo de la web (icono en círculo, tarjeta blanca), no el botón amarillo plano.
{
 const css=readFileSync(new URL('../race356.css',import.meta.url),'utf8');
 assert.match(css,/button\.race-transport\{[^}]*border-radius:8px[^}]*background:#fff/,'tarjeta blanca redondeada');
 assert.match(css,/race-transport-icon\{[^}]*border-radius:50%/,'icono en círculo');
}

// V358: la burbuja de Race en el perfil ya no comparte color con Casting; usa su propia tarjeta de inscripción.
{
 assert.match(readFileSync(new URL('../profile-games333.js',import.meta.url),'utf8'),/RACE:'gracebtn'/,'Race ya no usa gbutton (el de Casting)');
 const css=readFileSync(new URL('../profile-games333.css',import.meta.url),'utf8');
 assert.match(css,/\.gracebtn\{[^}]*assets\/bubbles\/race-sphere\.png/,'la burbuja de Race es su propia esfera, no la tarjeta rectangular');
 assert.match(css,/\.grbutton,#profileGames333 \.gsvbutton,#profileGames333 \.gbutton,#profileGames333 \.gdbutton,#profileGames333 \.ghbutton,#profileGames333 \.gracebtn\{/,'conserva el tamaño y la posición del resto de burbujas');
}
console.log('PASS V356/V357/V358: Race completo: parejas, presupuesto, transporte (con su coste visible y el estilo de la web), privacidad, etapas de 8 minutos fijos, minijuegos, eliminación por etapas, final, premios únicos, una partida a la vez y burbuja propia en el perfil');
