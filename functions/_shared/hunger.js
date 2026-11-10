import {enforceHunger187} from './hunger-gate187.js';
import {validStart172,authorizeStart172} from './manual-start172.js';
import {GAME_PRIZES} from '../../prize-catalog.js';
import {BASE_CHALLENGE_SECONDS} from './challenge-time.js';
import {canFillBots} from './game-bots.js';
import {isHungerAlive} from './hunger-life.js';
import {CASTING_MINIGAMES} from '../../minigame-catalog.js';
import {enrollmentOptions} from './enrollment.js';
import {VASALLAJE_PRIZES,isVasallaje,targetInterval,fog,finalActive,tick as vasallajeTick,eventView,nextDay as vasallajeNextDay,canShootSelf,canGhostShoot} from './hunger-vasallaje320.js';
// Authoritative Hunger arena. Publicly observed mechanics; original competition implementation.
export const CAPACITY=30, LOBBY_MS=86400000, TICK_MS=60000, FIGHT_MS=21600000;
export const TARGET_INTERVAL_MS=1200000, MAX_ACTIVE_TARGETS=20, WEAPON_FIRST_DELAY_MS=1800000, WEAPON_INTERVAL_MS=2700000;
export const WEAPONS={knife:{name:'Cuchillo',bonus:1,time:60000},axe:{name:'Hacha',bonus:2,time:60000},mace:{name:'Maza',bonus:3,time:180000},sword:{name:'Espada',bonus:4,time:300000}};
export const PRIZES=GAME_PRIZES.hunger;
export function editionPrizes176(edition){if(isVasallaje({edition}))return VASALLAJE_PRIZES.map(x=>[...x]);const multiplier=Number(edition)===4?2:1;return PRIZES.map(([karma,money])=>[karma*multiplier,money*multiplier]);}
export const WIKI_RULES_VERSION=77,BUSH_CYCLE_MS=10800000,WOLF_CYCLE_MS=21600000,WOLF_DURATION_MS=600000;
export const isWiki=s=>s.rulesVersion>=WIKI_RULES_VERSION;
export function wolfActive(s,at){if(!isWiki(s)||!s.startedAt)return false;const elapsed=at-s.startedAt;return elapsed>=WOLF_CYCLE_MS&&elapsed%WOLF_CYCLE_MS<WOLF_DURATION_MS;}
const sponsorCost=(s,id)=>{const n=s.sponsors.filter(x=>x.target===id).length;return isWiki(s)?n===0?15:n===1?50:100:100;};
const rounded=n=>Math.round(n*100)/100;
export function fresh(now=Date.now(),edition=1){const seed=crypto.getRandomValues(new Uint32Array(1))[0];const a=seed%8,b=(a+1+(seed>>>8)%7)%8;return {version:40,xpRuleVersion:86,rulesVersion:WIKI_RULES_VERSION,edition,phase:'waiting',createdAt:now,startAt:null,manualStartVersion:172,tickAt:null,players:[],events:[],fights:[],drops:[],bushes:[a,b],food:100,foodDay:0,foodStage:0,sponsors:[],ops:[],winner:null,seed,nextDropAt:null,nextBonusAt:null,targetScheduleVersion:202,bonuses:[]};}
function log(s,text,at,extra={}){s.events.unshift({text,at,...extra});s.events=s.events.slice(0,300);}
const alive=s=>s.players.filter(isHungerAlive);
const fighting=(s,p)=>s.fights.find(f=>!f.endedAt&&(f.attacker===p.id||f.defender===p.id));
const get=(s,id)=>s.players.find(p=>p.id===id);
const inCorn=s=>alive(s).filter(p=>p.location==='cornucopia');
const randomDefault=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
// Apply the first-opponent rule to saved editions without replaying combat outcomes.
export function reconcileExperience(s){
 if(s.xpRuleVersion>=86)return;
 const completed=(s.fights||[]).filter(f=>f.endedAt).slice().sort((a,b)=>(a.startedAt||a.endedAt)-(b.startedAt||b.endedAt));
 const previous=new Map((s.players||[]).map(p=>[p.id,p.experience||0])),awarded=new Map();
 for(const f of completed){if(!f.winner)continue;const recorded=f.experienceGain?.[f.winner],gain=Number.isFinite(recorded)?recorded:f.reason==='run'?0:f.winner===f.attacker?2:1;awarded.set(f.winner,(awarded.get(f.winner)||0)+gain);}
 const totals=new Map((s.players||[]).map(p=>[p.id,Math.max(0,(p.experience||0)-(awarded.get(p.id)||0))])),seen=new Set();
 for(const f of completed){const key=[f.attacker,f.defender].sort((a,b)=>a-b).join(':'),repeat=seen.has(key);seen.add(key);const gain=f.winner&&f.reason!=='run'&&!repeat?(f.winner===f.attacker?2:1):0;
  if(!f.xpBefore86)f.xpBefore86={gain:{...(f.experienceGain||{})},after:{...(f.experienceAfter||{})}};
  f.experienceGain={};f.experienceAfter={};if(f.winner)totals.set(f.winner,(totals.get(f.winner)||0)+gain);
  for(const id of [f.attacker,f.defender]){f.experienceGain[id]=id===f.winner?gain:0;f.experienceAfter[id]=totals.get(id)||0;}
 }
 for(const p of s.players||[])p.experience=totals.get(p.id)||0;
 for(const f of s.fights||[])if(!f.endedAt)for(const id of [f.attacker,f.defender])if(f.stats?.[id])f.stats[id].experience=totals.get(id)||0;
 s.xpCorrection86=(s.players||[]).filter(p=>previous.get(p.id)!==p.experience).map(p=>({id:p.id,before:previous.get(p.id),after:p.experience}));s.xpRuleVersion=86;
}
export function upgrade(s,now){if(s.version===40){
 if(!Number.isInteger(s.rulesVersion))s.rulesVersion=76;
 reconcileExperience(s);
 // Compatibilidad con participantes y arenas creados antes de introducir los arbustos.
 for(const p of s.players||[])if(p.search===undefined)p.search=null;
 if(!Array.isArray(s.bushes)||s.bushes.length!==2){const seed=Number(s.seed)||0;const a=Math.abs(seed)%8;s.bushes=[a,(a+1+((seed>>>8)%7))%8];}
 if(!Number.isInteger(s.foodDay))s.foodDay=0;if(!Number.isInteger(s.foodStage))s.foodStage=0;if(s.foodStage===0&&s.food<=0){s.foodStage=1;s.food=300;}if(!Array.isArray(s.bonuses))s.bonuses=[];
 // La arena puede proceder de versiones que deshabilitaban los arbustos al reconstruir la vista.
 for(const p of s.players||[])if(p.search===undefined||p.search===false)p.search=null;
 if(s.startedAt&&Number.isFinite(s.nextDropAt)&&s.nextDropAt<s.startedAt+WEAPON_FIRST_DELAY_MS)s.nextDropAt=s.startedAt+WEAPON_FIRST_DELAY_MS;
 if(s.phase==='active'&&s.targetScheduleVersion!==202){s.targetScheduleVersion=202;s.nextBonusAt=now+TARGET_INTERVAL_MS;}
 for(const f of s.fights||[])if(!f.mode&&!f.endedAt&&now<f.endsAt){const pool=Object.keys(CASTING_MINIGAMES),index=[...String(f.id)].reduce((n,c)=>n+c.charCodeAt(0),s.seed||0)%pool.length;f.previousCompetition={runs:f.runs,questions:f.questions};f.mode='flash-v1';f.kind=pool[index];f.runs={};delete f.questions;f.endsAt=Math.max(f.endsAt,now+120000);log(s,'El combate se ha actualizado a '+CASTING_MINIGAMES[f.kind]+'. Ambos rivales deben jugar de nuevo; la prueba anterior se conserva en el historial interno.',now,{kind:'fight-update',fight:f.id});}return s;}const n=fresh(s.createdAt||now,s.edition);Object.assign(n,{phase:s.phase,winner:s.winner,events:s.events||[],players:s.players.map(p=>({...p,health:s.phase==='waiting'?70:p.health,arrows:p.arrows||0,weapon:null,uses:0,experience:0,search:null,collect:null,passiveDay:0,passiveCount:0})),startAt:s.phase==='waiting'?Math.max(now,(s.createdAt||now)+LOBBY_MS):s.startAt,tickAt:now,startedAt:s.startedAt||s.tickAt||now,nextDropAt:now+60000});Object.assign(s,n);return s;}
