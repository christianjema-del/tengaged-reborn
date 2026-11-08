import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';
import * as E from '../functions/_shared/survivor-engine.js';
const admin={id:1,username:'admin1',is_admin:1};
const H=n=>({id:100+n,username:'H'+n});
function started(humans=4,at=Date.UTC(2026,10,10,8),carry=null){
 const s=E.freshSurvivor(5,at,carry);for(let i=0;i<humans;i++)E.actSurvivor(s,H(i),{action:'join'},at);
 E.actSurvivor(s,admin,{action:'fill_bots'},at);E.actSurvivor(s,admin,{action:'start'},at);return s;
}
const me=(s,n)=>s.players.find(p=>p.id===100+n);
const setWeather=(s,t,kind,at)=>{const w=[[at-1,at+3600000]];s.camps[t].schedule={start:at,sun:kind==='sun'?w:[],rain:kind==='rain'?w:[],fire:kind==='fire'?w:[]};};

test('segundos de prueba según pollo y agua (ejemplos de las normas)',()=>{
 assert.equal(E.challengeSeconds(100,100),200);assert.equal(E.challengeSeconds(94,95),194);
 assert.equal(E.challengeSeconds(94,0),147);assert.equal(E.challengeSeconds(88,0),144);assert.equal(E.challengeSeconds(0,0),100);
 assert.equal(E.mergeSupply(30),40);assert.equal(E.mergeSupply(31),31);assert.equal(E.mergeSupply(96),100);
});
test('dos tribus de diez; reservas de tribu a 50/50; salud inicial 100/100 o la heredada',()=>{
 const at=Date.UTC(2026,10,10,8),s=E.freshSurvivor(5,at);E.actSurvivor(s,H(0),{action:'join',health:{food:70,water:70}},at,true);E.actSurvivor(s,H(1),{action:'join',health:{food:10,water:10}},at,false);
 assert.deepEqual([me(s,0).food,me(s,0).water],[70,70]);assert.deepEqual([me(s,1).food,me(s,1).water],[100,100],'un usuario no puede imponer su salud');
 E.actSurvivor(s,admin,{action:'fill_bots'},at);E.actSurvivor(s,admin,{action:'start'},at);
 assert.equal(s.phase,'day');assert.deepEqual(E.TRIBES.map(t=>E.tribeOf(s,t).length),[10,10]);
 for(const t of E.TRIBES)assert.deepEqual([s.camps[t].food,s.camps[t].water],[50,50]);
 assert.throws(()=>E.actSurvivor(s,H(5),{action:'join'},at),/cerrada/);
});
test('la tribu unificada pasa entera a la tribu A y los nuevos llenan la tribu B',()=>{
 const carry={from:4,players:[0,1,2].map(n=>({id:100+n,username:'H'+n,food:40,water:100}))};
 const s=started(0,Date.UTC(2026,10,10,8),carry);
 for(const n of [0,1,2])assert.equal(me(s,n).tribe,'A');assert.equal(E.tribeOf(s,'B').length,10);assert.equal(me(s,0).food,40);
});
test('cazar solo con sol (−6 de agua) y se suman 10 de pollo a los 30–45 min, máximo 100',()=>{
 const s=started(),p=me(s,0),t=p.tribe,at=s.startedAt+1000;setWeather(s,t,'rain',at);
 assert.throws(()=>E.actSurvivor(s,p,{action:'hunt'},at),/sol/);
 setWeather(s,t,'sun',at);E.actSurvivor(s,p,{action:'hunt'},at);assert.equal(p.water,94);
 assert.throws(()=>E.actSurvivor(s,p,{action:'hunt'},at),/Ya estás cazando/);
 const q=me(s,1);if(q.tribe===t)E.actSurvivor(s,q,{action:'hunt'},at);
 s.camps[t].food=95;E.advanceSurvivor(s,at+29*60000);assert.equal(s.camps[t].food,95,'aún no ha vuelto');
 E.advanceSurvivor(s,at+46*60000);assert.equal(s.camps[t].food,100,'lo que sobra de 100 se pierde');
});
test('el cubo: solo con lluvia, una persona a la vez, −6 de pollo y +10 de agua en una hora',()=>{
 const s=started(),p=me(s,0),t=p.tribe,at=s.startedAt+1000,mate=s.players.find(q=>q.tribe===t&&q!==p&&!q.bot)||s.players.find(q=>q.tribe===t&&q!==p);setWeather(s,t,'rain',at);
 E.actSurvivor(s,p,{action:'bucket'},at);assert.equal(p.food,94);
 assert.throws(()=>E.actSurvivor(s,mate,{action:'bucket'},at),/Ya hay alguien/);
 E.advanceSurvivor(s,at+66*60000);assert.equal(s.camps[t].water,60);
});
test('comer y beber con el fuego encendido; con el fuego apagado hay que aceptar el riesgo del 50 %',()=>{
 const s=started(),p=me(s,0),t=p.tribe,at=s.startedAt+1000;p.food=60;p.water=60;setWeather(s,t,'fire',at);
 E.actSurvivor(s,p,{action:'eat',food:20,water:10},at);assert.deepEqual([p.food,p.water,s.camps[t].food,s.camps[t].water],[80,70,30,40]);
 assert.throws(()=>E.actSurvivor(s,p,{action:'eat',food:31},at),/reserva/);
 assert.throws(()=>E.actSurvivor(s,p,{action:'eat',food:21},at),/100/);
 E.actSurvivor(s,p,{action:'fan'},at);assert.equal(p.water,65);assert.equal(s.camps[t].schedule.fire[0][1],at+3600000+E.FAN_MS);
 setWeather(s,t,'sun',at);assert.throws(()=>E.actSurvivor(s,p,{action:'eat',food:1},at),/fuego está apagado/);
 let doomed=false;for(let i=0;i<60&&!doomed;i++){s.camps[t].food=50;p.food=50;p.water=50;p.doomed=false;const r=E.actSurvivor(s,p,{action:'eat',food:1,risk:true},at);doomed=r.poisoned;}
 assert.ok(doomed,'en algún intento sale mal');assert.deepEqual([p.food,p.water,p.doomed],[0,0,true]);
 E.advanceSurvivor(s,s.deadline);assert.equal(p.status,'eliminated');assert.equal(p.deathCause,'starvation');
});
test('cambio de día: −5 de agua y −6 de pollo; solo muere quien está a 0/0',()=>{
 const s=started(),a=me(s,0),b=me(s,1),c=me(s,2);a.food=1;a.water=0;b.food=0;b.water=0;c.food=100;c.water=100;
 E.advanceSurvivor(s,s.deadline);
 assert.equal(a.status,'active');assert.deepEqual([a.food,a.water],[0,0]);assert.equal(b.status,'eliminated');assert.deepEqual([c.food,c.water],[94,95]);
});
test('prueba de tribu: si juegan de más se quita la más alta; sentados; puntuaciones privadas hasta el cambio de día',()=>{
 const s=started(6);s.required=2;const tribe=me(s,0).tribe,mates=s.players.filter(p=>p.tribe===tribe);const day=s.day;
 const play=(p,pts)=>{const r=E.actSurvivor(s,p,{action:'flash_start',mode:'tribe',day},s.startedAt+1000,true);assert.equal(r.attempt.duration,E.challengeSeconds(p.food,p.water));E.actSurvivor(s,p,{action:'flash_finish',mode:'tribe',day,token:r.attempt.token,points:pts},s.startedAt+5000,true);};
 play(mates[0],100);play(mates[1],300);play(mates[2],200);
 assert.equal(E.tribeTotal(s,day,tribe,2).total,300,'quedan 100+200: se quita la de 300');
 const v=E.survivorView(s,mates[0],s.startedAt+6000),rival=s.players.find(p=>p.tribe!==tribe&&!p.bot)||s.players.find(p=>p.tribe!==tribe),vr=E.survivorView(s,rival,s.startedAt+6000);
 assert.equal(v.today.own.total,300);assert.ok(!JSON.stringify(vr.today).includes('"points":300'),'la otra tribu no ve las puntuaciones');
 const other=s.players.find(p=>p.tribe===tribe&&!s.scores[day][String(p.id)]);s.required=9;
 E.actSurvivor(s,other,{action:'sitout'},s.startedAt+7000);assert.throws(()=>E.actSurvivor(s,other,{action:'flash_start',mode:'tribe',day},s.startedAt+8000,true),/te sientas/);
 assert.throws(()=>E.actSurvivor(s,mates[0],{action:'sitout'},s.startedAt+8000),/Ya has jugado/);
 const lateP=s.players.find(p=>p.tribe===tribe&&p!==other&&!s.scores[day][String(p.id)]),late=E.actSurvivor(s,lateP,{action:'flash_start',mode:'tribe',day},s.startedAt+9000,true).attempt;
 assert.throws(()=>E.actSurvivor(s,lateP,{action:'flash_finish',mode:'tribe',day,token:late.token,points:5},s.startedAt+9000+late.duration*1000+E.ATTEMPT_GRACE_MS+1,true),/tiempo/);
});
test('Consejo Tribal: la inmunidad anula los votos y sale el más votado con su puesto',()=>{
 const s=started(4);E.advanceSurvivor(s,s.deadline);const t=s.nominated,day=s.day,mates=E.tribeOf(s,t);assert.ok(t);
 const [a,b,c,d]=mates;const r=E.actSurvivor(s,a,{action:'flash_start',mode:'immunity',day},s.deadline-DAY+1000,true);E.actSurvivor(s,a,{action:'flash_finish',mode:'immunity',day,token:r.attempt.token,points:50},s.deadline-DAY+2000,true);
 for(const v of [b,c])E.actSurvivor(s,v,{action:'vote',target:a.id},s.deadline-1000);
 E.actSurvivor(s,d,{action:'vote',target:b.id},s.deadline-1000);E.actSurvivor(s,a,{action:'vote',target:b.id},s.deadline-1000);
 const rival=s.players.find(p=>p.tribe!==t&&p.status==='active');assert.throws(()=>E.actSurvivor(s,rival,{action:'vote',target:a.id},s.deadline-1000),/Consejo/);
 const view=E.survivorView(s,rival,s.deadline-500);assert.equal(view.immunity,null,'la inmunidad solo la ve su tribu');assert.ok(!JSON.stringify(view).includes('"vote":'+a.id));
 E.advanceSurvivor(s,s.deadline);const last=s.history.at(-1);
 assert.equal(last.council.out,b.username);assert.equal(b.placement,20);assert.equal(last.council.immune,a.username);assert.equal(last.council.votes.find(v=>v.username===a.username).votes,0);
});
const DAY=E.DAY_MS;
test('la prueba empezada antes del cambio de día conserva su tiempo',()=>{
 const s=started(2),p=me(s,0),day=s.day,r=E.actSurvivor(s,p,{action:'flash_start',mode:'tribe',day},s.deadline-10000,true);
 E.advanceSurvivor(s,s.deadline+1000);assert.equal(s.day,day,'espera al intento en curso');
 E.actSurvivor(s,p,{action:'flash_finish',mode:'tribe',day,token:r.attempt.token,points:77},s.deadline-1,true);
 E.advanceSurvivor(s,s.deadline+1);assert.equal(s.day,day+1);assert.equal(s.history.at(-1).totals[p.tribe],77);
});
test('unificación al quedar 10: comparten el primer puesto y los humanos pasan con la salud ajustada',()=>{
 const s=started(3);for(let i=0;i<30&&s.phase==='day';i++)E.advanceSurvivor(s,s.deadline+1);
 assert.equal(s.phase,'finished');const merged=s.players.filter(p=>p.status==='merged');assert.equal(merged.length,10);assert.ok(merged.every(p=>p.placement===1));
 assert.deepEqual(s.players.filter(p=>p.status==='eliminated').map(p=>p.placement).sort((a,b)=>a-b),[11,12,13,14,15,16,17,18,19,20]);
 for(const c of s.carry?.players||[]){const p=s.players.find(q=>q.id===c.id);assert.ok(!p.bot&&p.status==='merged');assert.ok(c.food>30&&c.water>30,'30 o menos sube a 40');}
 assert.ok(s.history.length<=11);
});

