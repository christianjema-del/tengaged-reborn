import {resourceOrder188,activeCasting188} from './casting-ranking188.js';
import {validStart172,authorizeStart172,startAdmin172} from './manual-start172.js';
import {castingBotScore} from './casting-bot-scores129.js';
import {resetDropDay,publicDrops} from './casting-drops.js';
import {castingChallengeTime} from './challenge-time.js';
import {canFillBots} from './game-bots.js';
import {enrollmentOptions} from './enrollment.js';
export const CAPACITY=20,DAY_MS=12*60*60*1000,HOUR_MS=3600000,IDLE_GRACE_MS=HOUR_MS,IDLE_STEP_MS=30*60000;
const GAMES=['wheel','numbers','deal','match','guitar','endurance','maze','snow','words','line'];
const key=p=>p.username.toLowerCase();
const live=s=>s.players.filter(p=>p.status==='active');
const random=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
export function chatActive(s,p,at=Date.now()){return !p.bot&&Number(p.lastChatAt)>0&&p.lastChatAt>=(s.startedAt||0)&&at>=p.lastChatAt;}
function log(s,text,at){s.events.unshift({text,at});s.events=s.events.slice(0,100);}
export function fresh(id=0,now=Date.now()){return {id,rulesVersion:78,healthRuleVersion:142,challengeRuleVersion:129,daily:true,phase:'waiting',round:1,players:[],practice:false,createdAt:now,startAt:null,deadline:null,nominees:[],ballots:{},events:[],eliminations:[],winner:null,keyDrops:[],flashAttempts:{},flashScores:{},reactions:{},whispers:[]};}
function challenge(s){let bag=s.challengeBag||[];if(!bag.length){bag=[...GAMES];for(let i=bag.length-1;i>0;i--){const j=random(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.at(-1)===s.selectedChallenge)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}s.selectedChallenge=bag.pop();s.challengeBag=bag;s.scoringMode='flash-v1';s.flashAttempts={};s.flashScores={};s.reactions={};}
// Average percentile rank gives tied values exactly the same contribution.
export function rankScores(players,value){const n=players.length,out={};for(const p of players){const v=value(p),lower=players.filter(q=>value(q)<v).length,equal=players.filter(q=>value(q)===v).length;out[key(p)]=n<=1?1:(lower+(equal-1)/2)/(n-1);}return out;}
// V332 (regla de admin1): los nominados del día son los peores del desafío, pero quien tiene al menos
// una llave se salva frente a quien no tiene ninguna. Los bots, siempre por detrás. El chat no cuenta.
export function nominationCompare332(a,b){return Number(!!a.bot)-Number(!!b.bot)||Number(b.keys>0)-Number(a.keys>0)||b.challengeScore-a.challengeScore||b.checks-a.checks||b.keys-a.keys||a.tie-b.tie||a.username.localeCompare(b.username);}
export function standings(s,final=false,at=Date.now()){const rows=resourceOrder188(s,live(s),final,at);return final?rows:rows.sort(nominationCompare332);}
// V324: quienes siguen vivos al final van por delante de los eliminados. Los vivos se ordenan
// por recursos (V331: con llaves primero, después más posis); los eliminados conservan el orden en que salieron (el último en caer, primero).
// Humanos siempre antes que bots.
// V331 (regla de admin1): gana quien más posis (tics) tiene, pero sin llaves no se puede ganar:
// primero quienes tienen al menos una llave, después más posis, más llaves, mejor desafío y más manzanas.
export function finalCompare331(a,b){return Number(!!a.bot)-Number(!!b.bot)||Number(b.keys>0)-Number(a.keys>0)||b.checks-a.checks||b.keys-a.keys||b.challengeScore-a.challengeScore||b.apples-a.apples||a.tie-b.tie||a.username.localeCompare(b.username);}
export function finalOrder324(s,at){
 const alivePlayers=s.players.filter(p=>p.status!=='eliminated'),out=s.players.filter(p=>p.status==='eliminated');
 const ranked=resourceOrder188(s,s.players,true,at),byName=new Map(ranked.map(r=>[r.username.toLowerCase(),r]));
 // V331: ver finalCompare331.
 // La actividad reciente en el chat ya no cuenta para la clasificación final.
 const resources=list=>ranked.filter(r=>list.some(p=>key(p)===r.username.toLowerCase())).sort(finalCompare331);
 const gone=list=>list.slice().sort((a,b)=>(Number(a.placement)||Infinity)-(Number(b.placement)||Infinity)||(b.eliminatedAt186||0)-(a.eliminatedAt186||0)).map(p=>byName.get(key(p)));
 return [...resources(alivePlayers.filter(p=>!p.bot)),...gone(out.filter(p=>!p.bot)),...resources(alivePlayers.filter(p=>p.bot)),...gone(out.filter(p=>p.bot))];
}
function finish(s,at){s.positionRecovery227??={at,previousWinner:s.winner,previous:s.players.map(p=>({username:p.username,placement:p.placement})),policy:'all-resources-final'};const rows=finalOrder324(s,at);rows.forEach((r,i)=>{r.placement=i+1;s.players.find(p=>key(p)===r.username.toLowerCase()).placement=i+1;});s.resourceRankingVersion227=227;s.finalOrderVersion324=324;s.finalStandings=rows.map(({tie,rank,...r})=>r);s.winner=rows[0]?.username||null;s.phase='finished';s.finishedAt=at;s.deadline=null;s.nominees=[];log(s,'Final del Casting. Ganador/a: '+(s.winner||'sin supervivientes')+'.',at);}
function eliminate(s,p,at,cause){
 // V319: un nominado no puede morir (inactividad o veneno) mientras dura la votación.
 if(s.phase==='elimination'&&s.nominees.includes(p.username)&&['inactividad','veneno'].includes(cause)){p.health=Math.max(1,Number(p.health)||0);return;}
 if(activeCasting188(s,p,at)){const bots=live(s).filter(x=>x.bot);if(bots.length){const intended=p;p=bots.sort((a,b)=>(a.health||0)-(b.health||0)||key(a).localeCompare(key(b)))[0];intended.health=Math.max(1,intended.health);cause='prioridad de usuarios activos · '+cause;}else{const inactive=live(s).filter(x=>x!==p&&!x.bot&&!activeCasting188(s,x,at));if(inactive.length){const intended=p,worst=resourceOrder188(s,inactive,false,at).at(-1);p=inactive.find(x=>x.username===worst.username);intended.health=Math.max(1,intended.health);cause='prioridad de usuarios activos · '+cause;}}}
 const placement=p.bot?s.players.filter(x=>!x.bot).length+live(s).filter(x=>x.bot).length:live(s).filter(x=>!x.bot).length;p.status='eliminated';p.placement=placement;p.eliminatedAt186=at;s.eliminations.unshift({username:p.username,round:s.round,at,cause});const wasNominee=s.nominees.includes(p.username);s.nominees=s.nominees.filter(n=>n!==p.username);if(wasNominee)compactBallots319(s,p.username);log(s,p.username+' queda eliminado/a ('+cause+').',at);}
export function adminKick336(s,p,at){
 const placement=p.bot?s.players.filter(x=>!x.bot).length+live(s).filter(x=>x.bot).length:live(s).filter(x=>!x.bot).length;
 p.status='eliminated';p.placement=placement;p.eliminatedAt186=at;s.eliminations.unshift({username:p.username,round:s.round,at,cause:'expulsado por admin1'});
 const wasNominee=s.nominees.includes(p.username);s.nominees=s.nominees.filter(n=>n!==p.username);if(wasNominee)compactBallots319(s,p.username);if(s.ballots)delete s.ballots[key(p)];
 log(s,p.username+' queda expulsado/a de la partida por admin1.',at);
}
// V319: si un nominado sale de la partida, cada papeleta conserva su orden y se reajusta a 1..n
// (antes quedaba un 3 cuando solo había 2 nominados y no se podía corregir).
export function compactBallots319(s,gone){for(const [voter,ballot] of Object.entries(s.ballots||{})){const rest=Object.entries(ballot).filter(([n])=>n!==gone&&s.nominees.includes(n)).sort((a,b)=>a[1]-b[1]);s.ballots[voter]=Object.fromEntries(rest.map(([n],i)=>[n,i+1]));if(!rest.length)delete s.ballots[voter];}}
function inactivity(s,at){for(const p of [...live(s)].sort((a,b)=>Number(!!b.bot)-Number(!!a.bot))){if(p.status!=='active')continue;const due=Math.max(0,Math.floor((at-(s.healthRuleVersion===142?Math.max(p.lastChatAt||0,s.startedAt||0):(p.lastActiveAt||s.startedAt))-IDLE_GRACE_MS)/IDLE_STEP_MS)),loss=Math.max(0,due-(p.idleCharged||0));p.idleCharged=Math.max(p.idleCharged||0,due);if(s.phase==='elimination'&&s.nominees.includes(p.username))continue;if(loss&&!(p.healthRecoveryGrace142&&at<p.healthRecoveryGrace142)){p.health=Math.max(0,p.health-loss);if(!p.health)eliminate(s,p,at,'inactividad');}}}
function recordDay(s){s.challengeHistory??=[];if(!s.challengeHistory.some(x=>x.round===s.round))s.challengeHistory.push({round:s.round,challenge:s.selectedChallenge,results:challengeResults(s)});const players=live(s),rank=rankScores(players,p=>s.flashScores[key(p)]?.points||0);for(const p of players){p.performanceTotal=(p.performanceTotal||0)+rank[key(p)];p.performanceDays=(p.performanceDays||0)+1;}}
function closeDay(s,at){recordDay(s);if(s.round>=2&&s.nominees.length){const totals=Object.fromEntries(s.nominees.map(n=>[n,0]));for(const [voter,ballot] of Object.entries(s.ballots)){if(!live(s).some(p=>key(p)===voter)||s.nominees.some(n=>n.toLowerCase()===voter))continue;for(const [target,points] of Object.entries(ballot))if(target in totals)totals[target]+=points;}const rows=standings(s,false,at),index=n=>rows.findIndex(r=>r.username===n);const target=[...s.nominees].sort((a,b)=>totals[b]-totals[a]||index(b)-index(a))[0];const p=live(s).find(p=>p.username===target);if(p)eliminate(s,p,at,'expulsión · '+totals[target]+' puntos');}
 // Los bots no pasan del dia 2: mueren todos al cerrarlo, despues de la expulsion.
 if(s.round===2)for(const p of live(s).filter(p=>p.bot))eliminate(s,p,at,'fin del día 2');
 if(live(s).length<=5){finish(s,at);return;}
 const ranked=standings(s,false,at),count=live(s).length<=7?2:3;s.nominees=ranked.slice(-count).reverse().map(r=>r.username);s.round++;s.ballots={};s.phase='elimination';s.dayStartedAt=at;s.deadline=at+DAY_MS;resetDropDay(s,at);challenge(s);log(s,'Día '+s.round+'. Nominados: '+s.nominees.join(', ')+'.',at);
}
// Simulated participants use their own scores and ballots, never human attempts.
function botActivity(s,at){
 if(!s.startedAt||at-Math.max(s.dayStartedAt,s.challengeReset129?.at||0)<60000)return;
 const elapsed=Math.max(1,Math.floor((at-s.startedAt)/HOUR_MS));
 for(const p of live(s).filter(p=>p.bot)){
  const k=key(p);
  if(!s.flashScores[k]){s.flashScores[k]={points:castingBotScore(s.selectedChallenge,castingChallengeTime(p,s).duration),savedAt:at,simulated:true};s.reactions[k]=-s.flashScores[k].points;}
  if(s.round>1&&!s.nominees.includes(p.username)&&!s.ballots[k]){const choices=[...s.nominees];for(let i=choices.length-1;i>0;i--){const j=random(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}s.ballots[k]=Object.fromEntries(choices.map((n,i)=>[n,i+1]));}
 }
}
export function resetActiveChallenge129(s,now=Date.now()){
 if(s.phase==='finished'||s.challengeRuleVersion>=129)return false;
 s.challengeRuleVersion=129;
 if(s.phase==='waiting')return false;
 s.challengeReset129={at:now,round:s.round,challenge:s.selectedChallenge,attempts:s.flashAttempts||{},scores:s.flashScores||{},reactions:s.reactions||{}};
 s.flashAttempts={};s.flashScores={};s.reactions={};
 log(s,'Desafío reiniciado: todos pueden repetir la prueba con los nuevos tiempos por tics.',now);return true;
}
// Replace nominees removed by inactivity before voting/closing the day.
export function repairNominees223(s,now=Date.now()){
 if(s.phase!=='elimination'||s.round<2||live(s).length<=5)return false;
 const count=live(s).length<=7?2:3,old=s.nominees||[];
 const eligible=new Set(live(s).map(p=>p.username));
 // V319: los nominados que siguen vivos no se quitan a mitad de día aunque baje el número de jugadores.
 const retained=[...new Set(old)].filter(n=>eligible.has(n));
 if(retained.length>=count){if(retained.length!==old.length)s.nominees=retained;return false;}
 const worst=standings(s,false,now).slice().reverse().map(p=>p.username);
 const nominees=[...retained,...worst.filter(n=>!retained.includes(n))].slice(0,count);
 if(nominees.length!==count)return false;
 s.nominationRepairs223??=[];s.nominationRepairs223.push({round:s.round,at:now,previousNominees:[...old],previousBallots:JSON.parse(JSON.stringify(s.ballots||{})),nominees:[...nominees]});
 s.nominees=nominees;s.ballots={};s.deadline=Math.max(s.deadline||0,now+30*60000);
 log(s,'Día '+s.round+'. Nominaciones actualizadas por bajas: '+nominees.join(', ')+'. La votación vuelve a estar abierta.',now);return true;
}
export function advance(s,now=Date.now(),force=false){if(s.phase==='finished')return s;if(s.phase==='waiting'){if(s.manualStartRequired172&&!validStart172(s,'casting'))return s;s.challengeRuleVersion=129;if(s.players.length===CAPACITY||(s.practice&&s.startRequested)){s.phase='immunity';s.startedAt=now;s.startAt=now;s.dayStartedAt=now;s.deadline=now+DAY_MS;resetDropDay(s,now);for(const p of s.players){p.lastActiveAt=now;p.idleCharged=0;}challenge(s);log(s,'Día 1: compite y recoge llaves. Hoy no hay nominaciones.',now);}return s;}
 // Process every elapsed day at its real boundary, never advance early for responses.
 repairNominees223(s,now);let guard=0;while(s.phase!=='finished'&&now>=s.deadline&&guard++<100){botActivity(s,s.deadline);inactivity(s,s.deadline);if(live(s).length<=5){recordDay(s);finish(s,s.deadline);break;}closeDay(s,s.deadline);}
 if(s.phase==='finished')return s;resetActiveChallenge129(s,now);botActivity(s,now);inactivity(s,now);if(live(s).length<=5){recordDay(s);finish(s,now);return s;}repairNominees223(s,now);if(force){closeDay(s,now);return s;}publicDrops(s,now);return s;}
export function act(s,user,input,now=Date.now(),trusted=false){advance(s,now);if(!user?.username)throw Error('Inicia sesión.');let p=s.players.find(p=>key(p)===user.username.toLowerCase());const action=input.action;
 // V336: admin1 expulsa a un jugador de la partida en curso (sin las protecciones de una eliminación normal).
 if(action==='admin_kick'){if(!startAdmin172(user))throw Error('Solo admin1 puede expulsar de la partida.');if(['waiting','finished'].includes(s.phase))throw Error('La partida no está en juego.');const t=s.players.find(x=>key(x)===String(input.target||'').toLowerCase());if(!t||t.status!=='active')throw Error('Ese jugador no sigue en la partida.');adminKick336(s,t,now);advance(s,now);return;}
 if(action==='fill_bots'){
 if(!canFillBots(user))throw Error('Solo admin1 puede completar partidas con bots.');
 if(s.phase!=='waiting')throw Error('Solo puedes llenar una partida en inscripción.');
 let n=1;while(s.players.length<CAPACITY){const username=`Bot · C${s.id} · ${n++}`;if(s.players.some(x=>key(x)===username.toLowerCase()))continue;act(s,{username},{action:'join'},now);const bot=s.players.find(x=>x.username===username);bot.bot=true;bot.botChecks=8+random(17);}
 s.botsAddedBy=user.username;s.botsAddedAt=now;advance(s,now);return;
 }
 if(action==='join'){const enrollment=enrollmentOptions(input);if(p)return;if(s.phase!=='waiting'||s.players.length>=CAPACITY)throw Error('Inscripción cerrada.');p={username:user.username,status:'active',health:70,keys:0,checks:0,apples:0,placement:null,tie:random(0x100000000),packages:[],lastCheckAt:null,performanceTotal:0,performanceDays:0};if(enrollment){p.notifyOnStart=enrollment.notifyOnStart;s.welcomes??=[];s.welcomes.push({username:p.username,body:enrollment.welcome,at:now});}s.players.push(p);log(s,p.username+' se inscribe.',now);advance(s,now);return;}
 if(action==='start'){if(!startAdmin172(user)||s.phase!=='waiting'||s.players.length<(s.practice?6:CAPACITY))throw Error('Solo admin1 puede iniciar cuando estén completas las plazas.');authorizeStart172(s,user,'casting',now);s.startRequested=true;advance(s,now);return;}
 if(action==='advance'){if(!s.practice)throw Error('Los días del Casting real duran 12 horas y no pueden adelantarse.');if(!user.is_admin||['waiting','finished'].includes(s.phase))throw Error('No puedes cerrar este día.');advance(s,now,true);return;}
 if(trusted&&action==='flash_finish'&&p&&s.flashScores[key(p)]&&s.flashAttempts[key(p)]?.token===input.token&&input.round===s.round)return;
 if(!p||p.status!=='active'||['waiting','finished'].includes(s.phase))throw Error('Debes estar activo/a en esta partida.');
 if(action==='activity'){}
 else if(action==='check'){throw Error('Los ticks solo se obtienen con votos verdes de otros jugadores a tus comentarios.');}
 else if(action==='claim_package'){const pack=p.packages.find(x=>x.id===input.packageId);if(!pack)throw Error('Paquete inexistente.');if(pack.claimedAt)return;pack.claimedAt=now;s.ticksPending=true;if(pack.kind==='key')p.keys++;else{p.apples=(p.apples||0)+1;p.health=Math.min(100,p.health+15);}}
 else if(action==='claim_key'){const d=s.keyDrops.find(d=>d.id===input.dropId),slot=Number(input.slot??2);if(!d||!Number.isInteger(slot)||slot<0||slot>4)throw Error('Opción no válida.');if(slot===d.position&&d.claimedBy===key(p)||slot!==d.position&&d.poisonClaims?.[slot]===key(p))return;if(d.claimedBy||now>=d.expiresAt)throw Error('Este aviso ha caducado o ya fue recogido.');if(slot===d.position){d.claimedBy=key(p);d.claimedAt=now;s.ticksPending=true;s.chatVoteCutoffAt=Math.max(Number(s.chatVoteCutoffAt||0),Number(d.at||now));if(d.kind==='apple'){p.apples=(p.apples||0)+1;p.health=Math.min(100,p.health+15);}else p.keys++;log(s,p.username+' recoge '+(d.kind==='apple'?'una manzana (+15 salud).':'una llave.'),now);}else{d.poisonClaims??={};if(d.poisonClaims[slot])throw Error('Este frasco ya fue recogido.');d.poisonClaims[slot]=key(p);p.health=Math.max(0,p.health-15);if(!p.health)eliminate(s,p,now,'veneno');}}
 else if(action==='evict'){if(input.round!==undefined&&input.round!==s.round)throw Error('El día ha cambiado. Abre la votación actual.');if(s.round===1||!s.nominees.length)throw Error('Hoy no hay nominaciones.');if(s.nominees.includes(p.username))throw Error('Los nominados no pueden votar.');const ballot=input.points;if(!ballot||typeof ballot!=='object'||Array.isArray(ballot))throw Error('Asigna los puntos a todos los nominados.');const targets=Object.keys(ballot),values=Object.values(ballot),n=s.nominees.length;if(targets.length!==n||targets.some(n=>!s.nominees.includes(n))||new Set(values).size!==n||values.some(v=>!Number.isInteger(v)||v<1||v>n))throw Error('Utiliza cada valor del 1 al '+n+' una sola vez.');s.ballots[key(p)]={...ballot};}
 else if(action==='flash_start'||action==='flash_finish'){if(!trusted)throw Error('Abre la prueba oficial.');if(input.round!==s.round||input.kind!==s.selectedChallenge)throw Error('La prueba pertenece a otro día.');const k=key(p),a=s.flashAttempts[k];if(action==='flash_start'){if(s.flashScores[k])throw Error('Ya has completado la prueba.');if(!a)s.flashAttempts[k]={token:crypto.randomUUID(),kind:input.kind,round:s.round,startedAt:now,...castingChallengeTime(p,s)};}else{if(!a||input.token!==a.token)throw Error('Intento no válido.');if(s.flashScores[k])return;if(typeof input.points!=='number'||!Number.isFinite(input.points)||input.points<0||input.points>1e9||now-a.startedAt<1000)throw Error('Puntuación no válida.');s.flashScores[k]={points:input.points,savedAt:now,verified:false};s.reactions[k]=-input.points;}}
 else if(action==='whisper'){const target=live(s).find(x=>key(x)===String(input.target).toLowerCase()),body=String(input.message||'').trim();if(!target||target.bot||target===p||!body||body.length>500)throw Error('Elige un participante y escribe entre 1 y 500 caracteres.');if(now-(p.lastWhisperAt||0)<3000)throw Error('Espera tres segundos entre mensajes.');p.lastWhisperAt=now;s.whispers.push({id:crypto.randomUUID(),from:p.username,to:target.username,body,at:now});s.whispers=s.whispers.slice(-1000);}
 else throw Error('Acción no disponible en el Casting diario.');
 if(s.healthRuleVersion!==142){p.lastActiveAt=now;p.idleCharged=0;}advance(s,now);
}
export function challengeResults(s){return live(s).map(p=>({username:p.username,bot:!!p.bot,started:!!s.flashAttempts[key(p)],points:s.flashScores[key(p)]?.points??null,at:s.flashScores[key(p)]?.savedAt??null}));}
export function view(s,user,now=Date.now()){const me=user&&s.players.find(p=>key(p)===user.username.toLowerCase()),k=me&&key(me);const own=me?{...me,packages:me.packages.filter(x=>!x.claimedAt).map(({id,kind,at})=>({id,kind,at})),challengeTime:s.flashAttempts[k]?{base:s.flashAttempts[k].base??100,healthBonus:s.flashAttempts[k].healthBonus??0,checksBonus:s.flashAttempts[k].checksBonus??0,duration:s.flashAttempts[k].duration,checksRank:s.flashAttempts[k].checksRank??null,ruleVersion:129,locked:true}:{...castingChallengeTime(me,s),locked:false},hasReacted:!!s.flashScores[k],hasAttempt:!!s.flashAttempts[k],challengePoints:s.flashScores[k]?.points??null,hasVoted:!!s.ballots[k],myBallot:s.ballots[k]||null}:null;return {id:s.id,rulesVersion:78,challengeRuleVersion:129,challengeResetAt:s.challengeReset129?.at||null,daily:true,practice:!!s.practice,canFillBots:canFillBots(user)&&s.phase==='waiting',canStart:startAdmin172(user)&&s.phase==='waiting'&&s.players.length>=(s.practice?6:CAPACITY),manualStartRequired:true,phase:s.phase,round:s.round,createdAt:s.createdAt,finishedAt:s.finishedAt,startedAt:s.startedAt,startAt:null,deadline:s.deadline,dayStartedAt:s.dayStartedAt,players:s.players.map(p=>({username:p.username,status:p.status,placement:p.placement,bot:!!p.bot})),nominees:[...s.nominees],events:s.events,eliminations:s.eliminations,winner:s.winner,finalStandings:s.finalStandings||null,me:own,user:user?{username:user.username,is_admin:!!user.is_admin}:null,challenge:s.selectedChallenge,challengeResults:challengeResults(s),challengeHistory:(s.challengeHistory||[]).map(day=>({...day,results:day.results.filter(r=>live(s).some(p=>key(p)===r.username.toLowerCase()))})),scoringMode:s.scoringMode,counts:{active:live(s).length,reactions:Object.keys(s.flashScores).length,ballots:Object.keys(s.ballots).length},capacity:CAPACITY,now,whispers:me?s.whispers.filter(w=>w.from.toLowerCase()===k||w.to.toLowerCase()===k):[],healthPolicy:{initial:70,idleGraceMinutes:60,lossPer30Minutes:1,chatRecoveryPerUpdate:1,version:142,chatOnly:true},weights:{policy:'keys-first',keys:'primary',apples:1,checks:1,challenge:'tie-break'}};}
