import {settleFrookies186} from './elimination-prizes186.js';
import {botTargets181} from './frookies-bot-policy181.js';
import {validStart172,authorizeStart172,startAdmin172} from './manual-start172.js';
import {GAME_PRIZES} from '../../prize-catalog.js';
import {CASTING_MINIGAMES} from '../../minigame-catalog.js';
import {castingBotScore} from './casting-bot-scores129.js';
export const CAPACITY=13,FEE=10,FINALE_MS=4*3600000,PRIZES=GAME_PRIZES.rookies_fast;
export const DURATIONS={warmup:60000,nominations:180000,veto:120000,replacement:120000,vote:180000,tiebreak:120000,final_partner:120000,final_third:120000,final_places:120000};
const k=p=>String(p?.username||p||'').toLowerCase(),live=s=>s.players.filter(p=>p.status==='active'),get=(s,name)=>s.players.find(p=>k(p)===k(name)),rng=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
const log=(s,text,at,kind='notice',extra={})=>{s.events.unshift({id:crypto.randomUUID(),text,at,kind,...extra});s.events=s.events.slice(0,200);};
export function fresh(id=0,now=Date.now()){return {id,version:134,rules146:true,runId:'initial',phase:'waiting',round:0,createdAt:now,lobbyEndsAt:null,deadline:null,players:[],events:[],ops:[],receipts:[],welcomes:[],hoh:null,pov:null,previousHoh:null,nominees:[],ballots:{},juryVotes:{},history:[],attempts:{},scores:{},whispers:[],challenge:null};}
function stage(s,phase,at){s.activitySince180=null;s.pending146=null;s.phase=phase;s.phaseStartedAt=at;s.deadline=at+(DURATIONS[phase]||FINALE_MS);}
function socialRank(s,p){const a=s.activity?.[k(p)]||{};return (a.positiveVoters||0)*3+(a.positives||0)+Math.min(5,a.messages||0);}
// Un bot nunca queda por delante de un usuario real.
export function order(s,ps){return ps.slice().sort((a,b)=>Number(!!a.bot)-Number(!!b.bot)||socialRank(s,b)-socialRank(s,a)||a.tie-b.tie||k(a).localeCompare(k(b)));}
export function eligibleHoh194(s){const outgoing=k(s.hoh||s.previousHoh||s.history?.at(-1)?.hoh);return live(s).filter(p=>k(p)!==outgoing);}
function startRound(s,at){
 const previous=s.round?{round:s.round,challenge:s.challenge,scores:{...s.scores},attempts:{...s.attempts}}:null;
 if(previous){s.challengeArchive146??=[];if(!s.challengeArchive146.some(r=>r.round===previous.round))s.challengeArchive146.push(previous);}
 s.previousChallenge146=previous;s.round++;s.roundStartedAt146=at;s.nominees=[];s.ballots={};s.attempts={};s.scores={};s.pov=null;s.savedNominee=null;s.vetoDecision=null;s.finalists=null;
 const candidates=eligibleHoh194(s);if(!candidates.length)throw Error('No hay candidatos elegibles para HoH: el HoH anterior no puede repetir.');s.hoh=order(s,candidates)[0].username;s.previousHoh=s.hoh;
 const games=Object.keys(CASTING_MINIGAMES);s.challenge=games[rng(games.length)];stage(s,'nominations',at);log(s,'HoH de la ronda '+s.round+': '+s.hoh+'.',at,'hoh',{hoh:s.hoh,round:s.round});if(live(s).length===4)enterFinalFour195(s,at);
}
export function upgrade146(s){if(s.rules146)return false;s.rules146=true;s.roundStartedAt146=s.phaseStartedAt||s.startedAt;s.challengeArchive146=(s.history||[]).map(r=>({round:r.round,challenge:r.challenge,scores:r.scores||{}}));s.previousChallenge146=s.challengeArchive146.find(r=>r.round===s.round-1)||null;return true;}
const nextMinute=now=>(Math.floor(now/60000)+1)*60000;
function queue(s,action,target,now){s.pending146={action,target,at:Math.min(nextMinute(now),s.deadline)};}
function roundReadyAt(s,now){return Math.max(now,...Object.entries(s.attempts||{}).filter(([name])=>!s.scores[name]&&live(s).some(p=>k(p)===name)).map(([,a])=>a.startedAt+a.duration*1000+5000));}
function transition(s,action,target,at){switch(action){case 'nominations':selectPov(s,at);break;case 'veto':if(target){s.savedNominee=target;s.nominees=s.nominees.filter(n=>n!==target);stage(s,'replacement',at);log(s,s.pov+' salva a '+target+'.',at);}else voting(s,at);break;case 'replace':s.nominees.push(target);voting(s,at);break;case 'vote':closeVote(s,at);break;case 'tiebreak':evict(s,target,at);break;case 'final_places':finalPlaces(s,target.third,target.fourth,at);break;}}
function allVoted(s){const voters=live(s).filter(p=>p.username!==s.hoh&&!s.nominees.includes(p.username));return voters.every(p=>!!s.ballots[k(p)]);}

