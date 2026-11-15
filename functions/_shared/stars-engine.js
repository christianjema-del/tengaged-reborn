// V373: Stars. 16 concursantes en una casa. Cada ronda, todos nominan a dos compañeros; los dos más
// nominados forman la pareja de nominados. El resto vota a quién de los dos expulsar. Se repite hasta
// que quedan tres: una ronda final decide el tercer puesto, y entre los dos últimos gana quien haya
// recibido menos nominaciones en toda la partida (empate: al azar).
import {armAutoStart351,autoStartDue351,fireAutoStart351,autoDeadline351} from './auto-start351.js';
import {canFillBots} from './game-bots.js';
export const STARS_CAPACITY=16;
const NOMINATE_MS=10*60000,VOTE_MS=10*60000;
const rand=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
export const starsAlive=s=>s.players.filter(p=>p.status==='active');
export function freshStars(id,now=Date.now()){return {id,version:373,phase:'waiting',round:0,createdAt:now,startedAt:null,finishedAt:null,deadline:null,players:[],nominations:{},votes:{},nominees:[],events:[],history:[],whispers:[],welcomes:[],fee:0};}
function log(s,text,now,kind){s.events.push({id:s.events.length+1,text,at:now,...(kind?{kind}:{})});}
export function name(s,id){return s.players.find(p=>p.id===id)?.username||'—';}
function botPlayer(s,i,now){return {id:-(s.id*100+i),username:'Prueba'+String(i).padStart(2,'0'),bot:true,status:'active',placement:null,nominatedCount:0,joinedAt:now};}
function fillBots(s,now){let i=1;while(s.players.length<STARS_CAPACITY){if(!s.players.some(p=>p.id===-(s.id*100+i)))s.players.push(botPlayer(s,i,now));i++;}}
function botNominate(s,p){
 const others=starsAlive(s).filter(q=>q.id!==p.id).map(q=>q.id);const picks=[];
 while(picks.length<2&&picks.length<others.length){const c=others[rand(others.length)];if(!picks.includes(c))picks.push(c);}
 return picks;
}
function botVote(s,p){const options=s.nominees.filter(id=>id!==p.id);return options.length?options[rand(options.length)]:s.nominees[0];}
function tallyNominations(s){
 const live=starsAlive(s),tally=new Map(live.map(p=>[p.id,0]));
 for(const picks of Object.values(s.nominations))for(const id of picks)if(tally.has(id))tally.set(id,tally.get(id)+1);
 for(const [id,n] of tally)s.players.find(p=>p.id===id).nominatedCount=(s.players.find(p=>p.id===id).nominatedCount||0)+n;
 return [...tally.entries()].sort((a,b)=>b[1]-a[1]||rand(2)-0.5);
}
function startNominations(s,now){
 s.phase='nominate';s.round++;s.nominations={};s.votes={};s.nominees=[];s.deadline=now+NOMINATE_MS;
 for(const p of starsAlive(s).filter(p=>p.bot))s.nominations[p.id]=botNominate(s,p);
 log(s,'Día '+s.round+': todos nominan a dos compañeros.',now);
}
function startVote(s,now){
 const ranking=tallyNominations(s);s.nominees=ranking.slice(0,2).map(([id])=>id);
 s.phase='vote';s.votes={};s.deadline=now+VOTE_MS;
 for(const p of starsAlive(s).filter(p=>p.bot&&!s.nominees.includes(p.id)))s.votes[p.id]=botVote(s,p);
 log(s,'Pareja de nominados: '+s.nominees.map(id=>name(s,id)).join(' y ')+'. El resto vota a quién expulsar.',now,'stars-nominees');
}
function evict(s,now){
 const counts=new Map(s.nominees.map(id=>[id,0]));for(const v of Object.values(s.votes))if(counts.has(v))counts.set(v,counts.get(v)+1);
 const ranking=[...counts.entries()].sort((a,b)=>b[1]-a[1]||rand(2)-0.5),out=s.players.find(p=>p.id===ranking[0][0]);
 out.status='eliminated';out.placement=starsAlive(s).length+1;out.eliminatedAt=now;
 s.history.push({round:s.round,phase:'vote',nominees:[...s.nominees],votes:{...s.votes},evicted:out.id});
 log(s,out.username+' queda expulsado en el puesto '+out.placement+'.',now,'stars-evict');
}
function startFinalThree(s,now){
 s.phase='final3';s.nominations={};s.deadline=now+NOMINATE_MS;
 for(const p of starsAlive(s).filter(p=>p.bot))s.nominations[p.id]=[botVote(s,{id:p.id})];
 log(s,'Última prueba: cada finalista nomina a quien crea que debe quedar tercero.',now);
}
function resolveFinalThree(s,now){
 const live=starsAlive(s),tally=new Map(live.map(p=>[p.id,0]));
 for(const picks of Object.values(s.nominations))for(const id of picks)if(tally.has(id))tally.set(id,tally.get(id)+1);
 const ranking=[...tally.entries()].sort((a,b)=>b[1]-a[1]||rand(2)-0.5),third=s.players.find(p=>p.id===ranking[0][0]);
 third.status='finished';third.placement=3;
 s.history.push({round:s.round,phase:'final3',nominations:{...s.nominations},third:third.id});
 log(s,third.username+' queda en el tercer puesto.',now,'stars-evict');
 const [a,b]=starsAlive(s);
 const winner=(a.nominatedCount||0)<=(b.nominatedCount||0)?a:b,runnerUp=winner===a?b:a;
 winner.status='finished';winner.placement=1;runnerUp.status='finished';runnerUp.placement=2;
 s.phase='finished';s.finishedAt=now;s.winner=winner.username;s.deadline=null;
 log(s,winner.username+' gana Stars #'+s.id+'. '+runnerUp.username+' queda segundo.',now,'stars-winner');
}
export function advanceStars(s,now=Date.now()){
 if(s.pause180)return false;
 if(s.phase==='waiting')armAutoStart351(s,now);
 if(s.phase==='waiting'&&autoStartDue351(s,now)){fireAutoStart351(s,now);fillBots(s,now);s.manualStart356={by:0,username:'sistema',at:now};s.autoStarted351=now;s.startedAt=now;startNominations(s,now);return true;}
 if(['waiting','finished'].includes(s.phase))return false;
 if(s.phase==='nominate'){
  const live=starsAlive(s),done=live.every(p=>s.nominations[p.id]?.length===2);
  if(!done&&now<s.deadline)return false;
  for(const p of live)if(!s.nominations[p.id])s.nominations[p.id]=botNominate(s,p);
  startVote(s,now);return true;
 }
 if(s.phase==='vote'){
  const voters=starsAlive(s).filter(p=>!s.nominees.includes(p.id)),done=voters.every(p=>s.votes[p.id]!==undefined);
  if(!done&&now<s.deadline)return false;
  for(const p of voters)if(s.votes[p.id]===undefined)s.votes[p.id]=botVote(s,p);
  evict(s,now);
  if(starsAlive(s).length<=3)startFinalThree(s,now);else startNominations(s,now);
  return true;
 }
 if(s.phase==='final3'){
  const live=starsAlive(s),done=live.every(p=>s.nominations[p.id]?.length===1);
  if(!done&&now<s.deadline)return false;
  for(const p of live)if(!s.nominations[p.id])s.nominations[p.id]=[botVote(s,p)];
  resolveFinalThree(s,now);return true;
 }
 return false;
}
export function actStars(s,user,input,now=Date.now()){
 if(['pause','resume'].includes(input.action)){
  if(!canFillBots(user))throw Error('Solo admin1 puede pausar o reanudar la partida.');
  if(['waiting','finished'].includes(s.phase))throw Error('La partida no está en marcha.');
  if(input.action==='pause'){if(!s.pause180){s.pause180={at:now,by:user.username};log(s,'admin1 pausa Stars #'+s.id+'. Los plazos quedan detenidos.',now,'stars-pause');}return;}
  if(!s.pause180)return;
  const delta=Math.max(0,now-s.pause180.at);if(Number.isFinite(s.deadline))s.deadline+=delta;
  delete s.pause180;log(s,'admin1 reanuda Stars #'+s.id+'.',now,'stars-pause');return;
 }
 if(s.pause180)throw Error('Partida pausada por admin1. Espera a que se reanude.');
 advanceStars(s,now);const p=s.players.find(q=>q.id===user.id);
 if(['start','fill_bots'].includes(input.action)){
  if(!canFillBots(user))throw Error('Solo admin1 puede iniciar o completar con bots.');
  if(s.phase!=='waiting')throw Error('La partida ya ha empezado.');
  if(input.action==='fill_bots'){fillBots(s,now);return;}
  if(s.players.length!==STARS_CAPACITY)throw Error('Completa las 16 plazas antes de iniciar.');
  s.manualStart356={by:user.id,username:user.username,at:now};s.startedAt=now;startNominations(s,now);return;
 }
 if(input.action==='admin_kick'){
  if(!canFillBots(user))throw Error('Solo admin1 puede expulsar de la partida.');if(['waiting','finished'].includes(s.phase))throw Error('La partida no está en juego.');
  const t=s.players.find(q=>String(q.username).toLowerCase()===String(input.target||'').toLowerCase());if(!t||t.status!=='active')throw Error('Ese jugador no sigue en la partida.');
  t.status='eliminated';t.placement=starsAlive(s).length;t.eliminatedAt=now;t.kicked336=true;
  delete s.nominations[t.id];delete s.votes[t.id];s.nominees=(s.nominees||[]).filter(id=>id!==t.id);
  log(s,t.username+' queda expulsado de la partida por admin1 (puesto '+t.placement+').',now);
  if(starsAlive(s).length===1){const w=starsAlive(s)[0];w.status='finished';w.placement=1;s.phase='finished';s.finishedAt=now;s.winner=w.username;log(s,w.username+' gana Stars #'+s.id+'.',now,'stars-winner');}
  return;
 }
 if(input.action==='join'){
  if(p)return;if(s.phase!=='waiting'||s.players.length>=STARS_CAPACITY)throw Error('Las inscripciones están cerradas.');
  if(user.is_banned||user.is_system||user.is_test_bot)throw Error('Esta partida se reserva a usuarios reales.');
  if(s.testOnly373&&user.username.toLowerCase()!=='admin1')throw Error('Esta partida de pruebas es solo para admin1.');
  s.players.push({id:user.id,username:user.username,status:'active',placement:null,nominatedCount:0,joinedAt:now,notifyOnStart:input.notifyOnStart===true});armAutoStart351(s,now);
  const welcome=String(input.welcome||'').trim();if(welcome.length>500)throw Error('Presentación demasiado larga.');if(welcome)s.welcomes.push({username:user.username,body:welcome,at:now});
  return;
 }
 if(!p||p.status!=='active'||['waiting','finished'].includes(s.phase))throw Error('No puedes actuar en esta partida.');
 if(input.action==='nominate'){
  if(s.phase!=='nominate')throw Error('Las nominaciones están cerradas.');
  const picks=input.targets;const live=starsAlive(s).filter(q=>q.id!==p.id).map(q=>q.id);
  if(!Array.isArray(picks)||picks.length!==2||new Set(picks).size!==2||picks.some(id=>!live.includes(id)))throw Error('Nomina a dos compañeros distintos, sin incluirte.');
  s.nominations[p.id]=[...picks];return;
 }
 if(input.action==='vote'){
  if(s.phase!=='vote')throw Error('La votación está cerrada.');if(s.nominees.includes(p.id))throw Error('Los nominados no votan.');
  if(!s.nominees.includes(Number(input.target)))throw Error('Vota a uno de los dos nominados.');s.votes[p.id]=Number(input.target);return;
 }
 if(input.action==='final_pick'){
  if(s.phase!=='final3')throw Error('Esta votación no está abierta.');
  const live=starsAlive(s).filter(q=>q.id!==p.id).map(q=>q.id);if(!live.includes(Number(input.target)))throw Error('Elige a uno de los otros dos finalistas.');
  s.nominations[p.id]=[Number(input.target)];return;
 }
 if(input.action==='whisper'){
  const to=s.players.find(q=>q.id===Number(input.to)),body=String(input.body||'').trim();if(!to||to.bot||to.id===p.id||to.status!=='active'||!body||body.length>500)throw Error('Mensaje privado no válido.');
  if(s.whispers.some(w=>w.from===p.id&&now-w.at<3000))throw Error('Espera tres segundos.');s.whispers.push({id:crypto.randomUUID(),from:p.id,to:to.id,body,at:now});s.whispers=s.whispers.slice(-500);return;
 }
 throw Error('Acción no permitida.');
}
export function starsView(s,user,now=Date.now()){
 const me=user&&s.players.find(p=>p.id===user.id);
 return {canStart:canFillBots(user)&&s.phase==='waiting'&&s.players.length===STARS_CAPACITY,canFillBots:canFillBots(user)&&s.phase==='waiting'&&s.players.length<STARS_CAPACITY,manualStartRequired:true,
  id:s.id,phase:s.phase,round:s.round,createdAt:s.createdAt,startedAt:s.startedAt,finishedAt:s.finishedAt,deadline:s.deadline??autoDeadline351(s),autoStartAt:autoDeadline351(s),paused:!!s.pause180,pausedAt:s.pause180?.at||null,canPause:canFillBots(user)&&!['waiting','finished'].includes(s.phase)&&!s.pause180,canResume:canFillBots(user)&&!!s.pause180,
  now,capacity:STARS_CAPACITY,fee:0,winner:s.winner||null,nominees:s.nominees||[],testOnly:!!s.testOnly373,
  players:s.players.map(p=>({id:p.id,username:p.username,status:p.status,placement:p.placement,bot:!!p.bot,nominated:(s.nominees||[]).includes(p.id),hasNominated:s.phase==='nominate'?!!s.nominations[p.id]:undefined,hasVoted:s.phase==='vote'?s.votes[p.id]!==undefined:undefined})),
  events:s.events.slice(-30),history:s.history,me:me?{id:me.id,username:me.username,status:me.status,placement:me.placement,
   canNominate:s.phase==='nominate'&&me.status==='active'&&!s.nominations[me.id],myNomination:s.nominations[me.id]||null,
   canVote:s.phase==='vote'&&me.status==='active'&&!(s.nominees||[]).includes(me.id)&&s.votes[me.id]===undefined,myVote:s.votes[me.id]??null,
   canFinalPick:s.phase==='final3'&&me.status==='active'&&!s.nominations[me.id],myFinalPick:s.phase==='final3'?(s.nominations[me.id]||null):null}:null,
  whispers:me?s.whispers.filter(w=>w.from===me.id||w.to===me.id):[]};
}
