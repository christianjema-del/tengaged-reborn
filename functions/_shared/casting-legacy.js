import {BASE_CHALLENGE_SECONDS} from './challenge-time.js';
import {enrollmentOptions} from './enrollment.js';
export const KEY_FIRST_MS=60000,KEY_INTERVAL_MS=180000,KEY_LIFETIME_MS=120000;
export const CAPACITY=16,LOBBY_MS=300000,PHASE_MS=600000;
// Original Flash minigames: one persisted random choice shared by the round.
export const CHALLENGES=['wheel','numbers','deal','match','guitar','endurance','maze','snow','words','line'];
const CHALLENGE_NAMES={wheel:'Wheel of Fortune',numbers:'Numbers',deal:'Deal or No Deal',match:'Match Three',guitar:'Guitar',endurance:'Endurance',maze:'Maze',snow:'Snow Flakes',words:'Words',line:'Line Balls'};
export function challengeFor(s){return s.challengeRound===s.round&&CHALLENGES.includes(s.selectedChallenge)?s.selectedChallenge:CHALLENGES[(s.round-1)%CHALLENGES.length];}
function randomIndex(length){const ceiling=0x100000000-(0x100000000%length);let value;do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=ceiling);return value%length;}
function beginChallenge(s){
 if(s.challengeRound===s.round)return;
 let bag=Array.isArray(s.challengeBag)?s.challengeBag.filter(x=>CHALLENGES.includes(x)):[];
 if(!bag.length){bag=[...CHALLENGES];for(let i=bag.length-1;i>0;i--){const j=randomIndex(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
  // Avoid a repeated game across the boundary between two bags.
  if(bag.at(-1)===s.selectedChallenge)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
 }
 s.selectedChallenge=bag.pop();s.challengeBag=bag;s.challengeRound=s.round;s.scoringMode='flash-v1';s.flashAttempts={};s.flashScores={};
}

export function challengeQuestions(s){
 const seed=(Number(s.id)||1)*97+s.round*73;
 const kind=challengeFor(s);
 if(kind==='numbers')return Array.from({length:5},(_,i)=>{const a=(seed+i*13)%31+8,b=(seed+i*19)%17+3;return {question:`${a} + ${b} = ?`,answer:String(a+b)};});
 if(kind==='words')return [{question:'Completa: C_SA',answer:'CASA'},{question:'Completa: G_TO',answer:'GATO'},{question:'Completa: L_NA',answer:'LUNA'},{question:'Completa: S_L',answer:'SOL'},{question:'Completa: M_R',answer:'MAR'}];
 if(kind==='wheel')return [{question:'Animal que maúlla (4 letras)',answer:'GATO'},{question:'Brilla de día (3 letras)',answer:'SOL'},{question:'Satélite de la Tierra (4 letras)',answer:'LUNA'},{question:'Tiene ramas y hojas (5 letras)',answer:'ARBOL'},{question:'Se usa para abrir una puerta (5 letras)',answer:'LLAVE'}];
 return [];
}

export function fresh(id=0,now=Date.now()){return {id,phase:'waiting',round:1,players:[],startAt:null,deadline:null,reactions:{},nominations:{},ballots:{},immune:null,nominees:[],eliminations:[],events:[],winner:null,createdAt:now};}
const key=p=>p.username.toLowerCase();
export const alive=s=>s.players.filter(p=>p.status==='active');
function log(s,text,now,extra={}){s.events.unshift({text,at:now,...extra});s.events=s.events.slice(0,60);}
function pick(items,seed){let hash=0;for(const c of seed)hash=(hash*31+c.charCodeAt(0))>>>0;return [...items].sort((a,b)=>a.localeCompare(b))[hash%items.length];}
function phase(s,value,now){s.phase=value;s.deadline=now+PHASE_MS;if(!s.nextKeyAt)s.nextKeyAt=now+KEY_FIRST_MS;}
function finished(s,winner,now){s.phase='finished';s.winner=winner;s.deadline=null;s.finishedAt=now;s.players.find(p=>key(p)===winner.toLowerCase()).placement=1;for(const p of alive(s))if(key(p)!==winner.toLowerCase()&&!p.placement)p.placement=2;log(s,winner+' gana el Casting.',now);}
export function advance(s,now=Date.now(),force=false){
 if(s.phase==='waiting'){if(alive(s).length>=2&&now>=s.startAt){beginChallenge(s);phase(s,'immunity',now);log(s,'Comienza el Casting. ¡Suerte!',now);}return s;}
 if(s.phase==='finished')return s;
 s.keyDrops??=[];if(!Number.isFinite(s.nextKeyAt))s.nextKeyAt=now+KEY_FIRST_MS;if(now>=s.nextKeyAt){const available=s.keyDrops.some(x=>!x.claimedBy&&x.expiresAt>now);if(!available){const drop={id:crypto.randomUUID(),at:now,expiresAt:now+KEY_LIFETIME_MS,position:2,claimedBy:null};s.keyDrops.push(drop);log(s,'Big Brother deja una llave en el chat.',now,{kind:'key-drop',dropId:drop.id});}s.nextKeyAt=now+KEY_INTERVAL_MS;s.keyDrops=s.keyDrops.slice(-30);}
 // An untouched legacy round can adopt originals; partially scored rounds finish unchanged.
 if(s.phase==='immunity'&&!s.scoringMode&&!Object.keys(s.reactions).length)beginChallenge(s);
 const players=alive(s);if(players.length===1){finished(s,players[0].username,now);return s;}
 if(players.length<2)return s;
 const timed=force||now>=s.deadline;
 if(s.phase==='immunity'&&(players.every(p=>s.reactions[key(p)]!==undefined)||timed)){
 const ranked=players.filter(p=>s.reactions[key(p)]!==undefined).sort((a,b)=>s.reactions[key(a)]-s.reactions[key(b)]||key(a).localeCompare(key(b)));
 const winner=ranked[0]?.username||pick(players.map(p=>p.username),s.id+':'+s.round);
 if(players.length===2){finished(s,winner,now);return s;}
 s.immune=winner;s.players.find(p=>p.username===winner).keys++;phase(s,'nominations',now);log(s,winner+' gana la inmunidad y una llave.',now);return s;}
 if(s.phase==='nominations'&&(players.every(p=>s.nominations[key(p)]!==undefined)||timed)){
 const eligible=players.filter(p=>p.username!==s.immune);const count={};for(const vote of Object.values(s.nominations))count[vote.target]=(count[vote.target]||0)+vote.weight;
 s.nominees=eligible.sort((a,b)=>(count[b.username]||0)-(count[a.username]||0)||key(a).localeCompare(key(b))).slice(0,2).map(p=>p.username);phase(s,'elimination',now);log(s,'Nominados: '+s.nominees.join(' y ')+'.',now);return s;}
 if(s.phase==='elimination'&&(players.every(p=>s.ballots[key(p)]!==undefined)||timed)){
 const count={};for(const target of Object.values(s.ballots))count[target]=(count[target]||0)+1;const maximum=Math.max(...s.nominees.map(n=>count[n]||0));const tied=s.nominees.filter(n=>(count[n]||0)===maximum);const target=pick(tied,s.id+':'+s.round+':evict');const player=s.players.find(p=>p.username===target);player.status='eliminated';player.placement=player.bot?s.players.filter(x=>!x.bot).length+alive(s).filter(x=>x.bot).length+1:alive(s).filter(x=>!x.bot).length+1;player.eliminatedAt186=now;s.eliminations.unshift({username:target,votes:count[target]||0,round:s.round,at:now});log(s,target+' queda eliminado/a.',now);
 s.round++;s.reactions={};s.nominations={};s.ballots={};s.nominees=[];s.immune=null;beginChallenge(s);phase(s,'immunity',now);return s;}
 return s;
}
export function act(s,user,input,now=Date.now(),trustedFlash=false){
 advance(s,now);const action=input.action;let p=s.players.find(p=>key(p)===user.username.toLowerCase());
 if(action==='join'){const enrollment=enrollmentOptions(input);if(s.phase!=='waiting')throw Error('La inscripción de esta partida está cerrada.');if(p)throw Error('Ya estás inscrito/a.');if(s.players.length>=CAPACITY)throw Error('No quedan plazas.');p={username:user.username,status:'active',health:100,apples:3,keys:0,lastRest:0,placement:null};if(enrollment){p.notifyOnStart=enrollment.notifyOnStart;s.welcomes??=[];s.welcomes.push({username:user.username,body:enrollment.welcome,at:now});}s.players.push(p);if(s.players.length===2)s.startAt=now+LOBBY_MS;if(s.players.length===CAPACITY)s.startAt=now;log(s,user.username+' se inscribe.',now);advance(s,now);return;}
 if(action==='start'){if(!user.is_admin)throw Error('Solo administración puede adelantar el inicio.');if(s.phase!=='waiting'||s.players.length<2)throw Error('Se necesitan al menos dos participantes.');s.startAt=now;advance(s,now);return;}
 if(action==='advance'){if(!user.is_admin)throw Error('Solo administración puede adelantar una fase.');if(!['immunity','nominations','elimination'].includes(s.phase))throw Error('No hay una fase activa.');advance(s,now,true);return;}
 if(trustedFlash&&action==='flash_finish'&&p&&input.round===s.round&&input.kind===challengeFor(s)&&s.flashScores?.[key(p)]&&s.flashAttempts?.[key(p)]?.token===input.token)return;
 if(!p||p.status!=='active'||['waiting','finished'].includes(s.phase))throw Error('Debes estar activo/a en esta partida.');
 if(action==='claim_key'){const drop=s.keyDrops?.find(x=>x.id===input.dropId);if(!drop)throw Error('Este aviso ya no está disponible.');const slot=input.slot===undefined?drop.position:Number(input.slot);if(!Number.isInteger(slot)||slot<0||slot>4)throw Error('Elige una opción válida.');
 if(slot===drop.position&&drop.claimedBy===key(p))return;
 if(slot!==drop.position&&drop.poisonClaims?.[slot]===key(p))return;
 if(drop.claimedBy||now>=drop.expiresAt)throw Error('Este aviso ya no está disponible.');
 if(slot!==drop.position){drop.poisonClaims??={};if(drop.poisonClaims[slot])throw Error('Este frasco ya fue recogido.');drop.poisonClaims[slot]=key(p);p.health=Math.max(0,p.health-15);log(s,p.username+' toca veneno y pierde 15 de salud.',now,{kind:'key-poison',dropId:drop.id});if(p.health===0){const placement=alive(s).length;p.status='eliminated';p.placement=placement;s.eliminations.unshift({username:p.username,round:s.round,at:now,cause:'poison'});log(s,p.username+' queda eliminado/a por veneno.',now);s.nominees=s.nominees.filter(x=>x!==p.username);if(alive(s).length>1&&s.phase!=='immunity'&&(alive(s).length===2||!s.nominees.length)){s.round++;s.reactions={};s.nominations={};s.ballots={};s.nominees=[];s.immune=null;beginChallenge(s);phase(s,'immunity',now);}advance(s,now);}return;}
 drop.claimedBy=key(p);drop.claimedAt=now;p.keys=(p.keys||0)+1;log(s,p.username+' recoge una llave del chat.',now,{kind:'key-collected',dropId:drop.id});return;}
 if(action==='eat_apple'){if(p.apples<1||p.health>=100)throw Error('No tienes manzanas o ya tienes la salud completa.');p.apples--;p.health=Math.min(100,p.health+20);return;}
 if(action==='rest'){if(p.health>=100)throw Error('Ya tienes la salud completa.');if(now-(p.lastRest||0)<60000)throw Error('Espera un minuto entre descansos.');p.lastRest=now;p.health=Math.min(100,p.health+20);return;}
 if(action==='flash_start'||action==='flash_finish'){
  if(!trustedFlash)throw Error('Utiliza el minijuego de esta ronda.');
  if(s.phase!=='immunity'||s.scoringMode!=='flash-v1')throw Error('La prueba no está abierta.');
  if(input.round!==s.round||input.kind!==challengeFor(s))throw Error('La prueba pertenece a otra ronda.');
  s.flashAttempts=s.flashAttempts||{};s.flashScores=s.flashScores||{};
  const participant=key(p),attempt=s.flashAttempts[participant];
  if(action==='flash_start'){
   if(s.reactions[participant]!==undefined)throw Error('Ya has completado la prueba.');
   if(!attempt){
    if(p.health<20)throw Error('Necesitas 20 de salud. Come una manzana o descansa.');
    p.health-=20;s.flashAttempts[participant]={token:crypto.randomUUID(),kind:input.kind,round:s.round,startedAt:now,duration:BASE_CHALLENGE_SECONDS};
   }
   return;
  }
  if(!attempt||attempt.token!==input.token)throw Error('Intento de juego no válido.');
  if(s.reactions[participant]!==undefined)return;
  const points=input.points;
  if(typeof points!=='number'||!Number.isFinite(points)||points<0||points>1000000000)throw Error('Puntuación no válida.');
  if(now-attempt.startedAt<1000)throw Error('La prueba ha terminado demasiado pronto.');
  // The SWF reports points; authentication and replay checks do not make gameplay cheat-proof.
  s.flashScores[participant]={points,verified:false,savedAt:now};s.reactions[participant]=-points;
  log(s,p.username+' termina '+CHALLENGE_NAMES[input.kind]+' ('+points+' puntos).',now);
  advance(s,now);return;
 }
 if(action==='challenge'){
 if(s.scoringMode==='flash-v1')throw Error('La puntuación se guarda automáticamente desde el minijuego.');
 if(s.phase!=='immunity')throw Error('La prueba no está abierta.');if(s.reactions[key(p)]!==undefined)throw Error('Ya has completado la prueba.');
 if(p.health<20)throw Error('Necesitas 20 de salud.');
 const kind=challengeFor(s);const duration=Number(input.duration_ms);
 if(!Number.isFinite(duration)||duration<1000||duration>600000)throw Error('Duración no válida.');
 let correct=0;
 if(['wheel','numbers','words'].includes(kind)){
  const answers=input.answers;
  if(!Array.isArray(answers)||answers.length!==5||answers.some(a=>typeof a!=='string'||a.length>30))throw Error('Respuestas no válidas.');
  correct=challengeQuestions(s).filter((q,i)=>q.answer===answers[i].trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')).length;
 } else {
  // Interaction games submit normalized scores. Gameplay is rendered on the client;
  // server clamps values and keeps one attempt per casting round.
  const raw=Number(input.score);
  if(!Number.isInteger(raw)||raw<0||raw>100)throw Error('Puntuación no válida.');
  correct=raw/20;
 }
 s.reactions[key(p)]=Math.round((5-correct)*100000)+Math.max(1000,Math.round(duration));p.health-=20;
 log(s,p.username+' termina '+CHALLENGE_NAMES[kind]+' ('+Math.round(correct*20)+' puntos).',now);
 }
 else if(action==='reaction'){
 if(s.scoringMode==='flash-v1')throw Error('Esta ronda utiliza un minijuego original.');
 if(s.phase!=='immunity')throw Error('La prueba no está abierta.');if(s.reactions[key(p)]!==undefined)throw Error('Ya has completado esta prueba.');const score=Number(input.reaction_ms);if(!Number.isFinite(score)||score<100||score>10000)throw Error('Tiempo de reacción no válido.');if(p.health<20)throw Error('Necesitas 20 de salud. Come una manzana o descansa.');s.reactions[key(p)]=Math.round(score);p.health-=20;}
 else if(action==='nominate'){
 if(s.phase!=='nominations')throw Error('Las nominaciones no están abiertas.');if(s.nominations[key(p)]!==undefined)throw Error('Ya has nominado.');const target=alive(s).find(x=>key(x)===String(input.target).toLowerCase());if(!target||target===p||target.username===s.immune)throw Error('Elige otro jugador activo que no tenga inmunidad.');s.nominations[key(p)]={target:target.username,weight:1+p.keys};p.keys=0;}
 else if(action==='evict'){
 if(s.phase!=='elimination')throw Error('La expulsión no está abierta.');if(s.ballots[key(p)]!==undefined)throw Error('Ya has votado.');const target=s.nominees.find(x=>x.toLowerCase()===String(input.target).toLowerCase());if(!target||target.toLowerCase()===key(p))throw Error('Elige a otro nominado.');s.ballots[key(p)]=target;}
 else throw Error('Acción no reconocida.');
 advance(s,now);
}
export function view(s,user,now=Date.now()){const me=s.players.find(p=>key(p)===user?.username.toLowerCase());return {...s,keyDrops:undefined,challengeBag:undefined,flashAttempts:undefined,reactions:Object.entries(s.reactions).map(([name,reaction_ms])=>({username:s.players.find(p=>key(p)===name)?.username||name,reaction_ms,points:s.flashScores?.[name]?.points,verified:s.flashScores?.[name]?.verified})).sort((a,b)=>a.reaction_ms-b.reaction_ms),nominations:undefined,ballots:undefined,me:me?{...me,hasReacted:s.reactions[key(me)]!==undefined,hasAttempt:!!s.flashAttempts?.[key(me)],challengePoints:s.flashScores?.[key(me)]?.points,hasNominated:s.nominations[key(me)]!==undefined,hasVoted:s.ballots[key(me)]!==undefined}:null,user:user?{username:user.username,is_admin:user.is_admin}:null,players:s.players.map(({keys,apples,health,lastRest,...p})=>p),challenge:challengeFor(s),questions:challengeQuestions(s).map(q=>q.question),counts:{reactions:Object.keys(s.reactions).length,nominations:Object.keys(s.nominations).length,ballots:Object.keys(s.ballots).length,active:alive(s).length},now,capacity:CAPACITY};}