function eliminate(s,name,at,placement=live(s).length){const p=get(s,name);if(!p||p.status!=='active')throw Error('Participante no disponible.');p.status='eliminated';p.placement=placement;p.eliminatedAt=at;settleFrookies186(s);}
export function povChallengeTime(s,p){const wins=(s.history||[]).filter(r=>k(r.pov)===k(p)).length;return {duration:Math.max(100,150-5*wins),povWins:wins};}
export function choosePov183(s){
 const living=live(s),humans=living.filter(p=>!p.bot),pool=humans.length?humans:living,scores=s.previousChallenge146?.scores||{};
 const points=p=>Number.isFinite(scores[k(p)]?.points)&&!(!p.bot&&scores[k(p)]?.simulated)?scores[k(p)].points:-1;
 return pool.slice().sort((a,b)=>points(b)-points(a)||socialRank(s,b)-socialRank(s,a)||a.tie-b.tie||k(a).localeCompare(k(b)))[0];
}
export function correctPovFour183(s,now=Date.now()){
 if(s.id!==4||s.round!==9||s.povCorrection183||!['veto','replacement','vote','tiebreak'].includes(s.phase)||!get(s,s.pov)?.bot)return false;
 const winner=choosePov183(s);if(!winner||winner.bot)return false;
 const original=(s.events||[]).find(e=>e.kind==='nominations'&&e.round===9&&e.nominees?.length===2)?.nominees;
 if(!original||original.some(n=>get(s,n)?.status!=='active'))return false;
 s.povCorrection183={at:now,previous:s.pov,winner:winner.username,sourceRound:s.previousChallenge146?.round||0,previousPhase:s.phase};
 for(const e of s.events||[])if(e.round===9&&['pov','pov-self-save'].includes(e.kind)){e.originalKind183=e.kind;e.kind='notice';e.text='Aviso de PoV anterior anulado por corrección administrativa.';}
 s.nominees=[...original];s.savedNominee=null;s.vetoDecision=null;s.pending146=null;s.ballots={};
 selectPov(s,s.pause180?.at||now);
 log(s,'PoV corregido: '+winner.username+'. Se priorizan los resultados válidos de usuarios reales frente a puntuaciones simuladas de bots.',now,'notice');
 return true;
}
function selectPov(s,at){
 // Round N uses only the closed challenge from N-1. First round uses the stable draw.
 const source=s.previousChallenge146,scores=source?.scores||{};
 s.pov=choosePov183(s).username;
 s.povSourceRound146=source?.round||0;
 log(s,'PoV: '+s.pov+'.'+(source?' Prueba de la ronda '+source.round+'.':' Sorteo inicial; aún no hay prueba anterior.'),at,'pov',{pov:s.pov,round:s.round});
 if(live(s).length===4){s.finalists=[...new Set([s.hoh,s.pov])];stage(s,'final_places',at);}else if(!autoSave158(s,at))stage(s,'veto',at);
}