function enter(s,p){if(p.location!=='cornucopia'&&inCorn(s).length>=10)throw Error('La Cornucopia tiene sus diez plazas ocupadas.');p.location='cornucopia';}
function eliminate(s,p,at,by,cause){if(!p||p.eliminatedAt)return;p.placement=alive(s).filter(x=>x!==p).length+1;delete p.arrowDeathPending;p.collect=null;p.eliminatedAt=at;p.eliminatedBy=by||null;p.deathCause=cause;settleEditionFourPrizes178(s);log(s,`${p.username} queda en el puesto ${p.placement}.`,at,{kind:'death',target:p.id,actor:by||null,cause});if(by){const killer=get(s,by);if(killer)killer.kills++;}const f=fighting(s,p);if(f){const survivor=get(s,p.id===f.attacker?f.defender:f.attacker);const arrowWin=cause==='arrow'&&by===survivor?.id&&survivor?.health>0;if(arrowWin)f.arrowVictory=true;closeFight(s,f,at,arrowWin||(isWiki(s)&&survivor?.health>0&&f.runs[survivor.id]?.saved)?survivor.id:null,'elimination');}}
function settleArrowDeaths(s,at){for(const p of s.players){if(!p.arrowDeathPending)continue;if(p.health>0){delete p.arrowDeathPending;continue;}if(p.location!=='cornucopia'||s.food<0.1){const by=p.arrowDeathPending.by;eliminate(s,p,at,by,'arrow');}}}
// V294: quien guarda su desafío de combate y sigue en la Cornucopia con comida
// recupera 0,1 por minuto, igual que quien solo come. Antes recibía 0,01. Una sola
// vez se abona la diferencia (0,09 por minuto) a los combates de Hunger #8 que
// estaban abiertos al publicarse, desde que cada jugador guardó hasta el último minuto calculado.
const SAVED_FOOD_FIX294={8:['8-42','8-43']};
export function repairSavedFightFood294(s){
 if(s.savedFood294||!SAVED_FOOD_FIX294[s.edition]||!Number.isFinite(s.startedAt)||!Number.isFinite(s.tickAt))return;
 s.savedFood294={at:s.tickAt,changes:[]};
 for(const id of SAVED_FOOD_FIX294[s.edition]){const f=s.fights.find(x=>x.id===id);if(!f)continue;
  for(const [pid,run] of Object.entries(f.runs||{})){const p=get(s,Number(pid));if(!p||!run?.saved||!Number.isFinite(run.recordedAt)||!isHungerAlive(p)||p.location!=='cornucopia')continue;
   const until=Math.min(s.tickAt,f.endedAt??Infinity),minutes=Math.max(0,Math.floor((until-s.startedAt)/TICK_MS)-Math.floor((run.recordedAt-s.startedAt)/TICK_MS));
   const before=p.health,after=rounded(Math.min(100,before+minutes*0.09));p.health=after;
   s.savedFood294.changes.push({fight:id,player:p.id,username:p.username,savedAt:run.recordedAt,until,minutes,before,after});}}
}
function hurt(s,p,n,at,by,cause='survival'){if(!p||p.health<=0)return 0;const protected216=['arrow','poison'].includes(cause)&&p.location==='cornucopia'&&s.food>=0.1&&!!fighting(s,p)?.runs[p.id]?.saved;const amount=Math.min(Math.max(0,p.health-(protected216?0.01:0)),Math.max(0,n));p.health=rounded(p.health-amount);if(!p.health){if(cause==='arrow'&&p.location==='cornucopia'&&s.food>=0.1&&!p.collect&&!fighting(s,p)){p.arrowDeathPending={by:by||null,at};}else eliminate(s,p,at,by,cause);}return amount;}

export function settleEditionFourPrizes178(s){
 if(!['active','finished'].includes(s.phase))return;
 for(const p of s.players){
  const prize=editionPrizes176(s.edition)[p.placement-1];if(!prize||p.bot||Number(p.id)<=0)continue;
  const key=`hunger:${s.edition}:prize:${p.id}`;s.ops??=[];
  if(!s.ops.some(op=>op.key===key))s.ops.push({key,user:p.id,money:prize[1],karma:prize[0]});
  p.prize={karma:prize[0],money:prize[1]};
 }
}
function finish(s,now){if(s.phase!=='active'||alive(s).length>1)return;s.phase='finished';s.finishedAt=now;const winner=alive(s)[0];if(winner){winner.placement=1;s.winner=winner.username;s.winnerId=winner.id;}s.prizePolicy='full110';for(const p of s.players){const prize=editionPrizes176(s.edition)[p.placement-1];if(prize&&!p.bot){p.prize={karma:prize[0],money:prize[1]};if(!s.ops.some(op=>op.key===`hunger:${s.edition}:prize:${p.id}`))s.ops.push({key:`hunger:${s.edition}:prize:${p.id}`,user:p.id,money:p.prize.money,karma:p.prize.karma});}}if(isWiki(s)&&winner&&!winner.bot)s.ops.push({key:`hunger:${s.edition}:winner-tickets:${winner.id}`,user:winner.id,money:0,karma:0,tickets:5});log(s,winner?`${winner.username} gana Hunger Games.`:'La arena termina sin supervivientes.',now);}
function repeatedOpponent(s,f){return s.fights.some(x=>x!==f&&x.endedAt&&((x.attacker===f.attacker&&x.defender===f.defender)||(x.attacker===f.defender&&x.defender===f.attacker)));}
function closeFight(s,f,now,winnerId,reason){if(f.endedAt)return;f.endedAt=now;f.winner=winnerId;f.reason=reason;const a=get(s,f.attacker),b=get(s,f.defender);for(const p of [a,b])if(p){p.location='forest';p.collect=null;if(['scores','bot','timeout'].includes(reason)&&(f.runs[p.id]?.saved||(reason==='bot'&&p.bot))&&p.uses>0){p.uses--;if(!p.uses)p.weapon=null;}}
 f.experienceGain={};f.experienceAfter={};f.adjustedScores={};f.scoreBonuses={};for(const contestant of [a,b])if(contestant&&f.runs[contestant.id]?.saved){const raw=f.runs[contestant.id].score||0;const total=adjusted(s,f,contestant);f.adjustedScores[contestant.id]=total;f.scoreBonuses[contestant.id]=Math.round((total-raw)*10)/10;}
 if(winnerId){const w=get(s,winnerId),l=winnerId===a.id?b:a;const amount=reason==='run'?rounded(f.stake/3):f.stake;const taken=hurt(s,l,amount,now,w.id,'fight')||0;f.damage=taken;w.health=rounded(Math.min(100,w.health+taken));const repeated=repeatedOpponent(s,f);const gained=(reason==='run'||repeated?0:(w.id===f.attacker?2:1))*(f.champion320?2:1);w.experience=(w.experience||0)+gained;f.experienceGain[w.id]=gained;if(isWiki(s)&&l.health<=0&&!w.weapon&&l.weapon&&l.uses>0){w.weapon=l.weapon;w.uses=l.uses;l.weapon=null;l.uses=0;f.loot={user:w.id,weapon:w.weapon,uses:w.uses};}log(s,`${w.username} gana el combate contra ${l.username}. ${taken} de salud transferida${reason==='run'?' por huida':''}.`,now,{kind:'fight',fight:f.id,actor:w.id,target:l.id,damage:taken});}else log(s,'Combate terminado sin vencedor ni daño.',now,{kind:'fight',fight:f.id});
 for(const p of [a,b])if(p){f.experienceGain[p.id]??=0;f.experienceAfter[p.id]=p.experience||0;}}

