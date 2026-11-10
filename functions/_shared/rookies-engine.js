// Classic Rookies: días de 24 horas. Independiente de Frookies.
import {startAdmin172,authorizeStart172,validStart172} from './manual-start172.js';
import {canFillBots} from './game-bots.js';
import {enrollmentOptions} from './enrollment.js';
import {commentPosis,validComments} from './chat-posis.js';
export const CAPACITY=13,DAY_MS=86400000,FINALE_MS=4*3600000;
export const BET_MULTIPLIERS=Object.freeze([2,1.75,1.5,1.25,1]);
const random=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
export const alive=s=>s.players.filter(p=>p.status==='active');
const byId=(s,id)=>s.players.find(p=>p.id===Number(id));
const log=(s,text,at,kind='notice',extra={})=>{s.events.push({id:s.events.length+1,text,at,kind,...extra});};
const chatTime=value=>Date.parse(String(value).replace(' ','T').replace(/Z?$/,'Z'));
const dayStart=(s,day)=>s.startedAt+(day-1)*DAY_MS;
// Comentarios válidos (sin spam) y tics recibidos por una persona entre dos momentos.
function activityOf(s,p,from,to){
 const rows=(s.chatLog||[]).filter(row=>row.user_id===p.id&&row.at>=from&&row.at<to);
 return {comments:rows.length,tics:rows.reduce((n,row)=>n+row.posis,0)};
}
const byActivity=(a,b)=>b.comments-a.comments||b.tics-a.tics;
// Gana quien más comenta; si empatan, quien tiene más tics. Después, los usuarios antes que los bots.
function mostActive(s,list,day){
 const from=dayStart(s,day),scores=new Map(list.map(p=>[p.id,activityOf(s,p,from,from+DAY_MS)]));
 return list.slice().sort((a,b)=>byActivity(scores.get(a.id),scores.get(b.id))||Number(!!a.bot)-Number(!!b.bot)||a.tie-b.tie);
}
export function freshRookies(id=0,now=Date.now()){return {id,version:1,phase:'waiting',day:0,createdAt:now,startedAt:null,finishedAt:null,deadline:null,players:[],hoh:null,previousHoh:null,pov:null,nominees:[],hohPicks:[],ballots:{},saved:null,events:[],history:[],welcomes:[],whispers:[],fee:0};}
// Registro temporal del chat: advanceRookies lo borra para no guardarlo en la partida.
export function setActivity(s,rows){s.chatLog=validComments(rows).map(row=>({user_id:row.user_id,at:chatTime(row.created_at),posis:commentPosis(Number(row.score)||0)}));}
function chooseHoh(s,at,finale=false){
 const blocked=new Set([s.hoh,...(finale?[]:s.hohPicks)].filter(Boolean)),pool=alive(s).filter(p=>!blocked.has(p.id)),hoh=mostActive(s,pool.length?pool:alive(s),s.day-1)[0];
 s.previousHoh=s.hoh;s.hoh=hoh.id;log(s,(finale?'Último HoH: ':'HoH del día '+s.day+': ')+hoh.username+'.',at,'hoh',{hoh:hoh.username,day:s.day});
}
// Con 5 vivos hay 3 nominados y sale 1; con 6, 4 nominados y salen 2: en ambos casos quedan 4.
export function lastVoteDay329(alive){const wanted=alive===5?3:4,out=wanted===4?2:1;return alive>4&&alive-out<=4;}
function startDay(s,at){
 const nominated=s.hohPicks.filter(id=>byId(s,id)?.status==='active'),players=alive(s);
 s.day++;s.ballots={};s.saved=null;s.pov=null;
 if(players.length<=4){s.nominees=[];s.hohPicks=[];chooseHoh(s,at,true);s.phase='finale';s.deadline=at+FINALE_MS;log(s,'Final de cuatro: los resultados llegarán en cuatro horas.',at,'finale');return;}
 s.phase='day';s.deadline=at+DAY_MS;
 // V329: el día cuyas expulsiones dejan a cuatro (el anterior a la final) no tiene HoH:
 // sus nominaciones serían para la final, que ya no tiene nominaciones.
 if(lastVoteDay329(players.length)){s.previousHoh=s.hoh;s.hoh=null;log(s,'Día '+s.day+': último día. No hay HoH: al terminar el día se reparten todos los puestos y acaba la partida.',at,'hoh',{hoh:null,day:s.day});}else chooseHoh(s,at);
 s.hohPicks=[];
 if(s.day===1){s.nominees=[];return;}
 const wanted=players.length===5?3:4,chosen=nominated.filter(id=>id!==s.hoh).slice(0,2),others=mostActive(s,players.filter(p=>p.id!==s.hoh&&!chosen.includes(p.id)),s.day-1).reverse();
 while(chosen.length<wanted&&others.length)chosen.push(others.shift().id);s.nominees=chosen;
 const pov=mostActive(s,players.filter(p=>p.id!==s.hoh),s.day-1)[0];s.pov=pov?.id??null;
 log(s,'Nominados del día '+s.day+': '+chosen.map(id=>byId(s,id).username).join(', ')+'.',at,'nominations',{nominees:chosen.map(id=>byId(s,id).username),day:s.day});
}
export function votersOf(s){return alive(s).filter(p=>!s.nominees.includes(p.id));}
function botBallots(s){const values=s.nominees.map((_,i)=>i);for(const p of votersOf(s).filter(p=>p.bot&&!s.ballots[p.id])){const left=values.slice(),ballot={};for(const id of s.nominees)ballot[id]=left.splice(random(left.length),1)[0];s.ballots[p.id]=ballot;}}
function closeDay(s,at){
 if(!s.nominees.length){if(s.hohPicks.length<2)autoPicks(s);return startDay(s,at);}
 botBallots(s);
 const total=Object.fromEntries(s.nominees.map(id=>[id,0]));// Los votos antiguos iban de 1 a 4: se pasan a la escala actual, que empieza en 0.
 for(const ballot of Object.values(s.ballots)){const low=Math.min(...Object.values(ballot));for(const [id,points] of Object.entries(ballot))if(id in total)total[id]+=points-low;}
 const saved=s.saved,calm=mostActive(s,s.nominees.map(id=>byId(s,id)),s.day).reverse(),ranked=s.nominees.filter(id=>id!==saved).map(id=>byId(s,id)).sort((a,b)=>total[b.id]-total[a.id]||calm.indexOf(a)-calm.indexOf(b)),out=ranked.slice(0,s.nominees.length===4?2:1);
 // V330: el último día de votación termina la partida. Los nominados no salvados ocupan los
 // últimos puestos según los votos (más votos, peor puesto); el resto, incluido el salvado por el
 // PoV, se ordena por actividad de toda la partida y gana el más activo.
 if(lastVoteDay329(alive(s).length))return finalDay330(s,at,ranked,total,saved);
 let place=alive(s).length;for(const p of out){p.status='eliminated';p.placement=place--;p.eliminatedAt=at;}
 const rows=s.nominees.map(id=>({username:byId(s,id).username,points:total[id],out:out.some(p=>p.id===id)})).sort((a,b)=>b.points-a.points);
 s.history.push({day:s.day,hoh:s.hoh,pov:s.pov,saved,rows});log(s,'Resultados del día '+s.day,at,'rookies-results',{rows,day:s.day});
 if(s.hohPicks.length<2)autoPicks(s);startDay(s,at);
}
function finalDay330(s,at,ranked,total,saved){
 let place=alive(s).length;for(const p of ranked){p.status='finished';p.placement=place--;}
 const rows=s.nominees.map(id=>({username:byId(s,id).username,points:total[id],out:ranked.some(p=>p.id===id),placement:byId(s,id).placement||null})).sort((a,b)=>b.points-a.points);
 s.history.push({day:s.day,hoh:s.hoh,pov:s.pov,saved,rows,final:true});log(s,'Resultados del día '+s.day,at,'rookies-results',{rows,day:s.day});
 s.nominees=[];s.hohPicks=[];finish(s,at);
}
function autoPicks(s){const pool=alive(s).filter(p=>p.id!==s.hoh&&!s.hohPicks.includes(p.id)),least=mostActive(s,pool,s.day).reverse();while(s.hohPicks.length<2&&least.length)s.hohPicks.push(least.shift().id);}
function finish(s,at){
 const scores=new Map(alive(s).map(p=>[p.id,activityOf(s,p,s.startedAt,at)])),order=alive(s).sort((a,b)=>byActivity(scores.get(a.id),scores.get(b.id))||(b.id===s.hoh)-(a.id===s.hoh)||a.tie-b.tie);
 order.forEach((p,i)=>{p.placement=i+1;p.status='finished';});s.phase='finished';s.finishedAt=at;s.deadline=null;s.winner=order[0]?.username||null;log(s,s.winner+' gana Rookies #'+s.id+'.',at,'winner');
}
export function advanceRookies(s,now=Date.now()){
 if(s.phase==='waiting'){if(s.players.length===CAPACITY&&validStart172(s,'rookies')){s.startedAt=now;startDay(s,now);}return;}
 for(let n=0;n<40&&s.phase!=='finished'&&now>=s.deadline;n++){const at=s.deadline;if(s.phase==='finale')finish(s,at);else closeDay(s,at);}
 delete s.chatLog;
}
export function actRookies(s,user,input,now=Date.now()){
 const action=input.action,p=s.players.find(q=>q.id===user.id);
 if(action==='join'){const enrollment=enrollmentOptions(input);if(s.phase!=='waiting')throw Error('La inscripción está cerrada.');if(p)return;if(s.players.length>=CAPACITY)throw Error('No quedan plazas.');s.players.push({id:user.id,username:user.username,bot:false,status:'active',placement:null,joinedAt:now,tie:random(0x7fffffff),...(enrollment?{notifyOnStart:enrollment.notifyOnStart}:{})});if(enrollment)s.welcomes.push({username:user.username,body:enrollment.welcome,at:now});return;}
 if(action==='fill_bots'){if(!canFillBots(user)||s.phase!=='waiting')throw Error('Solo admin1 puede completar con bots.');let n=1;while(s.players.length<CAPACITY){const id=-(s.id*100+n);s.players.push({id,username:'Bot '+s.id+' · '+n++,bot:true,status:'active',placement:null,joinedAt:now,tie:random(0x7fffffff)});}return;}
 if(action==='start'){if(!startAdmin172(user)||s.phase!=='waiting'||s.players.length<CAPACITY)throw Error('Solo admin1 puede iniciar con las 13 plazas completas.');authorizeStart172(s,user,'rookies',now);advanceRookies(s,now);return;}
 if(action==='whisper'){
  if(!p||p.status!=='active'||!['day','finale'].includes(s.phase))throw Error('Ahora no puedes enviar mensajes privados.');
  const to=s.players.find(q=>q.id===Number(input.to)),body=String(input.body||'').trim();if(!to||to.bot||to.id===p.id||to.status!=='active'||!body||body.length>500)throw Error('Mensaje privado no válido.');
  if((s.whispers||=[]).some(w=>w.from===p.id&&now-w.at<3000))throw Error('Espera tres segundos.');s.whispers.push({id:crypto.randomUUID(),from:p.id,to:to.id,body,at:now});s.whispers=s.whispers.slice(-500);return;
 }
 if(s.phase!=='day'||!p||p.status!=='active')throw Error('Ahora no puedes hacer esta acción.');
 if(action==='nominate'){
  if(p.id!==s.hoh)throw Error('Solo el HoH puede nominar.');if(s.hohPicks.length>=2)throw Error('Ya has guardado tus nominaciones.');const picks=[...new Set((input.targets||[]).map(Number))];
  if(picks.length!==2||picks.some(id=>id===p.id||byId(s,id)?.status!=='active'))throw Error('Elige a dos concursantes activos, sin incluirte.');s.hohPicks=picks;return;
 }
 if(action==='vote'){
  if(!s.nominees.length)throw Error('Hoy no hay votación.');if(s.nominees.includes(p.id))throw Error('Los nominados no pueden votar.');if(s.ballots[p.id])throw Error('Ya has guardado tus votos.');
  const ballot=input.ballot||{},values=s.nominees.map(id=>Number(ballot[id])),wanted=s.nominees.map((_,i)=>i);
  if(Object.keys(ballot).length!==s.nominees.length||[...values].sort((a,b)=>a-b).join()!==wanted.join())throw Error('Asigna cada valor de puntos una sola vez.');
  s.ballots[p.id]=Object.fromEntries(s.nominees.map((id,i)=>[id,values[i]]));return;
 }
 if(action==='save'){
  if(p.id!==s.pov)throw Error('Solo quien tiene el PoV puede salvar.');if(s.saved!=null)throw Error('Ya has usado el PoV hoy.');const target=input.target==null?null:Number(input.target);
  if(target===null||!s.nominees.includes(target))throw Error('Solo puedes salvar a un nominado.');s.saved=target;return;
 }
 throw Error('Acción no permitida.');
}
export function rookiesView(s,user,now=Date.now()){
 const me=user&&s.players.find(p=>p.id===user.id),active=me?.status==='active',hoh=byId(s,s.hoh),nominated=!!me&&s.nominees.includes(me.id);
 return {id:s.id,phase:s.phase,day:s.day,now,deadline:s.deadline,startedAt:s.startedAt,finishedAt:s.finishedAt,winner:s.winner||null,capacity:CAPACITY,canStart:canFillBots(user)&&s.phase==='waiting'&&s.players.length===CAPACITY,canFillBots:canFillBots(user)&&s.phase==='waiting'&&s.players.length<CAPACITY,
  hoh:hoh?.username||null,
  players:s.players.map(p=>({id:p.id,username:p.username,bot:!!p.bot,status:p.status,placement:p.placement,hoh:p.id===s.hoh,nominated:s.nominees.includes(p.id)})),
  nominees:s.nominees.map(id=>({id,username:byId(s,id)?.username})),points:s.nominees.map((_,i)=>i),
  me:me?{id:me.id,status:me.status,isHoh:active&&me.id===s.hoh,isPov:active&&s.phase==='day'&&me.id===s.pov,nominated,canVote:active&&s.phase==='day'&&s.nominees.length>0&&!nominated&&!s.ballots[me.id],ballot:s.ballots[me.id]||null,picks:me.id===s.hoh?s.hohPicks:[],saved:me.id===s.pov?s.saved:null,hohDone:active&&me.id===s.hoh&&s.phase==='day'&&s.hohPicks.length>=2,povDone:active&&me.id===s.pov&&s.phase==='day'&&s.saved!=null}:null,
  events:s.events.map(({id,text,at,kind})=>({id,text,at,kind})),
  whispers:me?(s.whispers||[]).filter(w=>w.from===me.id||w.to===me.id).map(w=>({id:w.id,from:byId(s,w.from)?.username,to:byId(s,w.to)?.username,body:w.body,at:w.at})):[],
  history:s.history.map(({day,rows})=>({day,rows}))};
}