// ---------- Servicio con base de datos ----------
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0,is_banned INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)");
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
test('servicio: inscripción, historial, salud heredada, premios y siguiente partida con la tribu unificada',async()=>{
 const Svc=await import('../functions/_shared/survivor-service.js');
 sql.exec("INSERT INTO users(id,username,is_admin) VALUES(1,'admin1',1),(100,'H0',0),(101,'H1',0),(102,'H2',0)");
 await Svc.waitingSurvivor(db);const list=await Svc.survivorListing(db,null);assert.equal(list.length,1);const id=list[0].id;
 await Svc.ensureSurvivor(db);sql.prepare('INSERT INTO survivor_health(user_id,food,water,match_id) VALUES(101,70,65,0)').run();
 for(const u of [100,101,102])await Svc.survivorMatch(db,id,{id:u,username:'H'+(u-100)},{action:'join'});
 let m=(await Svc.survivorMatch(db,id,{id:101,username:'H1'})).match;assert.deepEqual([m.me.food,m.me.water],[70,65],'empieza con la salud con la que lo echaron');
 await Svc.survivorMatch(db,id,{id:1,username:'admin1',is_admin:1},{action:'fill_bots'});await Svc.survivorMatch(db,id,{id:1,username:'admin1',is_admin:1},{action:'start'});
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM user_game_history WHERE game_type='SURVIVOR'").get().n,3);
 let t=Date.now();for(let i=0;i<30;i++){const st=JSON.parse(sql.prepare('SELECT state FROM survivor_matches WHERE id=?').get(id).state);if(st.phase!=='day')break;t=Math.max(t,st.deadline+1);await Svc.survivorMatch(db,id,null,null,false,null,t);}
 const st=JSON.parse(sql.prepare('SELECT state FROM survivor_matches WHERE id=?').get(id).state);assert.equal(st.phase,'finished');
 for(const p of st.players.filter(p=>!p.bot)){
  const h=sql.prepare("SELECT status,placement FROM user_game_history WHERE game_type='SURVIVOR' AND username=?").get(p.username);
  if(p.status==='merged'){assert.deepEqual([h.status,h.placement],['finished','Unificación']);assert.deepEqual({...sql.prepare('SELECT karma,t_money FROM users WHERE id=?').get(p.id)},{karma:40,t_money:10});}
  else{assert.equal(h.status,'eliminated');assert.ok(sql.prepare('SELECT 1 FROM survivor_health WHERE user_id=? AND match_id=?').get(p.id,id),'guarda su salud al ser expulsado');}
 }
 await Svc.survivorMatch(db,id,null,null,false,null,t+1);assert.equal(sql.prepare('SELECT COUNT(*) n FROM survivor_results WHERE pending=0').get().n,st.players.filter(p=>!p.bot&&p.status==='merged').length,'el premio se paga una sola vez');
 const next=(await Svc.survivorListing(db,null)).find(g=>g.phase==='waiting');assert.ok(next&&next.id!==id);
 const ns=JSON.parse(sql.prepare('SELECT state FROM survivor_matches WHERE id=?').get(next.id).state);
 assert.deepEqual(ns.players.map(p=>p.username).sort(),(st.carry?.players||[]).map(p=>p.username).sort(),'pasan los humanos unificados');
 assert.equal(JSON.parse(sql.prepare('SELECT state FROM survivor_matches WHERE id=?').get(id).state).nextId,st.carry?next.id:null,'solo se enlaza si pasan supervivientes humanos');
});
test('página: réplica de Regaged en castellano, refresco de 30 s y piezas integradas',()=>{
 const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
 const page=read('survivor-page303.js'),html=read('survivor.html'),css=read('survivor303.css');
 for(const t of ['Tribu rival','Ayuda','Prueba','Inmunidad','Consejo','Últimos blogs de Survivor','Consejo Tribal'])assert.ok(html.includes(t)||page.includes(t),t);
 // V304: sin apartados de prueba, resultados ni historia en la página; los resultados van bajo el minijuego.
 for(const t of ['Resultados de las pruebas','Historia del juego','id="svChallenge"','id="svPhase"'])assert.ok(!html.includes(t),'sin '+t);
 const ch=read('survivor-challenge303.js'),chHtml=read('survivor-challenge.html');
 assert.ok(chHtml.includes('id="challengeLeaderboard"')&&chHtml.indexOf('challengeBoard')<chHtml.indexOf('challengeLeaderboard'),'resultados debajo del minijuego');
 for(const t of ['compañeros han terminado','se sienta hoy','está realizando la prueba','challenge-own-result','Sentarme hoy'])assert.ok(ch.includes(t),t);
 assert.match(page,/survivor-challenge\.html\?'\+new URLSearchParams\(\{id:s\.id,day:s\.day,mode:'tribe'\}\)/);assert.match(page,/mode:'immunity'/);
 assert.match(page,/setInterval\(\(\)=>\{if\(!document\.hidden\)load\(\);\},30000\)/);
 for(const rule of ['.survivorRoster{display:grid;grid-template-columns:repeat(10,minmax(0,1fr))','.survivorResources{display:grid;grid-template-columns:repeat(4,75px)','.survivorBannerTimer{position:absolute;top:70.23%;left:62.4%'])assert.ok(css.includes(rule),rule);
 for(const img of ['bg-game-sidetitle-survivor.gif','icon_game_campfire_1.gif','icon_game_campfire_3.gif','icon_game_weather_1.gif','icon_game_weather_2.gif','icon_game_weather_3.gif','icon_game_water_level.gif','icon_game_food_level.gif','clock.gif'])assert.ok(fs.existsSync(new URL('../assets/survivor/'+img,import.meta.url)),img);
 assert.match(read('functions/microgames.js'),/subcontext==='survivor'/);assert.match(read('original-flash.js'),/options\.survivor\?'survivor'/);
 assert.match(read('functions/api/tick.js'),/survivor_matches/);assert.match(read('functions/api/game-chat.js'),/'survivor'/);
 assert.match(read('enrollment-formats.js'),/survivor:\{name:'Survivor',image:'survivor.png',implemented:true/);
});
test('minijuego Flash: abre la prueba de tribu con el tiempo del jugador y guarda la puntuación',async()=>{
 const {onRequestGet:micro}=await import('../functions/microgames.js'),{encode,decode}=await import('../functions/_shared/flash-protocol.js'),Svc=await import('../functions/_shared/survivor-service.js');
 const token='7'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
 sql.exec("INSERT OR IGNORE INTO users(id,username) VALUES(200,'Flash')");sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,200,'2099-01-01');
 await Svc.waitingSurvivor(db);const id=(await Svc.survivorListing(db,null)).find(g=>g.phase==='waiting').id;
 await Svc.survivorMatch(db,id,{id:200,username:'Flash'},{action:'join'});
 const a={id:1,username:'admin1',is_admin:1};await Svc.survivorMatch(db,id,a,{action:'fill_bots'});await Svc.survivorMatch(db,id,a,{action:'start'});
 const st=JSON.parse(sql.prepare('SELECT state FROM survivor_matches WHERE id=?').get(id).state),kind=st.challenge.kind,type={wheel:'WOF',numbers:'NUMBERS',deal:'DEAL',match:'MATCH3',endurance:'ENDURANCE',words:'WORDS',guitar:'GUITAR',maze:'MAZE',snow:'STARFLAKES',line:'LINEBALLS'}[kind];
 const call=async payload=>{const r=await micro({request:new Request('https://t.test/microgames?data='+encode(payload),{headers:{Cookie:'session='+token,'Sec-Fetch-Site':'same-origin'}}),env:{DB:db}});return {status:r.status,body:decode(await r.text())};};
 const header={context:'game',contextId:String(id),subcontext:'survivor',subcontextId:st.day+':tribe'};
 const start=await call({type,function:'requestGameData',header});assert.equal(start.status,200);assert.equal(start.body.error,0);
 const code=start.body.header.code;assert.match(code,/^[0-9a-f-]{36}$/);
 const saved=await call({type,function:'requestSaveGameData',header:{...header,code},data:{points:4321}});assert.equal(saved.body.error,0);assert.equal(saved.body.recorded,true);
 const m=(await Svc.survivorMatch(db,id,{id:200,username:'Flash'})).match;assert.equal(m.me.score,4321);assert.equal(m.today.own.total,4321);
 const again=await call({type,function:'requestGameData',header});assert.equal(again.body.error,1,'no se puede repetir la prueba');
});
test('V305: mensajes privados, burbuja del perfil, color en la lista de juegos y pestañas del chat',()=>{
 const s=started(3),a=me(s,0),b=me(s,1),c=me(s,2),at=s.startedAt+1000;
 E.actSurvivor(s,a,{action:'whisper',to:b.id,body:'hola'},at);
 assert.throws(()=>E.actSurvivor(s,a,{action:'whisper',to:b.id,body:'otra'},at+1000),/tres segundos/);
 assert.throws(()=>E.actSurvivor(s,a,{action:'whisper',to:s.players.find(p=>p.bot).id,body:'x'},at+5000),/no válido/);
 assert.deepEqual(E.survivorView(s,b,at).whispers.map(w=>[w.from,w.to,w.body]),[['H0','H1','hola']]);
 assert.deepEqual(E.survivorView(s,c,at).whispers,[],'los demás no ven los privados');
 const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
 assert.match(read('profile.html'),/kind==='SURVIVOR'\?'\/survivor\.html\?id='\+encodeURIComponent\(game\.game_id\)/);
 assert.match(read('profile-classic166.js'),/SURVIVOR:'\/survivor\.html\?id='/);
 assert.match(read('games-list258.css'),/td\.type-cell\.survivor\{background:#dcf6dd!important\}/);
 const html=read('survivor.html');for(const id of ['froPublic','froPrivate','froPublicCount','public-chat','froWhispers','froWhisperForm'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(read('game-chat.js'),/frookies\|\|rookies\|\|survivor/);assert.match(read('game-feed.js'),/'survivor'\?'\/survivor\.html\?id='|type==='survivor'\?'\/survivor\.html\?id='/);
});
test('V307: en inscripción no hay texto encima de los avatares',()=>{
 const page=fs.readFileSync(new URL('../survivor-page303.js',import.meta.url),'utf8');
 assert.ok(!page.includes('Inscripción · '));assert.match(page,/\$\('svPhaseLabel'\)\.hidden=s\.phase==='waiting'/);
});