// Quien ataca juega con 1,5 de experiencia extra en ese combate (no se suma a su experiencia real).
export const ATTACKER_XP=1.5;
// V295: la diferencia de salud ya no da bonificación; solo cuentan experiencia, arma y la ventaja del atacante.
function adjusted(s,f,p){const snap=f.stats[p.id];return Math.round((f.runs[p.id]?.score||0)*(1+0.02*((snap.experience||0)+(snap.bonus||0)+(p.id===f.attacker?ATTACKER_XP:0)))*10)/10;}
function resolve(s,f,now){if(f.endedAt)return;const a=get(s,f.attacker),b=get(s,f.defender);if(!a.health||!b.health){closeFight(s,f,now,null,'elimination');return;}const ar=f.runs[a.id],br=f.runs[b.id];if((a.bot&&br?.saved)||(b.bot&&ar?.saved)){closeFight(s,f,now,a.bot?b.id:a.id,'bot');return;}if(ar?.saved&&br?.saved){const av=adjusted(s,f,a),bv=adjusted(s,f,b);closeFight(s,f,now,av===bv?(isWiki(s)?a.id:null):av>bv?a.id:b.id,'scores');}else if(now>=f.endsAt){closeFight(s,f,now,ar?.saved?a.id:br?.saved?b.id:null,'timeout');}}
export function player187(id,username,bot=false){return {id,username,bot,health:70,arrows:0,weapon:null,uses:0,experience:0,kills:0,location:'forest',placement:null,search:null,collect:null,passiveDay:0,passiveCount:0,lastShot:0};}
// One explicitly requested guest for the already-running second edition only.
export const arenaCapacity=s=>s.edition===3&&s.specialEntry152?32:((s.edition===2&&s.specialEntry125)||(s.edition===3&&s.specialEntry149))?31:CAPACITY;
export function addSpecialGuest125(s,user,now=Date.now()){
 if(s.edition!==2||s.phase!=='active'||s.specialEntry125||!user||String(user.username).toLowerCase()!=='mdma'||user.is_system||user.is_banned||!Number.isSafeInteger(user.id)||user.id<=0)return false;
 if(s.players.some(p=>p.id===user.id||p.username.toLowerCase()==='mdma')||s.players.length!==30)return false;
 const guest=player187(user.id,user.username);guest.arrows=10;guest.joinedAt=now;
 // All prior eliminations keep their relative order after the extra entrant.
 for(const p of s.players)if(Number.isInteger(p.placement)&&p.placement>0)p.placement++;
 s.players.push(guest);s.specialEntry125={userId:user.id,at:now,capacity:31};
 return true;
}
// Explicit extra guest authorized for edition 3; never carried into future editions.
export function addSpecialGuest149(s,user,now=Date.now()){
 if(s.edition!==3||s.phase!=='active'||s.specialEntry149||!user||String(user.username).toLowerCase()!=='mdma'||user.is_system||user.is_banned||!Number.isSafeInteger(user.id)||user.id<=0)return false;
 if(s.players.some(p=>p.id===user.id||p.username.toLowerCase()==='mdma')||s.players.length!==30)return false;
 const guest=player187(user.id,user.username);guest.arrows=10;guest.joinedAt=now;
 for(const p of s.players)if(Number.isInteger(p.placement)&&p.placement>0)p.placement++;
 s.players.push(guest);s.specialEntry149={userId:user.id,at:now,capacity:31};return true;
}
// Single authorized 32nd entrant, for edition 3 only. No new account or charge.
export function addSpecialGuest152(s,user,now=Date.now()){
 if(s.edition!==3||s.phase!=='active'||s.specialEntry152||!s.specialEntry149||s.players.length!==31||!user||String(user.username).toLowerCase()!=='paucubarsi'||user.is_system||user.is_banned||!Number.isSafeInteger(user.id)||user.id<=0)return false;
 if(s.players.some(p=>p.id===user.id||p.username.toLowerCase()==='paucubarsi'))return false;
 const guest=player187(user.id,user.username);guest.arrows=10;guest.joinedAt=now;
 for(const p of s.players)if(Number.isInteger(p.placement)&&p.placement>0)p.placement++;
 s.players.push(guest);s.specialEntry152={userId:user.id,at:now,capacity:32};return true;
}
export function reopenEditionFour161(s,now=Date.now()){
 if(s.edition!==4||s.reopening161||!['waiting','active','finished'].includes(s.phase))return false;
 const names=new Set(['peach','lamine','cristi','paucubarsi']);
 const retained=s.players.filter(p=>!p.bot&&p.id>0&&names.has(p.username.toLowerCase()));
 // Keep a complete private rollback snapshot, including ledger operations and receipts.
 const previous=structuredClone(s),n=fresh(now,4);
 n.players=retained.map(p=>({...player187(p.id,p.username),...(typeof p.notifyOnStart==='boolean'?{notifyOnStart:p.notifyOnStart}:{}),joinedAt:p.joinedAt||s.createdAt}));
 n.ops=s.ops||[];n.receipts=s.receipts||[];
 n.welcomes=(s.welcomes||[]).filter(w=>names.has(w.username.toLowerCase()));
 n.reopening161={at:now,retained:retained.map(p=>p.username),previous};
 for(const k of Object.keys(s))delete s[k];Object.assign(s,n);
 log(s,'Hunger Games 4 reiniciado: inscripciones abiertas. Peach, Lamine, Cristi y PauCubarsi conservan sus plazas. Solo admin1 puede iniciar.',now);
 return true;
}
export function advance(s,now=Date.now(),random=randomDefault){if(s.manualStartVersion!==172)reopenEditionFour161(s,now);upgrade(s,now);restorePau216(s,now);restorePauFight218(s,now);if(s.manualGate187)enforceHunger187(s);settleEditionFourPrizes178(s);
 // Freeze the reported automatic start once, keeping all inventory, fights and ledger entries.
 if(s.edition===4&&s.phase==='active'&&!s.manualStart160&&!s.manualPause160){s.manualPause160={at:now,clockAt:s.tickAt||now};s.phase='waiting';log(s,'Edición pausada: debe iniciarla admin1.',now);}
 if(s.phase==='waiting'&&!validStart172(s,'hunger')){s.startAt=null;delete s.manualStart160;return s;}
 if(s.phase==='waiting'&&validStart172(s,'hunger')){
 for(const p of s.players){p.location='forest';p.collect=null;}s.phase='active';s.startedAt=s.manualStart172.at;s.startAt=s.startedAt;s.tickAt=s.startedAt;if(isWiki(s)){for(const p of s.players)p.arrows=10;s.bushCycle=0;}s.nextDropAt=s.startedAt+WEAPON_FIRST_DELAY_MS;log(s,'¡Comienza Hunger Games!',s.startedAt);
 }
 if(s.phase!=='active')return s;settleArrowDeaths(s,now);finish(s,now);if(s.phase!=='active')return s;
 if(Number.isFinite(s.startedAt)){const cycle=Math.max(0,Math.floor((now-s.startedAt)/BUSH_CYCLE_MS));if(s.bushRuleVersion!==87||s.bushCycle!==cycle){s.bushRuleVersion=87;s.bushCycle=cycle;const seed=((s.seed||0)+cycle*113)>>>0,a=seed%8;s.bushes=[a,(a+1+(seed>>>8)%7)%8];for(const p of s.players)p.search=null;if(cycle>0)log(s,'El bosque se renueva. Puedes volver a buscar en un arbusto.',now,{kind:'forest-reset'});}}
 s.bonuses??=[]; if(!Number.isFinite(s.nextBonusAt))s.nextBonusAt=now+TARGET_INTERVAL_MS;
 // Do not replay a backlog of targets when the arena has not been polled.
 if(s.nextBonusAt<now-TICK_MS)s.nextBonusAt=now;
 repairSavedFightFood294(s);
 const end=Math.min(now,s.tickAt+TICK_MS*10080);
 while(s.tickAt+TICK_MS<=end&&s.phase==='active'){
 s.tickAt+=TICK_MS;const at=s.tickAt,minute=Math.floor((at-s.startedAt)/TICK_MS);if(isWiki(s)&&at-s.startedAt>=WOLF_CYCLE_MS){const position=(at-s.startedAt)%WOLF_CYCLE_MS;if(position===0)log(s,'Comienza el Modo Lobo: la pérdida pasiva de salud se duplica durante diez minutos.',at,{kind:'wolf-start'});else if(position===WOLF_DURATION_MS)log(s,'Termina el Modo Lobo.',at,{kind:'wolf-end'});}
 // A fresh 100-portion chicken every game day; after depletion one final 300-portion refill.
 const foodDay=Math.floor((at-s.startedAt)/LOBBY_MS);
 if(s.foodDay!==foodDay){s.foodDay=foodDay;s.foodStage=0;s.food=100;}
 if(s.foodStage===0&&s.food<=0){s.food=300;s.foodStage=1;log(s,'Se ha agotado la primera reserva de comida. Aparece la segunda reserva de 300.',at,{kind:'food-refill'});}

 for(const f of s.fights)resolve(s,f,at);
 for(const p of alive(s)){
 if(alive(s).length<=1)break;if(!isHungerAlive(p)||p.recovered216At>at)continue;const f=fighting(s,p),saved=f?.runs[p.id]?.saved;
 if(p.collect&&at>=p.collect.readyAt){const type=p.collect.type;if(p.weapon===type)p.uses+=2;else{p.weapon=type;p.uses=2;}p.collect=null;log(s,`${p.username} recoge ${WEAPONS[type].name}.`,at,{kind:'weapon',actor:p.id,weapon:type,phase:'collected'});}
 const supplied=p.location==='cornucopia'&&s.food>=0.1&&(!f||saved);
 if(supplied){const gain=Math.min(0.1,100-p.health);p.health=rounded(p.health+gain);s.food=rounded(Math.max(0,s.food-0.1));if(p.health>0)delete p.arrowDeathPending;if(s.food<0.1)settleArrowDeaths(s,at);
 if(s.food<=0&&s.foodStage===0){s.food=300;s.foodStage=1;log(s,'Se ha agotado la primera reserva de comida. Aparece la segunda reserva de 300.',at,{kind:'food-refill'});}
 else if(s.food===0&&s.foodStage===1)s.foodStage=2;
 }else if(!saved&&minute%2===0)hurt(s,p,(wolfActive(s,at)?0.2:0.1)*(p.location==='forest'&&fog(s,at)?2:1),at);
 const day=Math.floor((at-s.startedAt)/LOBBY_MS);if(p.passiveDay!==day){p.passiveDay=day;p.passiveCount=0;}
 if(p.health>0&&p.location==='cornucopia'&&(!f||saved)&&minute%25===0){p.arrows++;p.passiveCount++;}
 if(p.bot&&p.health>0&&!f){if(p.location==='forest'&&inCorn(s).length<10&&random()<0.02)p.location='cornucopia';else if(p.location==='cornucopia'&&random()<0.01)p.location='forest';if(random()<0.003){const target=inCorn(s).find(x=>x.id!==p.id&&!fighting(s,x));if(target){try{challenge(s,p,target,at,random);}catch{}}}}
 }
 s.drops=s.drops.filter(d=>d.expiresAt>at);
 if(at>=s.nextBonusAt){
  // Hasta veinte dianas activas simultáneas. Permanecen en el chat hasta que
  // alguien las reclame, no se eliminan al aparecer otra diana.
  const available=s.bonuses.filter(b=>b.kind==='target'&&b.claimedBy==null&&b.expiresAt>at).length;
  if(available<MAX_ACTIVE_TARGETS){
   const kind='target';const bonus={id:`bonus-${s.edition}-${at}`,kind,expiresAt:at+86400000,claimedBy:null};
   s.bonuses.push(bonus);
   log(s,'¡Diana disponible! Pulsa para conseguir 3 flechas.',at,{kind:'bonus',bonusId:bonus.id,bonusKind:kind,expiresAt:bonus.expiresAt});
  }
  // Conservar las recompensas pendientes; depurar únicamente las consumidas/caducadas.
  s.bonuses=s.bonuses.filter(b=>b.claimedBy==null&&b.expiresAt>at).concat(s.bonuses.filter(b=>b.claimedBy!=null).slice(-20));
  s.nextBonusAt=at+targetInterval(s,at,TARGET_INTERVAL_MS);
 }
 if(at>=s.nextDropAt){if(s.drops.length<3){const types=Object.keys(WEAPONS),type=types[Math.floor(random()*4)];s.drops.push({id:`${s.edition}-${at}`,type,expiresAt:at+1800000});}s.nextDropAt=at+WEAPON_INTERVAL_MS;}
 vasallajeTick(s,at,{alive:()=>alive(s),log:(text,when,extra)=>log(s,text,when,extra),weapons:WEAPONS});
 finish(s,at);
 }
 for(const p of alive(s))if(p.collect&&now>=p.collect.readyAt){const type=p.collect.type;p.uses=p.weapon===type?p.uses+2:2;p.weapon=type;p.collect=null;log(s,`${p.username} recoge ${WEAPONS[type].name}.`,now,{kind:'weapon',actor:p.id,weapon:type,phase:'collected'});}
 for(const f of s.fights)resolve(s,f,now);settleArrowDeaths(s,now);finish(s,now);return s;
}
function challenge(s,p,t,now,random){if(p.health<=0)throw Error('Recupera salud antes de iniciar un combate.');if(!t||t.id===p.id||t.health<=0||t.location!=='cornucopia')throw Error('Elige un rival vivo y visible en la Cornucopia.');if(fighting(s,p)||fighting(s,t))throw Error('Uno de los jugadores ya está en un combate.');if(isWiki(s)&&p.location!=='cornucopia'&&inCorn(s).length>=10){const displaced=inCorn(s).find(x=>x.id!==t.id&&!fighting(s,x));if(!displaced)throw Error('Todos los puestos libres de combate están ocupados.');displaced.location='forest';displaced.collect=null;log(s,`${displaced.username} vuelve al bosque al comenzar un ataque.`,now,{kind:'hide',actor:displaced.id});}enter(s,p);p.collect=t.collect=null;
 const stats={};for(const x of [p,t])stats[x.id]={health:x.health,experience:x.experience,weapon:x.uses>0?x.weapon:null,bonus:x.uses>0?WEAPONS[x.weapon]?.bonus||0:0};
 if(!s.fightGameBag?.length){s.fightGameBag=Object.keys(CASTING_MINIGAMES);for(let i=s.fightGameBag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[s.fightGameBag[i],s.fightGameBag[j]]=[s.fightGameBag[j],s.fightGameBag[i]];}if(s.fightGameBag[0]===s.lastFightKind)[s.fightGameBag[0],s.fightGameBag[1]]=[s.fightGameBag[1],s.fightGameBag[0]];}
 const kind=s.fightGameBag.shift();s.lastFightKind=kind;
 const f={id:`${s.edition}-${s.fights.length+1}`,mode:'flash-v1',kind,attacker:p.id,defender:t.id,startedAt:now,endsAt:now+(isWiki(s)?28800000:FIGHT_MS),stake:Math.min(finalActive(s,alive(s).length,now)?60:30,p.health),stats,runs:{}};if(finalActive(s,alive(s).length,now))f.champion320=true;s.fights.push(f);log(s,`${p.username} reta a ${t.username}.`,now,{kind:'challenge',fight:f.id,actor:p.id,target:t.id});}
