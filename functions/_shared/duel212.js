import {canFillBots} from './game-bots.js';
import {CASTING_MINIGAMES} from '../../minigame-catalog.js';
import {BASE_CHALLENGE_SECONDS} from './challenge-time.js';
export const PHASE_MS=4*3600000;
const GRACE=600000;
export const duelAlive=s=>s.players.filter(p=>p.status==='active');
export function freshDuel(id,now=Date.now()){return {id,version:219,phase:'waiting',round:0,stage:0,createdAt:now,startedAt:null,finishedAt:null,players:[],runs:{},lists:{},events:[],history:[],whispers:[],welcomes:[],fee:0};}
function log(s,text,now){s.events.push({id:s.events.length+1,text,at:now});}
export function duelEligible(s){return s.phase==='immunity'||s.phase==='final'?duelAlive(s):s.phase==='duel'?duelAlive(s).filter(p=>s.nominees.includes(p.id)):[];}
function stage(s,phase,now){s.phase=phase;if(phase!=='duel')s.nominees=[];s.stage++;s.runs={};s.flashData=null;s.deadline=now+PHASE_MS;s.challenge=Object.keys(CASTING_MINIGAMES)[(s.id+s.stage-2)%Object.keys(CASTING_MINIGAMES).length];for(const p of duelEligible(s).filter(p=>p.bot))s.runs[p.id]={saved:true,score:0,startedAt:now,savedAt:now,duration:BASE_CHALLENGE_SECONDS};log(s,phase==='final'?'Los tres finalistas compiten por la victoria.':phase==='duel'?'Comienza el duelo de eliminación.':'Día '+s.round+': prueba de clasificación y listas de preferencias.',now);}
function score(s,p){return s.runs[p.id]?.saved?s.runs[p.id].score:0;}
function ranked(s,players){return [...players].sort((a,b)=>score(s,b)-score(s,a)||Number(!!a.bot)-Number(!!b.bot)||(s.runs[a.id]?.savedAt??Infinity)-(s.runs[b.id]?.savedAt??Infinity)||a.joinedAt-b.joinedAt||s.players.indexOf(a)-s.players.indexOf(b));}
export function advanceDuel(s,now=Date.now()){
 if(['waiting','finished'].includes(s.phase))return false;
 const eligible=duelEligible(s),complete=eligible.length>0&&eligible.every(p=>s.runs[p.id]?.saved)&&(s.phase!=='immunity'||eligible.every(p=>p.bot||s.listSavedStages?.[p.id]===s.stage));
 if(!complete&&now<s.deadline)return false;
 const scores=duelEligible(s).map(p=>({id:p.id,username:p.username,score:score(s,p)}));
 s.events.push({id:s.events.length+1,kind:'duel-results',text:'Resultados del desafío · Día '+s.round,at:now,scores:[...scores].sort((a,b)=>b.score-a.score)});
 if(s.phase==='immunity'){
  const live=duelAlive(s),immune=ranked(s,live)[0];s.immune=null;s.chainLeader=immune.id;s.rulesVersion=219;
  const selected=[immune.id],route=[];let current=immune.id;
  while(selected.length<live.length-1){const preference=s.lists[current]||live.filter(p=>p.id!==current).map(p=>p.id);const next=preference.find(id=>live.some(p=>p.id===id)&&!selected.includes(id));const chosen=next??live.find(p=>!selected.includes(p.id)).id;route.push({from:current,to:chosen});selected.push(chosen);current=chosen;}
  const first=live.find(p=>!selected.includes(p.id));const preference=s.lists[first.id]||live.filter(p=>p.id!==first.id).map(p=>p.id);
  const other=[...preference].reverse().find(id=>id!==first.id&&live.some(p=>p.id===id))??live.find(p=>p.id!==first.id).id;
  s.nominees=[first.id,other];s.history.push({round:s.round,stage:s.stage,phase:s.phase,immune:null,chainLeader:s.chainLeader,nominees:[...s.nominees],route,scores});
  log(s,immune.username+' inicia la cadena de salvación. Nominados: '+first.username+' y '+live.find(p=>p.id===other).username+'.',now);s.round++;stage(s,'duel',now);
 }else if(s.phase==='duel'){
  const participants=ranked(s,duelEligible(s)),loser=participants[1];loser.status='eliminated';loser.placement=duelAlive(s).length+1;loser.eliminatedAt=now;
  s.history.push({round:s.round,stage:s.stage,phase:s.phase,scores,eliminated:loser.id});log(s,loser.username+' queda eliminado en el puesto '+loser.placement+'.',now);
  s.round++;stage(s,duelAlive(s).length===3?'final':'immunity',now);
 }else if(s.phase==='final'){
  ranked(s,duelAlive(s)).forEach((p,i)=>{p.placement=i+1;p.status='finished';});s.history.push({round:s.round,stage:s.stage,phase:s.phase,scores});s.phase='finished';s.finishedAt=now;s.winner=s.players.find(p=>p.placement===1).username;log(s,s.winner+' gana El Duelo #'+s.id+'.',now);
 }return true;
}
export function actDuel(s,user,input,now=Date.now(),bridge=false){
 advanceDuel(s,now);const p=s.players.find(p=>p.id===user.id);
 if(['start','fill_bots'].includes(input.action)){
  if(!canFillBots(user))throw Error('Solo admin1 puede iniciar o completar con bots.');
  if(s.phase!=='waiting')throw Error('La partida ya ha empezado.');
  if(input.action==='fill_bots'){while(s.players.length<12){const index=s.players.length+1;s.players.push({id:-(s.id*100+index),username:'Bot · D'+s.id+' · '+index,bot:true,status:'active',placement:null,joinedAt:now});}return;}
  if(s.players.length!==12)throw Error('Completa las 12 plazas antes de iniciar.');
  s.startedAt=now;s.manualStart213={by:user.id,username:user.username,at:now};s.round=1;stage(s,'immunity',now);return;
 }
 if(input.action==='join'){
  if(p)return;if(s.phase!=='waiting'||s.players.length>=12)throw Error('Las inscripciones están cerradas.');
  if(user.is_banned||user.is_system||user.is_test_bot)throw Error('Esta partida se reserva a usuarios reales.');
  s.players.push({id:user.id,username:user.username,status:'active',placement:null,joinedAt:now,notifyOnStart:input.notifyOnStart===true});
  const welcome=String(input.welcome||'').trim();if(welcome.length>500)throw Error('Presentación demasiado larga.');if(welcome)s.welcomes.push({username:user.username,body:welcome,at:now});
  return;
 }
 if(!p||p.status!=='active'||s.phase==='finished')throw Error('No puedes actuar en esta partida.');
 if(input.action==='list'){
  if(s.listSavedStages?.[p.id]===s.stage)throw Error('Ya has guardado tu lista. No se puede modificar en este día.');
  if(s.phase!=='immunity')throw Error('Las listas están cerradas.');const list=input.order;
  const expected=duelAlive(s).filter(q=>q.id!==p.id).map(q=>q.id);
  if(!Array.isArray(list)||list.length!==expected.length||new Set(list).size!==expected.length||list.some(id=>!expected.includes(id)))throw Error('Ordena una vez a cada participante, sin incluirte.');s.lists[p.id]=[...list];s.listSavedStages??={};s.listSavedStages[p.id]=s.stage;return;
 }
 if(input.action==='whisper'){
  const to=s.players.find(q=>q.id===Number(input.to)),body=String(input.body||'').trim();if(!to||to.bot||to.id===p.id||to.status!=='active'||!body||body.length>500)throw Error('Mensaje privado no válido.');
  if(s.whispers.some(w=>w.from===p.id&&now-w.at<3000))throw Error('Espera tres segundos.');s.whispers.push({id:crypto.randomUUID(),from:p.id,to:to.id,body,at:now});s.whispers=s.whispers.slice(-500);return;
 }
 if(!bridge||!['flash_start','flash_finish'].includes(input.action))throw Error('Acción no permitida.');
 if(input.stage!==s.stage||input.kind!==s.challenge||!duelEligible(s).some(q=>q.id===p.id))throw Error('No te corresponde esta prueba.');
 let run=s.runs[p.id];
 if(input.action==='flash_start'){
  if(!run){run=s.runs[p.id]={token:crypto.randomUUID(),startedAt:now,duration:BASE_CHALLENGE_SECONDS,saved:false,score:0};if(duelEligible(s).every(q=>s.runs[q.id]))s.deadline=Math.min(s.deadline,now+GRACE);}
 }else{
  if(!run||input.token!==run.token)throw Error('Intento no válido.');if(run.saved)return;
  if(now>run.startedAt+Math.max(run.duration*1000+120000,GRACE)||now<run.startedAt+1000)throw Error('Intento vencido o inválido.');
  if(!Number.isSafeInteger(input.points)||input.points<0||input.points>1000000)throw Error('Puntuación no válida.');run.score=input.points;run.saved=true;run.savedAt=now;
 }
}
export function duelView(s,user,now=Date.now()){
 const me=user&&s.players.find(p=>p.id===user.id),eligible=me&&duelEligible(s).some(p=>p.id===me.id),run=me&&s.runs[me.id];
 return {canStart:canFillBots(user)&&s.phase==='waiting'&&s.players.length===12,canFillBots:canFillBots(user)&&s.phase==='waiting'&&s.players.length<12,manualStartRequired:true,id:s.id,phase:s.phase,round:s.round,stage:s.stage,createdAt:s.createdAt,startedAt:s.startedAt,finishedAt:s.finishedAt,deadline:s.deadline,now,capacity:12,fee:0,challenge:s.challenge,immune:null,chainLeader:s.chainLeader||null,nominees:s.nominees||[],winner:s.winner||null,players:s.players.map(({id,username,status,placement,bot})=>({id,username,status,placement,bot:!!bot,listSaved:s.listSavedStages?.[id]===s.stage,challengePending:status==='active'&&duelEligible(s).some(p=>p.id===id)&&!s.runs[id]?.saved,doingChallenge:status==='active'&&(['immunity','final'].includes(s.phase)||(s.phase==='duel'&&!(s.nominees||[]).includes(id))),nominated:s.phase==='duel'&&(s.nominees||[]).includes(id)})),events:s.events.slice(-30),history:s.history,me:me?{id:me.id,username:me.username,status:me.status,placement:me.placement,canPlay:!!eligible,hasAttempt:!!run,saved:!!run?.saved,listSaved:s.listSavedStages?.[me.id]===s.stage,score:run?.saved?run.score:null,list:[...new Set([...(s.lists[me.id]||[]),...duelAlive(s).map(p=>p.id)])].filter(id=>id!==me.id&&duelAlive(s).some(p=>p.id===id))}:null,whispers:me?s.whispers.filter(w=>w.from===me.id||w.to===me.id):[]};
}