export function enterFinalFour195(s,now=Date.now()){
 if(s.phase!=='nominations'||live(s).length!==4||!get(s,s.hoh)||get(s,s.hoh).status!=='active')return false;
 s.finalEntry195={at:now,previousRound:s.round,previousPhase:s.phase};s.round=10;s.nominees=[];s.ballots={};s.savedNominee=null;s.vetoDecision=null;
 selectPov(s,s.pause180?.at??now);return true;
}
export function allJuryVoted195(s){
 if(s.phase!=='jury'||s.finalists?.length!==2)return false;
 const jurors=s.players.filter(p=>Number.isInteger(p.placement)&&p.placement>=3&&p.placement<=9),expected=Math.min(7,s.players.length-2);
 return expected>0&&jurors.length===expected&&new Set(jurors.map(p=>p.placement)).size===expected&&jurors.every(p=>s.finalists.includes(s.juryVotes?.[k(p)]));
}
function nomineePool(s){return live(s).filter(p=>p.username!==s.hoh);}
function replacementPool(s){return live(s).filter(p=>![s.hoh,s.pov,s.savedNominee,...s.nominees].includes(p.username));}
function voting(s,at){stage(s,'vote',at);log(s,'Nominados: '+s.nominees.join(' y ')+'.',at,'nominations',{nominees:[...s.nominees],round:s.round});}
function evict(s,name,at){const totals=Object.fromEntries(s.nominees.map(n=>[n,Object.values(s.ballots).filter(x=>x===n).length]));eliminate(s,name,at);s.history.push({round:s.round,challenge:s.challenge,hoh:s.hoh,pov:s.pov,nominees:[...s.nominees],evicted:name,totals,scores:{...s.scores},at});log(s,name+' sale de la casa ('+totals[name]+' votos).',at,'eviction',{nominees:[...s.nominees],evicted:name,totals,round:s.round});startRound(s,at);}
function closeVote(s,at){const totals=s.nominees.map(n=>[n,Object.values(s.ballots).filter(x=>x===n).length]);if(totals[0][1]===totals[1][1])stage(s,'tiebreak',at);else evict(s,totals[0][1]>totals[1][1]?totals[0][0]:totals[1][0],at);}
function autoSave158(s,at){
 if(!s.pov||!s.nominees.includes(s.pov))return false;
 s.vetoDecision='use';s.savedNominee=s.pov;s.nominees=s.nominees.filter(n=>n!==s.pov);
 stage(s,'replacement',at);log(s,s.pov+' gana el PoV y se salva automáticamente. El HoH debe nombrar un sustituto.',at,'pov-self-save',{pov:s.pov,saved:s.pov,round:s.round});return true;
}
function finalPool158(s){return live(s).filter(p=>![s.hoh,s.pov,...(s.finalists||[])].includes(p.username));}
function validPlaces158(s,third,fourth){const pool=finalPool158(s);return live(s).length===4&&third!==fourth&&[third,fourth].every(n=>pool.some(p=>p.username===n));}
const legacyFinalHoh185=s=>Number(s.id)===4&&!s.finalEntry195;
export function finalChooser185(s){return legacyFinalHoh185(s)?s.hoh:s.pov;}
function finalPlaces(s,third,fourth,at){
 if(!validPlaces158(s,third,fourth))throw Error('Elige tercero y cuarto distintos, respetando la inmunidad del HoH y del PoV.');
 if(get(s,third)?.bot&&!get(s,fourth)?.bot)throw Error('Un bot no puede quedar por delante de un usuario real.');
 eliminate(s,third,at,3);eliminate(s,fourth,at,4);s.finalists=live(s).map(p=>p.username);
 stage(s,'jury',at);log(s,(legacyFinalHoh185(s)?'El HoH':'El PoV')+' asigna el tercer puesto a '+third+' y el cuarto a '+fourth+'.',at,'final-places',{third,fourth,round:s.round});log(s,'Finalistas: '+s.finalists.join(' y ')+'. El jurado tiene cuatro horas.',at,'finalists',{finalists:[...s.finalists]});
}
function defaultPlaces158(s){const pool=order(s,finalPool158(s));return {third:pool.at(-2)?.username,fourth:pool.at(-1)?.username};}
function upgrade158(s,now){
 s.rules158=true;
 if(s.phase==='veto'&&s.nominees.includes(s.pov))return autoSave158(s,now);
 if(['final_partner','final_third'].includes(s.phase)&&live(s).length===4){
  const old=s.pending146;s.finalists=[...new Set([s.hoh,s.pov,...(s.finalists||[]),...(old?.action==='final_partner'?[old.target]:[])])].filter(n=>live(s).some(p=>p.username===n));
  stage(s,'final_places',now);
  if(old?.action==='final_third'){const other=finalPool158(s).find(p=>p.username!==old.target)?.username;if(validPlaces158(s,old.target,other))s.pending146={action:'final_places',target:{third:old.target,fourth:other},at:Math.max(now,old.at)};}
  return true;
 }
 return false;
}
function finish(s,at){const finalists=s.finalists.map(n=>get(s,n));const votes=n=>Object.values(s.juryVotes).filter(x=>x===n).length;finalists.sort((a,b)=>Number(a.bot)-Number(b.bot)||votes(b.username)-votes(a.username)||Number(b.username===s.hoh)-Number(a.username===s.hoh)||a.tie-b.tie);finalists.forEach((p,i)=>p.placement=i+1);s.winner=finalists[0].username;s.phase='finished';s.finishedAt=at;s.deadline=null;for(const p of s.players.filter(p=>!p.bot)){const reward=PRIZES[p.placement-1]||[0,0];const event=`frookies:${s.id}${s.runId&&s.runId!=='initial'?':run:'+s.runId:''}:prize:${p.id}`;if(!s.ops.some(op=>op.key===event))s.ops.push({key:event,user:p.id,karma:reward[0],money:reward[1]});}log(s,'Ganador de Frookies: '+s.winner+'.',at,'winner',{winner:s.winner});}
function botChoices(s,at){if(s.round>0&&s.challenge&&!['jury','finished','waiting','warmup'].includes(s.phase))for(const p of live(s).filter(p=>p.bot))if(!s.scores[k(p)])s.scores[k(p)]={points:castingBotScore(s.challenge,povChallengeTime(s,p).duration),simulated:true,savedAt:at};if(s.pending146)return;if(at<s.phaseStartedAt+5000)return;const bot=name=>get(s,name)?.bot;
 if(s.phase==='nominations'&&live(s).length>4&&!s.nominees.length&&bot(s.hoh)){s.nominees=botTargets181(s,nomineePool(s),at).slice(0,2).map(p=>p.username);queue(s,'nominations',null,at);}
 if(s.phase==='veto'&&bot(s.pov)){const own=s.nominees.includes(s.pov)?s.pov:null;s.vetoDecision=own?'use':'keep';queue(s,'veto',own,at);return;}
 if(s.phase==='replacement'&&bot(s.hoh)){queue(s,'replace',botTargets181(s,replacementPool(s),at)[0].username,at);return;}
 if(s.phase==='vote'){for(const p of live(s).filter(p=>p.bot&&p.username!==s.hoh&&!s.nominees.includes(p.username)))if(!s.ballots[k(p)])s.ballots[k(p)]=botTargets181(s,s.nominees.map(n=>get(s,n)),at)[0].username;if(allVoted(s))queue(s,'vote',null,at);}
 if(s.phase==='tiebreak'&&bot(s.hoh))queue(s,'tiebreak',botTargets181(s,s.nominees.map(n=>get(s,n)),at)[0].username,at);
 if(s.phase==='final_places'&&bot(finalChooser185(s)))queue(s,'final_places',defaultPlaces158(s),at);
}
export function advanceBotJury(s,now){
 if(s.phase!=='jury'||s.finalists?.length!==2)return;
 const jurors=s.players.filter(p=>p.bot&&p.placement>=3&&p.placement<=9);if(!jurors.length)return;
 s.botJurySchedule??={};
 for(const p of jurors){
  const key=k(p);if(s.juryVotes[key])continue;
  if(!s.botJurySchedule[key]){const seed=String(s.id)+':'+s.runId+':'+s.round+':'+key+':'+p.tie;let hash=2166136261;for(const c of seed)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;s.botJurySchedule[key]={at:Math.min(now+30000+hash%90001,s.deadline-1),target:s.finalists[(hash>>>16)%2]};}
  const vote=s.botJurySchedule[key];if(now>=vote.at&&s.finalists.includes(vote.target))s.juryVotes[key]=vote.target;
 }
}
export function repairFinalPlaces222(s,now=Date.now()){
 if(s.phase!=='final_places'||Number(s.id)===4&&!s.finalEntry195||live(s).length!==4)return false;
 const finalists=[...new Set([s.hoh,s.pov])].filter(n=>live(s).some(p=>p.username===n));
 if(finalists.length!==2)return false;
 const pool=live(s).filter(p=>!finalists.includes(p.username));
 const invalid=s.pending146?.action==='final_places'&&(!pool.some(p=>p.username===s.pending146.target?.third)||!pool.some(p=>p.username===s.pending146.target?.fourth)||s.pending146.target.third===s.pending146.target.fourth);
 if(JSON.stringify(s.finalists)===JSON.stringify(finalists)&&!invalid)return false;
 s.finalRepair222??={at:now,previousFinalists:[...(s.finalists||[])],previousPending:s.pending146?JSON.parse(JSON.stringify(s.pending146)):null};
 s.finalists=finalists;if(invalid)s.pending146=null;s.deadline=Math.max(s.deadline||0,now+DURATIONS.final_places);return true;
}
export function advance(s,now=Date.now()){repairFinalPlaces222(s,now);
 if(s.pause180)return s;
 upgrade146(s);if(upgrade158(s,now))return s;advanceBotJury(s,now);if(allJuryVoted195(s)){finish(s,now);return s;}
 if(s.phase==='final_places'&&!legacyFinalHoh185(s)&&s.finalChooserVersion185!==185){s.finalChooserVersion185=185;if(s.hoh!==s.pov&&s.pending146?.action==='final_places')s.pending146=null;}
 if(s.phase==='waiting'){if(s.players.length===CAPACITY&&(s.manualStartRequired172?validStart172(s,'frookies'):!s.manualStart)){s.startedAt=now;stage(s,'warmup',now);log(s,'¡Empieza Frookies! Primera elección de HoH en un minuto.',now);}return s;}
 if(s.phase==='finished')return s;
 // Exactly one transition per request, anchored at NOW, never replay overdue days.
 if(s.pending146&&now>=s.pending146.at){const q=s.pending146;if(['vote','tiebreak'].includes(q.action)){const ready=roundReadyAt(s,now);if(ready>now){q.at=nextMinute(ready-1);s.deadline=Math.max(s.deadline,q.at);return s;}}transition(s,q.action,q.target,now);return s;}
 if(now>=s.deadline){const at=now;if(['vote','tiebreak'].includes(s.phase)){const ready=roundReadyAt(s,now);if(ready>now){s.deadline=ready;return s;}}
 switch(s.phase){case 'warmup':startRound(s,at);break;case 'nominations':if(live(s).length>4&&!s.nominees.length)s.nominees=botTargets181(s,nomineePool(s),at).slice(0,2).map(p=>p.username);selectPov(s,at);break;case 'veto':s.vetoDecision='keep';voting(s,at);break;case 'replacement':s.nominees.push(botTargets181(s,replacementPool(s),at)[0].username);voting(s,at);break;case 'vote':closeVote(s,at);break;case 'tiebreak':evict(s,get(s,s.hoh)?.bot?botTargets181(s,s.nominees.map(n=>get(s,n)),at)[0].username:s.nominees.slice().sort((a,b)=>get(s,b).tie-get(s,a).tie)[0],at);break;case 'final_places':{const choice=defaultPlaces158(s);finalPlaces(s,choice.third,choice.fourth,at);break;}case 'jury':finish(s,at);break;}return s;}
 botChoices(s,now);return s;
}