export function act(s,user,input,now=Date.now(),random=randomDefault,trustedFlash=false){advance(s,now,random);const action=input.action,p=get(s,user.id);
 if(action==='fill_bots'){
 if(!canFillBots(user))throw Error('Solo admin1 puede completar partidas con bots.');
 if(s.phase!=='waiting')throw Error('Solo puedes llenar una partida en inscripción.');
 if(s.manualPause160)throw Error('La edición está pausada. Pulsa Reanudar con admin1.');
 let n=1;while(s.players.length<CAPACITY){const id=-(s.edition*100+n);if(s.players.some(p=>p.id===id)){n++;continue;}s.players.push(player187(id,`Tributo_${String(n++).padStart(2,'0')}`,true));}
 s.botsAddedBy=user.username;s.botsAddedAt=now;log(s,'Plazas completadas. Esperando a que admin1 pulse Iniciar.',now);return;
 }
 if(action==='admin_kick'){if(!canFillBots(user))throw Error('Solo admin1 puede expulsar de la partida.');if(s.phase!=='active')throw Error('La partida no está en juego.');const t=s.players.find(x=>String(x.username).toLowerCase()===String(input.target||'').toLowerCase());if(!t||!isHungerAlive(t))throw Error('Ese jugador no sigue vivo en la partida.');t.health=0;delete t.arrowDeathPending;t.collect=null;eliminate(s,t,now,null,'admin');finish(s,now);return;}
 if(action==='event_next_day'){if(!canFillBots(user))throw Error('Solo admin1 puede cambiar el día del evento.');vasallajeNextDay(s,now,(text,when,extra)=>log(s,text,when,extra));return;}
 if(action==='join'){const enrollment=enrollmentOptions(input);if(s.phase!=='waiting'||s.manualPause160)throw Error('Inscripción cerrada.');if(p)throw Error('Ya estás inscrito/a.');if(s.players.length>=CAPACITY)throw Error('No quedan plazas.');if(user.is_system||user.is_banned)throw Error('Esta cuenta no puede participar.');const newcomer=player187(user.id,user.username);if(enrollment){newcomer.notifyOnStart=enrollment.notifyOnStart;s.welcomes??=[];s.welcomes.push({username:user.username,body:enrollment.welcome,at:now});}s.players.push(newcomer);s.ops.push({key:`hunger:${s.edition}:entry:${user.id}`,user:user.id,money:-20,karma:0});advance(s,now,random);return;}
 if(action==='next'){if(!canFillBots(user))throw Error('Solo admin1 puede abrir la siguiente edición.');if(s.manualGate187&&input.runId!==(s.runId||null))throw Error('La arena ha cambiado. Actualiza la página.');if(s.phase!=='finished')throw Error('La partida no ha terminado.');const next=fresh(now,s.edition+1);next.manualOpened187={by:'admin1',at:now,parentRun:s.runId||null};next.manualGate187=true;next.runId=crypto.randomUUID();next.receipts=[];for(const name of Object.keys(s))delete s[name];Object.assign(s,next);return;}
 if(action==='start'){
 if(s.manualGate187&&input.runId!==(s.runId||null))throw Error('La arena ha cambiado. Actualiza la página.');
 if(!canFillBots(user)||s.phase!=='waiting'||s.players.length<2)throw Error('Solo admin1 puede iniciar Hunger con al menos dos participantes.');
 authorizeStart172(s,user,'hunger',now);s.manualStart160={by:user.username,at:now,edition:s.edition};
 if(s.manualPause160){
  const delay=Math.max(0,now-s.manualPause160.clockAt);
  const shift=o=>{for(const [k,v] of Object.entries(o)){if(v&&typeof v==='object')shift(v);else if(typeof v==='number'&&v>0&&(/At$/.test(k)||k==='at'||k==='lastShot')&&!['createdAt','joinedAt'].includes(k))o[k]=v+delay;}};
  // Shift gameplay deadlines only; financial and recovery audit records are immutable.
  for(const k of ['startedAt','tickAt','nextDropAt','nextBonusAt'])if(Number.isFinite(s[k]))s[k]+=delay;
  for(const k of ['players','fights','drops','bonuses'])shift(s[k]||[]);
  s.manualResume160={at:now,pausedAt:s.manualPause160.at};delete s.manualPause160;s.phase='active';log(s,'admin1 reanuda Hunger Games.',now);return;
 }
 s.startAt=now;advance(s,now,random);return;
 }
 if(action==='sponsor'){if(s.phase!=='active'||p)throw Error('Solo personas ajenas al reparto pueden patrocinar.');if(s.sponsors.length>=10)throw Error('Se han agotado los patrocinios de esta partida.');const target=get(s,Number(input.target));if(!isHungerAlive(target))throw Error('Elige un superviviente.');const cost=sponsorCost(s,target.id);if(isWiki(s)&&!input.useTicket&&input.expectedPrice!==undefined&&input.expectedPrice!==cost)throw Error('El precio de patrocinio ha cambiado. Vuelve a consultar el regalo.');if(!['health','arrows'].includes(input.gift))throw Error('Regalo inválido.');if(input.gift==='health'){if(target.health>=100)throw Error('Tiene la salud completa.');target.health=rounded(Math.min(100,target.health+10));delete target.arrowDeathPending;}else{const amount=isWiki(s)?5:3;target.arrows+=amount;}if(input.useTicket!==undefined&&typeof input.useTicket!=='boolean')throw Error('Selección de ticket no válida.');if(input.useTicket&&!isWiki(s))throw Error('Esta edición no utiliza tickets.');const useTicket=!!input.useTicket;const key=`hunger:${s.edition}:sponsor:${s.sponsors.length+1}`;s.sponsors.push({user:user.id,username:user.username,target:target.id,gift:input.gift,at:now,cost:useTicket?0:cost,ticket:useTicket});s.ops.push({key,user:user.id,money:useTicket?0:-cost,karma:0,...(useTicket?{tickets:-1}:{})});log(s,`${user.username} patrocina a ${target.username}: ${input.gift==='health'?'salud':'flechas'}.`,now);return;}
 if(action==='shoot'&&p&&!isHungerAlive(p)&&canGhostShoot(s,p)){const target=get(s,Number(input.target));if(!isHungerAlive(target)||target.id===p.id)throw Error('Objetivo inválido.');if(now-p.lastShot<1000)throw Error('Espera un segundo entre disparos.');p.arrows--;p.lastShot=now;const roll=random();const amount=roll>=0.95?10:Math.floor(roll/0.95*4);hurt(s,target,amount,now,p.id,'arrow');log(s,`${p.username}, ya eliminado, dispara una flecha a ${target.username}: −${amount} de salud.`,now,{kind:'arrow',target:target.id,damage:amount,actor:p.id,ghost:true});finish(s,now);return;}
 if(!isHungerAlive(p)||s.phase!=='active')throw Error('Debes estar vivo/a en una partida activa.');const f=fighting(s,p);
 if(action==='whisper'){const target=get(s,Number(input.target));const text=String(input.text||'').trim();if(!target||target.bot||target.id===p.id||!isHungerAlive(target))throw Error('Elige un participante vivo.');if(!text||text.length>500)throw Error('Escribe entre 1 y 500 caracteres.');if(now-(p.lastWhisper||0)<3000)throw Error('Espera tres segundos entre mensajes.');p.lastWhisper=now;s.whispers??=[];s.whispers.push({from:p.id,to:target.id,text,at:now});s.whispers=s.whispers.slice(-300);return;}
 if(f?.mode==='flash-v1'&&['play','answer','save','flash_start','flash_finish'].includes(action)){
  let run=f.runs[p.id];
  if(action==='play'){if(run)throw Error('Solo puedes jugar una vez por combate.');f.runs[p.id]={saved:false,recorded:false,score:null,startedAt:null};return;}
  if(action==='answer')throw Error('Juega al minijuego de Casting asignado al combate.');
  if(action==='save'){if(!run?.recorded)throw Error('Termina el minijuego antes de guardar.');if(!run.saved){run.saved=true;log(s,`${p.username} guarda su puntuación.`,now);resolve(s,f,now);finish(s,now);}return;}
  if(!trustedFlash||input.fight!==f.id||input.kind!==f.kind)throw Error('Prueba de combate no válida.');
  if(!run)run=f.runs[p.id]={saved:false,recorded:false,score:null,startedAt:null};
  if(action==='flash_start'){if(run.saved||run.recorded)throw Error('La prueba ya ha terminado.');if(!run.token){run.token=crypto.randomUUID();run.startedAt=now;run.duration=BASE_CHALLENGE_SECONDS;}return;}
  if(!run.token||run.token!==input.token)throw Error('Intento de combate no válido.');if(run.recorded)return;
  if(now-run.startedAt<1000)throw Error('La prueba ha terminado demasiado pronto.');
  if(typeof input.points!=='number'||!Number.isFinite(input.points)||input.points<0||input.points>1000000000)throw Error('Puntuación no válida.');
  run.score=input.points;run.recorded=true;run.recordedAt=now;return;
 }
 if(action==='play'||action==='answer'||action==='save'){
 if(!f)throw Error('No tienes un combate pendiente.');let run=f.runs[p.id];if(action==='play'){if(run)throw Error('La competición solo se juega una vez por combate.');run=f.runs[p.id]={startedAt:now,index:0,correct:0,lastAnswerAt:0,saved:false,score:0};return;}
 if(!run||run.saved)throw Error('Inicia la competición o espera al rival.');const expired=now-run.startedAt>=60000;
 if(action==='answer'){if(expired)throw Error('El minuto ha terminado. Guarda tu puntuación.');if(input.index!==run.index||run.index>=12)throw Error('La pregunta ha cambiado.');if(now-run.lastAnswerAt<300)throw Error('Espera antes de responder.');if(Number.isFinite(input.answer)&&input.answer===f.questions[run.index].answer)run.correct++;run.index++;run.lastAnswerAt=now;}
 else{run.score=run.correct*100+Math.max(0,Math.floor((60000-(now-run.startedAt))/1000))*(run.index===12?1:0);run.saved=true;log(s,`${p.username} guarda su puntuación.`,now);resolve(s,f,now);}finish(s,now);return;
 }
 if(action==='run'){if(!f||f.runs[p.id]?.saved)throw Error('Solo puedes huir antes de guardar la puntuación.');closeFight(s,f,now,p.id===f.attacker?f.defender:f.attacker,'run');finish(s,now);return;}
 if(action==='claim_bonus'){
  if(!isHungerAlive(p)||s.phase!=='active')throw Error('No puedes recoger este evento ahora.');
  const bonus=s.bonuses?.find(x=>x.id===input.bonusId);
  if(!bonus||bonus.claimedBy!==null||now>=bonus.expiresAt)throw Error('Este evento ya no está disponible.');
  if(bonus.kind==='target'){if(p.arrows>=15)throw Error('Las dianas solo dan flechas si tienes menos de 15.');p.arrows=Math.min(15,p.arrows+3);}
  else if(bonus.kind==='poison')hurt(s,p,5,now,null,'poison');
  else throw Error('Evento desconocido.');
  bonus.claimedBy=p.id;bonus.claimedAt=now;
  log(s,bonus.kind==='target'?`${p.username} recogió 3 flechas de una diana.`:`${p.username} tocó el veneno y perdió 5 de salud.`,now,{kind:'bonus-result',bonusId:bonus.id,actor:p.id});
  finish(s,now);return;
 }
 if(action==='shoot'){const target=get(s,Number(input.target)),self=target?.id===p.id;if(!isHungerAlive(target)||(self&&!canShootSelf(s,p)))throw Error('Objetivo inválido.');if(!p.arrows)throw Error('No tienes flechas.');if(now-p.lastShot<1000)throw Error('Espera un segundo entre disparos.');p.arrows--;p.lastShot=now;const roll=random();const amount=roll>=0.95?10:Math.floor(roll/0.95*4),reveal=random()<0.03;if(self){p.selfShot327=true;hurt(s,target,amount,now,null,'arrow');log(s,`${p.username} se dispara una flecha a sí mismo: −${amount} de salud.`,now,{kind:'arrow',target:target.id,damage:amount,actor:p.id,self:true});finish(s,now);return;}hurt(s,target,amount,now,p.id,'arrow');log(s,`${reveal?p.username:'Un tributo desconocido'} dispara una flecha a ${target.username}: −${amount} de salud.`,now,{kind:'arrow',target:target.id,damage:amount,...(reveal?{actor:p.id}:{})});finish(s,now);return;}
 if(action==='bush'){
  // La selección no debe quedar bloqueada por una lucha pendiente.
  if(p.search!=null)throw Error('Ya has registrado un arbusto en este ciclo. Se renuevan cada tres horas.');
  const index=Number(input.index);
  if(!Number.isInteger(index)||index<0||index>7)throw Error('Elige uno de los ocho arbustos.');
  const heart=s.bushes.includes(index);p.search={index,heart,at:now,cycle:s.bushCycle};
  if(heart){p.health=rounded(Math.min(100,p.health+10));delete p.arrowDeathPending;}else hurt(s,p,5,now,null,'poison');
  log(s,'Un tributo desconocido registra los arbustos.',now,{kind:'bush'});
  finish(s,now);return;
 }
 if(f)throw Error('Termina el combate antes de cambiar de actividad.');
 if(action==='enter'||(action==='move'&&input.location==='cornucopia')){enter(s,p);log(s,`${p.username} entra en la Cornucopia.`,now,{kind:'enter',actor:p.id});}
 else if(action==='hide'||(action==='move'&&input.location==='forest')){if(isWiki(s)&&p.collect&&p.collect.readyAt>now)throw Error('Termina de recoger el arma o espera a que se cancele en combate.');p.location='forest';p.collect=null;log(s,`${p.username} se oculta en el bosque.`,now,{kind:'hide',actor:p.id});}
 
 else if(action==='collect'){const drop=s.drops.find(d=>d.id===input.drop&&d.expiresAt>now);if(!drop)throw Error('El arma ya no está disponible.');if(p.collect)throw Error('Ya estás recogiendo un arma.');enter(s,p);p.collect={type:drop.type,readyAt:now+WEAPONS[drop.type].time};s.drops=s.drops.filter(d=>d!==drop);log(s,`${p.username} comienza a recoger ${WEAPONS[drop.type].name}.`,now,{kind:'collect',actor:p.id,weapon:drop.type,phase:'collecting'});}
 else if(action==='attack')challenge(s,p,get(s,Number(input.target)),now,random);
 else throw Error('Acción desconocida.');
 settleArrowDeaths(s,now);finish(s,now);
}
function summary(s,x){return {id:x.id,attacker:x.attacker,defender:x.defender,winner:x.winner,reason:x.reason,loot:x.loot||null,endedAt:x.endedAt,kind:x.kind||null,damage:x.damage??s.events.find(e=>e.kind==='fight'&&e.fight===x.id&&Number.isFinite(e.damage))?.damage??null,experienceGain:x.experienceGain||{},experienceAfter:x.experienceAfter||{},adjustedScores:x.adjustedScores||Object.fromEntries([x.attacker,x.defender].filter(id=>x.runs[id]?.saved).map(id=>[id,x.stats?.[x.attacker]&&x.stats?.[x.defender]?adjusted(s,x,get(s,id)):x.runs[id].score])),scoreBonuses:x.scoreBonuses||{},scores:Object.fromEntries(Object.entries(x.runs||{}).map(([k,r])=>[k,r.score]))};}
export function view(s,user,now=Date.now(),requestedPage=1){const p=user&&get(s,user.id),f=p&&fighting(s,p),history=s.fights.filter(x=>x.endedAt&&(x.attacker===user?.id||x.defender===user?.id)).slice().reverse(),pages=Math.max(1,Math.ceil(history.length/5)),page=Math.max(1,Math.min(pages,Math.floor(Number(requestedPage))||1)),started=s.startedAt||null;return {runId:s.runId||null,canOpenNext:canFillBots(user)&&s.phase==='finished',manualStartRequired:true,version:40,rulesVersion:s.rulesVersion||76,arrowLimit:isWiki(s)?15:null,sponsorLimit:10,bushResetsAt:Number.isFinite(s.startedAt)?s.startedAt+(Math.floor((now-s.startedAt)/BUSH_CYCLE_MS)+1)*BUSH_CYCLE_MS:null,wolfActive:wolfActive(s,now),wolfChangesAt:isWiki(s)&&s.startedAt?s.startedAt+(wolfActive(s,now)?Math.floor((now-s.startedAt)/WOLF_CYCLE_MS)*WOLF_CYCLE_MS+WOLF_DURATION_MS:(Math.floor((now-s.startedAt)/WOLF_CYCLE_MS)+1)*WOLF_CYCLE_MS):null,edition:s.edition,prizeMultiplier:Number(s.edition)===4?2:1,prizes:editionPrizes176(s.edition),event320:eventView(s,now,canFillBots(user)),canShootSelf:!!p&&isHungerAlive(p)&&canShootSelf(s,p),canGhostShoot:!!p&&!isHungerAlive(p)&&canGhostShoot(s,p),canStart:canFillBots(user)&&s.phase==='waiting',paused:!!s.manualPause160,canFillBots:canFillBots(user)&&s.phase==='waiting'&&!s.manualPause160,phase:s.phase,createdAt:s.createdAt,startAt:s.startAt,now,capacity:arenaCapacity(s),food:s.food,foodStage:s.foodStage,foodDay:s.foodDay,winner:s.winner,sponsorCount:s.sponsors.length,startedAt:started,finishedAt:s.finishedAt||null,gameDay:started?Math.max(1,Math.floor((now-started)/LOBBY_MS)+1):0,dayEndsAt:started?started+(Math.floor((now-started)/LOBBY_MS)+1)*LOBBY_MS:null,nextWeaponAt:s.nextDropAt||null,sponsorLog:s.sponsors.map(x=>({username:x.username||null,target:x.target,gift:x.gift,at:x.at,cost:x.cost??100,ticket:!!x.ticket})),myPrize:p?.prize?{...p.prize,placement:p.placement,tickets:isWiki(s)&&p.id===s.winnerId?5:0,reduced:!!p?.prize&&p.prize.money<(editionPrizes176(s.edition)[p.placement-1]?.[1]||0)}:null,fightHistory:{page,pages,total:history.length},recentFight:history[0]?summary(s,history[0]):null,me:user?{id:user.id,username:user.username,is_admin:user.is_admin}:null,
 players:s.players.map(x=>({id:x.id,username:x.username,bot:x.bot,health:(!isWiki(s)&&x.location==='cornucopia')||s.phase!=='active'||x.id===user?.id?x.health:null,sponsorHealth:isWiki(s)&&x.health>0&&x.health<40?x.health:null,sponsorPrice:sponsorCost(s,x.id),alive:isHungerAlive(x),collecting:!!x.collect&&x.collect.readyAt>now,feedingAtZero:!!x.arrowDeathPending&&x.id===user?.id,kills:x.kills,location:x.location,placement:x.placement,prize:x.prize,eliminatedBy:x.eliminatedBy,deathCause:x.deathCause,eliminatedAt:x.eliminatedAt,...(x.id===user?.id?{arrows:x.arrows,weapon:x.weapon,uses:x.uses,experience:x.experience,search:x.search,collect:x.collect}:{}),fighting:!!fighting(s,x),scoreSaved:!!fighting(s,x)?.runs[x.id]?.saved})),
 whispers:(s.whispers||[]).filter(m=>user&&(m.from===user.id||m.to===user.id)).slice(-50).reverse(),events:s.events,drops:s.drops,fights:history.slice((page-1)*5,page*5).map(x=>summary(s,x)),
 fight:f?{id:f.id,xpEligible:!repeatedOpponent(s,f),mode:f.mode||'legacy',kind:f.kind||null,attacker:f.attacker,defender:f.defender,endsAt:f.endsAt,stake:f.stake,combatants:[f.attacker,f.defender].map(id=>({id,...f.stats?.[id],attackerXp:id===f.attacker?ATTACKER_XP:0,...(isWiki(s)&&id!==user?.id?{health:undefined}:{})})),opponentSaved:!!f.runs[p.id===f.attacker?f.defender:f.attacker]?.saved,run:f.runs[p.id]?{...f.runs[p.id],question:f.questions?.[f.runs[p.id].index]?.text||null}:null}:null};}

