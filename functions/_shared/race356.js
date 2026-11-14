// V356: Race. 12 viajeros que, al empezar, forman 6 parejas al azar. Cada uno tiene un presupuesto de viaje.
// En cada etapa eligen cómo viajar: andando (gratis) o pagando un transporte que mejora su resultado.
// Después todos juegan el minijuego de la etapa. Puntos de la pareja = suma de sus dos resultados con la mejora
// de su transporte. La pareja con menos puntos queda eliminada; cuando quedan dos, la etapa final decide quién gana.
import {armAutoStart351,autoStartDue351,fireAutoStart351,autoDeadline351} from './auto-start351.js';
import {canFillBots} from './game-bots.js';
import {CASTING_MINIGAMES} from '../../minigame-catalog.js';
import {BASE_CHALLENGE_SECONDS} from './challenge-time.js';
// V358: juego rápido. Cada etapa dura siempre 8 minutos enteros, aunque todos hayan hecho ya la prueba,
// porque el transporte se puede cambiar hasta el último segundo.
export const RACE_CAPACITY=12,RACE_START_MONEY=500,LEG_MS=8*60000;
const GRACE=120000;
// Coste en € de viaje y mejora sobre el resultado del minijuego.
export const TRANSPORTS={
 walk:{name:'Andando',cost:0,bonus:0,icon:'🚶'},
 bus:{name:'Autobús',cost:60,bonus:0.10,icon:'🚌'},
 ferry:{name:'Ferry',cost:90,bonus:0.15,icon:'⛴️'},
 train:{name:'Tren',cost:120,bonus:0.20,icon:'🚆'},
 car:{name:'Coche de alquiler',cost:180,bonus:0.30,icon:'🚗'}
};
export const ROUTE=[['Madrid','Lisboa'],['Lisboa','Sevilla'],['Sevilla','Barcelona'],['Barcelona','París'],['París','Ámsterdam'],['Ámsterdam','Berlín'],['Berlín','Praga']];
export const raceAlive=s=>s.players.filter(p=>p.status==='active');
export const pairsAlive=s=>(s.pairs||[]).filter(p=>p.status==='active');
export function freshRace(id,now=Date.now()){return {id,version:356,phase:'waiting',leg:0,stage:0,createdAt:now,startedAt:null,finishedAt:null,deadline:null,players:[],pairs:[],runs:{},choices:{},events:[],history:[],whispers:[],welcomes:[],fee:0};}
function log(s,text,now,kind){s.events.push({id:s.events.length+1,text,at:now,...(kind?{kind}:{})});}
export const raceChallenge=(id,stage)=>{const keys=Object.keys(CASTING_MINIGAMES);return keys[(id*3+stage-1)%keys.length];};
const rand=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
export const legRoute=leg=>ROUTE[(leg-1)%ROUTE.length];
function botPlayer(s,i,now){return {id:-(s.id*100+i),username:'Bot · R'+s.id+' · '+i,bot:true,status:'active',placement:null,joinedAt:now,money:RACE_START_MONEY};}
function fillBots(s,now){let i=1;while(s.players.length<RACE_CAPACITY){if(!s.players.some(p=>p.id===-(s.id*100+i)))s.players.push(botPlayer(s,i,now));i++;}}
// V366: a petición expresa de administración, RelsB y Cristi van siempre en la misma pareja cuando coinciden en una Race.
const FORCED_TEAMMATES=['RelsB','Cristi'];
function makePairs(s){
 const order=[...s.players];for(let i=order.length-1;i>0;i--){const j=rand(i+1);[order[i],order[j]]=[order[j],order[i]];}
 const ia=order.findIndex(p=>p.username===FORCED_TEAMMATES[0]),ib=order.findIndex(p=>p.username===FORCED_TEAMMATES[1]);
 if(ia!==-1&&ib!==-1){const slot=ia%2===0?ia+1:ia-1;if(slot!==ib)[order[slot],order[ib]]=[order[ib],order[slot]];}
 s.pairs=[];for(let i=0;i<order.length;i+=2){const n=s.pairs.length+1;s.pairs.push({id:n,members:[order[i].id,order[i+1].id],status:'active',placement:null});order[i].pair=n;order[i+1].pair=n;}
}
function begin(s,now){
 for(const p of s.players){p.money=RACE_START_MONEY;p.spent=0;}
 makePairs(s);s.startedAt=now;s.leg=1;
 log(s,'¡Empieza Race #'+s.id+'! Parejas: '+s.pairs.map(pr=>pr.members.map(id=>name(s,id)).join(' y ')).join(' · ')+'.',now,'race-pairs');
 stage(s,now);
}
export function name(s,id){return s.players.find(p=>p.id===id)?.username||'—';}
function stage(s,now){
 s.phase=pairsAlive(s).length<=2?'final':'leg';s.stage++;s.runs={};s.choices={};s.flashData=null;s.deadline=now+LEG_MS;s.challenge=raceChallenge(s.id,s.stage);
 for(const p of raceAlive(s).filter(p=>p.bot)){
  const options=Object.entries(TRANSPORTS).filter(([,t])=>t.cost<=p.money);const [kind]=options[rand(options.length)];chooseTransport(s,p,kind);
  s.runs[p.id]={saved:true,score:0,startedAt:now,savedAt:now,duration:BASE_CHALLENGE_SECONDS};
 }
 const [from,to]=legRoute(s.leg);
 log(s,(s.phase==='final'?'Etapa final':'Etapa '+s.leg)+': de '+from+' a '+to+'. Elige cómo viajar y juega la prueba.',now);
}
function chooseTransport(s,p,kind){
 const t=TRANSPORTS[kind];if(!t)throw Error('Transporte no válido.');
 const previous=s.choices[p.id];if(previous===kind)return;
 const refund=previous?TRANSPORTS[previous].cost:0;
 if(p.money+refund<t.cost)throw Error('No te queda dinero suficiente para '+t.name.toLowerCase()+'.');
 p.money=p.money+refund-t.cost;p.spent=(p.spent||0)-refund+t.cost;s.choices[p.id]=kind;
}
const transportOf=(s,p)=>s.choices[p.id]||'walk';
// Resultado de un viajero en la etapa: su puntuación con la mejora de su transporte.
export function travellerPoints(s,p){const run=s.runs[p.id];if(!run?.saved)return 0;return Math.round(run.score*(1+TRANSPORTS[transportOf(s,p)].bonus));}
function pairStanding(s,pr){
 const members=pr.members.map(id=>s.players.find(p=>p.id===id)).filter(p=>p&&p.status==='active');
 const humans=members.filter(p=>!p.bot).length;
 return {pair:pr,points:members.reduce((a,p)=>a+travellerPoints(s,p),0),money:members.reduce((a,p)=>a+(p.money||0),0),humans,savedAt:Math.min(...members.map(p=>s.runs[p.id]?.savedAt??Infinity))};
}
// Más puntos primero; empate: más dinero sin gastar; después la pareja con más usuarios reales; después quien guardó antes.
function rankPairs(s){return pairsAlive(s).map(pr=>pairStanding(s,pr)).sort((a,b)=>b.points-a.points||b.money-a.money||b.humans-a.humans||a.savedAt-b.savedAt||a.pair.id-b.pair.id);}
function eliminatePair(s,pr,placement,now,finished=false){
 pr.status=finished?'finished':'eliminated';pr.placement=placement;
 for(const id of pr.members){const p=s.players.find(q=>q.id===id);if(!p||p.status!=='active')continue;p.status=finished?'finished':'eliminated';p.placement=placement;p.eliminatedAt=now;}
}
export function advanceRace(s,now=Date.now()){
 if(s.phase==='waiting')armAutoStart351(s,now);
 if(s.phase==='waiting'&&autoStartDue351(s,now)){fireAutoStart351(s,now);fillBots(s,now);s.manualStart356={by:0,username:'sistema',at:now};s.autoStarted351=now;begin(s,now);return true;}
 if(['waiting','finished'].includes(s.phase))return false;
 // V358: la etapa siempre dura los 8 minutos enteros, aunque todos hayan jugado ya: el transporte se puede
 // cambiar hasta el último segundo y hay que dejar tiempo para eso.
 if(now<s.deadline)return false;
 const ranking=rankPairs(s),[from,to]=legRoute(s.leg);
 const results=ranking.map(r=>({pair:r.pair.id,members:r.pair.members.map(id=>{const p=s.players.find(q=>q.id===id);return {id,username:p?.username||'—',transport:transportOf(s,p||{id}),score:s.runs[id]?.saved?s.runs[id].score:0,points:p?travellerPoints(s,p):0};}),points:r.points,money:r.money}));
 s.history.push({leg:s.leg,stage:s.stage,from,to,challenge:s.challenge,results});
 s.events.push({id:s.events.length+1,kind:'race-results',text:'Llegada a '+to+' · Etapa '+s.leg,at:now,results});
 if(s.phase==='final'||ranking.length<=2){
  ranking.forEach((r,i)=>eliminatePair(s,r.pair,i+1,now,true));
  s.phase='finished';s.finishedAt=now;s.deadline=null;const winners=ranking[0].pair.members.map(id=>name(s,id));s.winner=winners.join(' y ');
  log(s,s.winner+' ganan Race #'+s.id+' al llegar los primeros a '+to+'.',now,'race-winner');
  return true;
 }
 const last=ranking.at(-1);eliminatePair(s,last.pair,ranking.length,now);
 log(s,last.pair.members.map(id=>name(s,id)).join(' y ')+' llegan los últimos a '+to+' y quedan eliminados en el puesto '+ranking.length+'.',now);
 s.leg++;stage(s,now);return true;
}
export function actRace(s,user,input,now=Date.now(),bridge=false){
 advanceRace(s,now);const p=s.players.find(q=>q.id===user.id);
 if(['start','fill_bots'].includes(input.action)){
  if(!canFillBots(user))throw Error('Solo admin1 puede iniciar o completar con bots.');
  if(s.phase!=='waiting')throw Error('La partida ya ha empezado.');
  if(input.action==='fill_bots'){fillBots(s,now);return;}
  if(s.players.length!==RACE_CAPACITY)throw Error('Completa las 12 plazas antes de iniciar.');
  s.manualStart356={by:user.id,username:user.username,at:now};begin(s,now);return;
 }
 if(input.action==='admin_kick'){
  if(!canFillBots(user))throw Error('Solo admin1 puede expulsar de la partida.');if(['waiting','finished'].includes(s.phase))throw Error('La partida no está en juego.');
  const t=s.players.find(q=>String(q.username).toLowerCase()===String(input.target||'').toLowerCase());if(!t||t.status!=='active')throw Error('Ese jugador no sigue en la partida.');
  t.status='eliminated';t.placement=pairsAlive(s).length;t.eliminatedAt=now;t.kicked336=true;delete s.runs[t.id];
  log(s,t.username+' queda expulsado de la partida por admin1.',now);
  const pr=s.pairs.find(x=>x.id===t.pair);if(pr&&!pr.members.some(id=>s.players.find(q=>q.id===id)?.status==='active')){pr.status='eliminated';pr.placement=pairsAlive(s).length+1;}
  const left=pairsAlive(s);if(left.length===1){eliminatePair(s,left[0],1,now,true);s.phase='finished';s.finishedAt=now;s.deadline=null;s.winner=left[0].members.filter(id=>s.players.find(q=>q.id===id)?.status==='finished').map(id=>name(s,id)).join(' y ');log(s,s.winner+' ganan Race #'+s.id+'.',now,'race-winner');}
  return;
 }
 if(input.action==='join'){
  if(p)return;if(s.phase!=='waiting'||s.players.length>=RACE_CAPACITY)throw Error('Las inscripciones están cerradas.');
  if(user.is_banned||user.is_system||user.is_test_bot)throw Error('Esta partida se reserva a usuarios reales.');
  s.players.push({id:user.id,username:user.username,status:'active',placement:null,joinedAt:now,money:RACE_START_MONEY,notifyOnStart:input.notifyOnStart===true});armAutoStart351(s,now);
  const welcome=String(input.welcome||'').trim();if(welcome.length>500)throw Error('Presentación demasiado larga.');if(welcome)s.welcomes.push({username:user.username,body:welcome,at:now});
  return;
 }
 if(!p||p.status!=='active'||['waiting','finished'].includes(s.phase))throw Error('No puedes actuar en esta partida.');
 if(input.action==='transport'){
  // V361: el transporte se puede decidir y cambiar en cualquier momento de la etapa, hayas hecho ya la
  // prueba o no; la mejora se aplica con el transporte que tengas elegido cuando se cierre la etapa.
  if(input.stage!==undefined&&input.stage!==s.stage)throw Error('La etapa ha cambiado. Actualiza la página.');
  chooseTransport(s,p,String(input.kind||''));return;
 }
 if(input.action==='whisper'){
  const to=s.players.find(q=>q.id===Number(input.to)),body=String(input.body||'').trim();if(!to||to.bot||to.id===p.id||to.status!=='active'||!body||body.length>500)throw Error('Mensaje privado no válido.');
  if(s.whispers.some(w=>w.from===p.id&&now-w.at<3000))throw Error('Espera tres segundos.');s.whispers.push({id:crypto.randomUUID(),from:p.id,to:to.id,body,at:now});s.whispers=s.whispers.slice(-500);return;
 }
 if(!bridge||!['flash_start','flash_finish'].includes(input.action))throw Error('Acción no permitida.');
 if(input.stage!==s.stage||input.kind!==s.challenge)throw Error('No te corresponde esta prueba.');
 let run=s.runs[p.id];
 if(input.action==='flash_start'){
  if(!run)run=s.runs[p.id]={token:crypto.randomUUID(),startedAt:now,duration:BASE_CHALLENGE_SECONDS,saved:false,score:0};
 }else{
  if(!run||input.token!==run.token)throw Error('Intento no válido.');if(run.saved)return;
  if(now>run.startedAt+Math.max(run.duration*1000+120000,GRACE)||now<run.startedAt+1000)throw Error('Intento vencido o inválido.');
  if(!Number.isSafeInteger(input.points)||input.points<0||input.points>1000000)throw Error('Puntuación no válida.');run.score=input.points;run.saved=true;run.savedAt=now;
 }
}
export function raceView(s,user,now=Date.now()){
 const me=user&&s.players.find(p=>p.id===user.id),run=me&&s.runs[me.id],playing=!['waiting','finished'].includes(s.phase);
 const partner=me&&me.pair?s.pairs.find(pr=>pr.id===me.pair)?.members.find(id=>id!==me.id):null;
 return {canStart:canFillBots(user)&&s.phase==='waiting'&&s.players.length===RACE_CAPACITY,canFillBots:canFillBots(user)&&s.phase==='waiting'&&s.players.length<RACE_CAPACITY,manualStartRequired:true,
  id:s.id,phase:s.phase,leg:s.leg,stage:s.stage,route:s.leg?legRoute(s.leg):null,createdAt:s.createdAt,startedAt:s.startedAt,finishedAt:s.finishedAt,deadline:s.deadline??autoDeadline351(s),autoStartAt:autoDeadline351(s),now,capacity:RACE_CAPACITY,fee:0,startMoney:RACE_START_MONEY,challenge:s.challenge,winner:s.winner||null,transports:TRANSPORTS,
  pairs:(s.pairs||[]).map(pr=>({id:pr.id,members:pr.members,status:pr.status,placement:pr.placement})),
  // V357: el dinero y el transporte son privados de cada pareja: solo se ven los tuyos y los de tu pareja.
  players:s.players.map(p=>{const own=!!me&&(p.id===me.id||p.id===partner);return {id:p.id,username:p.username,status:p.status,placement:p.placement,bot:!!p.bot,pair:p.pair||null,money:own?p.money:null,transport:own&&playing&&p.status==='active'?(s.choices[p.id]||null):null,challengePending:playing&&p.status==='active'&&!s.runs[p.id]?.saved};}),
  events:s.events.slice(-30),history:(s.history||[]).map(h=>({...h,results:h.results.map(r=>{const mine=!!me&&r.members.some(m=>m.id===me.id);return {pair:r.pair,points:r.points,members:r.members.map(m=>({id:m.id,username:m.username,score:m.score,points:m.points,transport:mine?m.transport:null}))};})})),
  me:me?{id:me.id,username:me.username,status:me.status,placement:me.placement,pair:me.pair||null,partner,money:me.money,canPlay:playing&&me.status==='active',hasAttempt:!!run,saved:!!run?.saved,score:run?.saved?run.score:null,points:run?.saved?travellerPoints(s,me):null,transport:s.choices[me.id]||null}:null,
  whispers:me?s.whispers.filter(w=>w.from===me.id||w.to===me.id):[]};
}