export function act(s,user,input,now=Date.now(),trusted=false){
 if(['pause','resume'].includes(input.action)){
  if(!startAdmin172(user)||user.is_system||user.is_banned)throw Error('Solo admin1 puede pausar o reanudar.');
  if(input.runId!==(s.runId||'initial'))throw Error('La partida ha cambiado. Actualiza la página.');
  if(['waiting','finished'].includes(s.phase))throw Error('La partida no está en marcha.');
  if(input.action==='pause'){if(!s.pause180){s.pause180={at:now,by:user.username};s.activitySince180=s.activitySince180||s.phaseStartedAt;log(s,'admin1 pausa la partida. Los plazos quedan detenidos.',now);}return;}
  if(!s.pause180)return;
  const delta=Math.max(0,now-s.pause180.at);
  for(const key of ['deadline','phaseStartedAt','roundStartedAt146'])if(Number.isFinite(s[key]))s[key]+=delta;
  if(Number.isFinite(s.pending146?.at))s.pending146.at+=delta;
  for(const attempt of Object.values(s.attempts||{}))if(Number.isFinite(attempt.startedAt))attempt.startedAt+=delta;
  for(const vote of Object.values(s.botJurySchedule||{}))if(Number.isFinite(vote.at))vote.at+=delta;
  delete s.pause180;log(s,'admin1 reanuda la partida.',now);return;
 }
 if(trusted&&input.action==='flash_finish'){
  if(!user||user.is_system||user.is_banned)throw Error('Inicia sesión con una cuenta disponible.');
  const p=get(s,user.username),old=p&&s.attempts[k(p)];
  if(!p||p.bot||p.status!=='active'||input.round!==s.round||input.kind!==s.challenge||!['nominations','veto','replacement','vote','tiebreak','final_places'].includes(s.phase)||!old||old.token!==input.token)throw Error('Intento no válido para esta ronda.');
  if(s.scores[k(p)])return;
  if(!Number.isFinite(input.points)||input.points<0||input.points>1e9||now-old.startedAt<1000)throw Error('Puntuación no válida.');
  s.scores[k(p)]={points:input.points,savedAt:now,savedDuringPause184:!!s.pause180};return;
 }
 if(s.pause180)throw Error('Partida pausada por admin1. Espera a que se reanude.');
 advance(s,now);if(!user||user.is_system||user.is_banned)throw Error('Inicia sesión con una cuenta disponible.');const p=get(s,user.username),action=input.action;
 if(action==='start'){if(s.runId&&s.runId!=='initial'&&input.runId!==s.runId)throw Error('La partida se ha reiniciado. Actualiza la página.');if(s.players.length!==CAPACITY)throw Error('Completa las 13 plazas antes de iniciar.');authorizeStart172(s,user,'frookies',now);s.manualStart=false;advance(s,now);return;}
 if(action==='join'){if(p)return;if(s.phase!=='waiting'||s.players.length>=CAPACITY)throw Error('La inscripción está cerrada.');s.players.push({id:user.id,username:user.username,status:'active',bot:false,tie:rng(0x100000000),placement:null});s.ops.push({key:`frookies:${s.id}:entry:${user.id}`,user:user.id,money:-FEE,karma:0});if(input.welcome){s.welcomes.push({username:user.username,body:String(input.welcome).slice(0,500),at:now});}advance(s,now);return;}
 if(action==='fill_bots'){if(s.runId&&s.runId!=='initial'&&input.runId!==s.runId)throw Error('La partida se ha reiniciado. Actualiza la página.');if(!startAdmin172(user))throw Error('Solo admin1 puede completar con bots.');if(s.phase!=='waiting')throw Error('La partida ya empezó.');let i=1;while(s.players.length<CAPACITY)s.players.push({id:-(s.id*100+i),username:'Tributo F'+s.id+' · '+i++,status:'active',bot:true,tie:rng(0x100000000),placement:null});s.manualStart=false;advance(s,now);return;}
 if(!p)throw Error('No participas en esta partida.');if(action==='jury'){if(s.phase!=='jury'||p.bot||p.placement<3||p.placement>9||!p.placement)throw Error('No formas parte del jurado.');if((s.runId&&s.runId!=='initial'&&input.runId!==s.runId)||input.round!==s.round||input.phase!=='jury')throw Error('La fase ha cambiado.');if(!s.finalists.includes(input.target))throw Error('Elige a un finalista.');if(s.juryVotes[k(p)])throw Error('Tu voto ya está guardado.');s.juryVotes[k(p)]=input.target;advanceBotJury(s,now);if(allJuryVoted195(s))finish(s,now);return;}
 if(p.status!=='active'||['finished','waiting','jury'].includes(s.phase))throw Error('No puedes actuar en esta fase.');
 if((s.runId&&s.runId!=='initial'&&input.runId!==s.runId&&!trusted)||input.round!==s.round||(!trusted&&input.phase!==s.phase))throw Error('La fase ha cambiado. Actualiza la partida.');
 if(action==='whisper'){const target=get(s,input.target),text=String(input.message||'').trim();if(!target||target===p||target.bot||target.status!=='active'||!text||text.length>500)throw Error('Destinatario o mensaje no válido.');if(now-(p.lastWhisperAt||0)<3000)throw Error('Espera tres segundos.');p.lastWhisperAt=now;s.whispers.push({from:p.username,to:target.username,body:text,at:now});s.whispers=s.whispers.slice(-300);return;}
 if(action==='flash_start'||action==='flash_finish'){if(!trusted||!['nominations','veto','replacement','vote','tiebreak','final_places'].includes(s.phase)||input.kind!==s.challenge)throw Error('Abre el desafío oficial de PoV.');const old=s.attempts[k(p)];if(action==='flash_start'){if(s.phase==='final_places'&&s.finalEntry195)throw Error('El PoV final ya está decidido con la prueba de la ronda anterior.');if(s.scores[k(p)])throw Error('Ya terminaste la prueba.');if(!old){const duration=povChallengeTime(s,p).duration;s.attempts[k(p)]={token:crypto.randomUUID(),startedAt:now,duration,kind:s.challenge};if(['vote','tiebreak'].includes(s.phase))s.deadline=Math.max(s.deadline,now+duration*1000+5000);if(s.pending146&&['vote','tiebreak'].includes(s.pending146.action))s.pending146.at=Math.max(s.pending146.at,nextMinute(now+duration*1000+4999));}}else{if(!old||old.token!==input.token)throw Error('Intento no válido.');if(s.scores[k(p)])return;if(!Number.isFinite(input.points)||input.points<0||input.points>1e9||now-old.startedAt<1000)throw Error('Puntuación no válida.');s.scores[k(p)]={points:input.points,savedAt:now};}return;}
 if(s.pending146)throw Error('La decisión está guardada. Se aplicará al cambiar el minuto.');
 if(action==='nominate'){if(s.phase!=='nominations'||p.username!==s.hoh||live(s).length===4||s.nominees.length)throw Error('Solo el HoH puede nominar una vez.');const names=input.nominees;if(!Array.isArray(names)||names.length!==2||new Set(names).size!==2||names.some(n=>!nomineePool(s).some(p=>p.username===n)))throw Error('Elige dos concursantes distintos, sin nominarte.');s.nominees=[...names];queue(s,'nominations',null,now);log(s,'El HoH nomina a '+names.join(' y ')+'.',now,'nominations',{nominees:[...names],round:s.round});return;}
 if(action==='veto'){if(s.phase!=='veto'||p.username!==s.pov||s.vetoDecision)throw Error('Solo el PoV puede decidir una vez.');if(input.target&&!s.nominees.includes(input.target))throw Error('Solo puedes salvar a un nominado.');s.vetoDecision=input.target?'use':'keep';queue(s,'veto',input.target||null,now);return;}
 if(action==='replace'){if(s.phase!=='replacement'||p.username!==s.hoh||!replacementPool(s).some(p=>p.username===input.target))throw Error('Sustitución no válida: respeta la inmunidad del HoH, PoV y salvado.');queue(s,'replace',input.target,now);return;}
 if(action==='vote'){if(s.phase!=='vote'||p.username===s.hoh||s.nominees.includes(p.username)||!s.nominees.includes(input.target))throw Error('No puedes emitir ese voto.');if(s.ballots[k(p)])throw Error('Ya has votado.');s.ballots[k(p)]=input.target;if(allVoted(s))queue(s,'vote',null,now);return;}
 if(action==='tiebreak'){if(s.phase!=='tiebreak'||p.username!==s.hoh||!s.nominees.includes(input.target))throw Error('Solo el HoH desempata.');queue(s,'tiebreak',input.target,now);return;}
 if(action==='final_places'){if(s.phase!=='final_places'||p.username!==finalChooser185(s))throw Error(legacyFinalHoh185(s)?'Solo el HoH asigna el tercer y cuarto puesto.':'Solo el PoV asigna el tercer y cuarto puesto.');if(!validPlaces158(s,input.third,input.fourth))throw Error('Elige tercero y cuarto distintos, sin elegir al HoH ni al PoV.');queue(s,'final_places',{third:input.third,fourth:input.fourth},now);return;}
 throw Error('Acción no disponible.');
}
export function pendingDecision(s,p){
 const name=p.username,key=k(p);
 if(s.phase==='jury')return p.placement>=3&&p.placement<=9&&!s.juryVotes[key]?'Pendiente de votar al ganador':null;
 if(s.pending146)return null;
 if(p.status!=='active')return null;
 if(s.phase==='nominations'&&name===s.hoh&&live(s).length>4&&!s.nominees.length)return 'Pendiente de nominar';
 if(s.phase==='veto'&&name===s.pov&&!s.vetoDecision)return 'Pendiente de decidir el PoV';
 if(s.phase==='replacement'&&name===s.hoh)return 'Pendiente de nominar al sustituto';
 if(s.phase==='vote'&&name!==s.hoh&&!s.nominees.includes(name)&&!s.ballots[key])return 'Pendiente de votar';
 if(s.phase==='tiebreak'&&name===s.hoh)return 'Pendiente de desempatar';
 if(s.phase==='final_places'&&name===finalChooser185(s))return 'Pendiente de elegir tercero y cuarto';
 return null;
}
export function view(s,user,now=Date.now()){
 const p=user&&get(s,user.username),own=p&&k(p);
 const results=(scores,attempts={})=>s.players.filter(x=>x.status==='active'||k(x)===own).map(x=>({username:x.username,bot:x.bot,points:k(x)===own?scores?.[k(x)]?.points??null:null,completed:!!scores?.[k(x)],started:!!attempts[k(x)],at:scores?.[k(x)]?.savedAt??null}));
 const history=(s.history||[]).map(({scores,...row})=>({...row,results:results(scores)}));
 return {finalChooser:finalChooser185(s),finalChooserRole:legacyFinalHoh185(s)?'HoH':'PoV',paused:!!s.pause180,pausedAt:s.pause180?.at||null,canPause:startAdmin172(user)&&!['waiting','finished'].includes(s.phase)&&!s.pause180,canResume:startAdmin172(user)&&!!s.pause180,correction180:s.correction180||null,id:s.id,runId:s.runId||'initial',rules146:true,recovery:s.recovery||null,phase:s.phase,round:s.round,createdAt:s.createdAt,startedAt:s.startedAt,finishedAt:s.finishedAt,deadline:s.pending146?.at??s.deadline,challengeDeadline:Math.max(s.deadline||now,now+155000),decisionSaved:!!s.pending146,povSourceRound:s.povSourceRound146||0,lobbyEndsAt:null,capacity:CAPACITY,fee:FEE,now,hoh:s.hoh,pov:s.pov,nominees:s.nominees,savedNominee:s.savedNominee||null,finalists:s.finalists||[],winner:s.winner||null,
 players:s.players.map(({id,username,status,placement,bot})=>({id,username,status,placement,bot,decisionPending:pendingDecision(s,{username,status,placement,bot}),votePending:s.phase==='vote'&&status==='active'&&username!==s.hoh&&!s.nominees.includes(username)&&!s.ballots[username.toLowerCase()]})),events:s.events,history,challengeHistory:(s.challengeArchive146||s.history||[]).map(r=>({round:r.round,challenge:r.challenge||null,results:results(r.scores,r.attempts)})),challengeResults:results(s.scores,s.attempts),challenge:s.challenge,
 me:p?{username:p.username,status:p.status,placement:p.placement,challengeTime:{...povChallengeTime(s,p),duration:s.attempts[own]?.duration??povChallengeTime(s,p).duration,locked:!!s.attempts[own]},hasScore:!!s.scores[own],score:s.scores[own]?.points??null,hasVoted:!!s.ballots[own],hasJuryVoted:!!s.juryVotes[own],canJury:s.phase==='jury'&&!p.bot&&p.placement>=3&&p.placement<=9}:null,
 canFillBots:startAdmin172(user)&&s.phase==='waiting',canStart:startAdmin172(user)&&s.phase==='waiting'&&s.players.length===CAPACITY,manualStartRequired:true,whispers:p?s.whispers.filter(w=>k(w.from)===own||k(w.to)===own):[],juryCount:Object.keys(s.juryVotes).length,voteCount:Object.keys(s.ballots).length};}