export function reopenFour172(source,now=Date.now()){
 const n=fresh(now,4),humans=(source.players||[]).filter(p=>!p.bot&&Number(p.id)>0);
 const seen=new Set();n.players=humans.filter(p=>{const k=String(p.username).toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).map(p=>({...player187(p.id,p.username),joinedAt:p.joinedAt||source.createdAt,notifyOnStart:!!p.notifyOnStart}));
 n.ops=source.ops||[];n.receipts=source.receipts||[];n.welcomes=(source.welcomes||[]).filter(w=>seen.has(String(w.username).toLowerCase()));
 n.reopening161={at:now,retained:n.players.map(p=>p.username)};n.reopening172={at:now,retained:n.players.map(p=>p.username)};
 log(n,'Hunger Games 4 reabierto: inscripciones abiertas. Se conservan las plazas reales. Solo admin1 puede pulsar Iniciar.',now,{kind:'lobby-system'});
 return n;
}

// Explicit one-time restoration requested for Hunger #5. Full previous record retained.
export function restorePau216(s,now=Date.now()){
 if(Number(s.edition)!==5||s.phase!=='active'||s.recovery216)return false;
 const p=s.players.find(p=>!p.bot&&String(p.username).toLowerCase()==='paucubarsi');if(!p)return false;
 s.recovery216={at:now,username:p.username,previous:JSON.parse(JSON.stringify(p))};
 if(p.eliminatedAt&&p.eliminatedBy){const killer=get(s,p.eliminatedBy);if(killer)killer.kills=Math.max(0,(killer.kills||0)-1);}
 const previousDeath=p.eliminatedAt;
 p.health=30;p.placement=null;p.collect=null;p.recovered216At=now;
 if(previousDeath)p.location='forest';
 for(const k of ['eliminatedAt','eliminatedBy','deathCause','arrowDeathPending','prize'])delete p[k];
 // Preserve the erroneous death privately without leaving a duplicate death in the live feed.
 s.recovery216.deathEvents=s.events.filter(e=>e.kind==='death'&&e.target===p.id);
 s.events=s.events.filter(e=>!(e.kind==='death'&&e.target===p.id));
 return true;
}

// One-time requested recovery: retain the original saved attempt, never recreate its score.
export function restorePauFight218(s,now=Date.now()){
 if(Number(s.edition)!==5||s.phase!=='active'||s.recovery218)return false;
 const p=s.players.find(p=>!p.bot&&String(p.username).toLowerCase()==='paucubarsi');
 const c=s.players.find(p=>!p.bot&&String(p.username).toLowerCase()==='cazweet');
 if(!p||!c)return false;
 const f=[...s.fights].reverse().find(f=>[f.attacker,f.defender].includes(p.id)&&[f.attacker,f.defender].includes(c.id)&&f.runs?.[p.id]?.saved&&(!f.endedAt||f.reason==='elimination'));
 if(!f||!isHungerAlive(c)||s.fights.some(x=>x!==f&&!x.endedAt&&[x.attacker,x.defender].some(id=>id===p.id||id===c.id)))return false;
 s.recovery218={at:now,healthBonus:20,previousPlayers:JSON.parse(JSON.stringify([p,c])),previousFight:JSON.parse(JSON.stringify(f))};
 if(p.eliminatedAt&&p.eliminatedBy){const k=get(s,p.eliminatedBy);if(k)k.kills=Math.max(0,(k.kills||0)-1);}
 if(f.endedAt){for(const contestant of [p,c])contestant.experience=Math.max(0,(contestant.experience||0)-(f.experienceGain?.[contestant.id]||0));}
 p.health=rounded(Math.min(100,Math.max(0,p.health||0)+20));p.placement=null;p.collect=null;p.recovered216At=now;
 for(const k of ['eliminatedAt','eliminatedBy','deathCause','arrowDeathPending','prize'])delete p[k];
 p.location=c.location='cornucopia';c.collect=null;
 for(const k of ['endedAt','winner','reason','damage','experienceGain','experienceAfter','adjustedScores','scoreBonuses','arrowVictory','loot'])delete f[k];
 // Pause the original remaining fight clock across the erroneous elimination.
 const previousEnd=s.recovery218.previousFight.endedAt;
 if(previousEnd)f.endsAt=now+Math.max(60000,(f.endsAt||previousEnd)-previousEnd);
 f.recovered218At=now;
 s.recovery218.removedEvents=s.events.filter(e=>(e.kind==='death'&&e.target===p.id)||(e.kind==='fight'&&e.fight===f.id));
 s.events=s.events.filter(e=>!((e.kind==='death'&&e.target===p.id)||(e.kind==='fight'&&e.fight===f.id)));
 return true;
}
