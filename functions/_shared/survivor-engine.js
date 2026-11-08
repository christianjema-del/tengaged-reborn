// Survivor (V303): réplica del Survivor de Regaged con las normas de Tengaged Reborn.
// 20 náufragos en dos tribus de 10. Días de 12 horas. Comida (pollo) y agua personales y de tribu,
// sol para cazar, lluvia para el cubo y fuego para comer y beber. Prueba de tribu diaria, inmunidad
// individual y Consejo Tribal para la tribu perdedora. Al quedar 10 se unifican y pasan a la
// siguiente partida como una tribu contra 10 náufragos nuevos.
import {startAdmin172,authorizeStart172,validStart172} from './manual-start172.js';
import {canFillBots} from './game-bots.js';
import {enrollmentOptions} from './enrollment.js';

export const CAPACITY=20,TRIBE_SIZE=10,MERGE_AT=10,DAY_MS=12*3600000;
export const MAX_SUPPLY=100,START_RESERVE=50,GATHER_AMOUNT=10;
export const HUNT_WATER=6,BUCKET_FOOD=6,FAN_WATER=6,FAN_MS=30*60000;
export const DECAY_WATER=5,DECAY_FOOD=6;
export const HUNT_MIN_MS=30*60000,HUNT_MAX_MS=45*60000,BUCKET_MIN_MS=55*60000,BUCKET_MAX_MS=65*60000;
export const ATTEMPT_GRACE_MS=20000;
export const KINDS=Object.freeze(['wheel','numbers','deal','match','endurance','words','guitar','maze','snow','line']);
export const TRIBES=Object.freeze(['A','B']);

const random=n=>n<=1?0:crypto.getRandomValues(new Uint32Array(1))[0]%n;
const between=(min,max)=>min+random(max-min+1);
const key=v=>String(v);
export const alive=s=>s.players.filter(p=>p.status==='active');
export const tribeOf=(s,t)=>alive(s).filter(p=>p.tribe===t);
const byId=(s,id)=>s.players.find(p=>key(p.id)===key(id));
const clamp=v=>Math.max(0,Math.min(MAX_SUPPLY,Math.round(Number(v)||0)));
const log=(s,text,at,kind='story',extra={})=>{s.events.push({id:s.events.length+1,text,at,kind,...extra});if(s.events.length>400)s.events=s.events.slice(-400);};

// Segundos de prueba: cada recurso aporta hasta 50 s. Cada 6 puntos perdidos restan 3 s; a 0 no aporta nada.
// 100/100 = 200 s · 95/94 = 194 s · 0/94 = 147 s · 0/88 = 144 s · 0/0 = 100 s.
export function supplySeconds(value){const v=clamp(value);if(v<=0)return 0;return Math.max(0,50-3*Math.ceil((MAX_SUPPLY-v)/6));}
export function challengeSeconds(food,water){return 100+supplySeconds(food)+supplySeconds(water);}
// V312: los segundos de la prueba se fijan al cambiar de día con el pollo y el agua de ese momento.
// Cazar, sacar el cubo, avivar el fuego, comer o beber durante el día no los cambia hasta el siguiente cambio de día.
export function daySeconds(p){return Number.isFinite(p?.daySeconds)?p.daySeconds:challengeSeconds(p.food,p.water);}

// Salud al unificar: 30 o menos sube a 40; 96 o más sube a 100.
export function mergeSupply(value){const v=clamp(value);return v<=30?40:v>=96?100:v;}

export function freshSurvivor(id=0,now=Date.now(),carry=null){
 const s={id,version:303,phase:'waiting',day:0,createdAt:now,startedAt:null,finishedAt:null,deadline:null,
  players:[],camps:{},challenge:null,required:null,scores:{},immunity:{},attempts:{},sitouts:{},ballots:{},
  nominated:null,history:[],events:[],welcomes:[],carry:null,carriedFrom:null,nextId:null};
 if(carry?.players?.length){
  s.carriedFrom=carry.from;
  for(const p of carry.players)s.players.push({id:p.id,username:p.username,bot:false,tribe:'A',status:'active',placement:null,food:clamp(p.food),water:clamp(p.water),joinedAt:now,tie:random(0x7fffffff),carried:true});
  log(s,carry.players.length+(carry.players.length===1?' superviviente avanza':' supervivientes avanzan')+' desde Survivor #'+carry.from+'. Esperando a '+(CAPACITY-carry.players.length)+' náufragos nuevos para formar la tribu rival.',now,'story');
 }
 return s;
}

// ---------- Clima y fuego de cada campamento ----------
function windows(count,minMs,maxMs,start,taken=[]){
 const out=[];
 for(let tries=0;out.length<count&&tries<60;tries++){
  const len=between(minMs/60000,maxMs/60000)*60000,from=start+between(0,Math.max(0,(DAY_MS-len)/60000))*60000,to=from+len;
  if([...taken,...out].some(([a,b])=>from<b&&a<to))continue;
  out.push([from,to]);
 }
 return out.sort((a,b)=>a[0]-b[0]);
}
// Normalmente sale el sol, llueve y se enciende el fuego al menos una vez en cada ciclo de 12 horas.
export function daySchedule(start,opening=false){
 // Al empezar la partida las dos tribus tienen el fuego encendido y sol para cazar; después, al azar.
 const firstSun=opening?[[start,start+90*60000]]:[],firstFire=opening?[[start,start+120*60000]]:[];
 const sun=[...firstSun,...windows(between(opening?0:1,opening?1:2),60*60000,120*60000,start,firstSun)].sort((a,b)=>a[0]-b[0]);
 const rain=windows(between(1,2),60*60000,120*60000,start,sun);
 const fire=[...firstFire,...windows(between(opening?0:1,opening?1:2),90*60000,150*60000,start,firstFire)].sort((a,b)=>a[0]-b[0]);
 return {start,sun,rain,fire};
}
const inside=(list,at)=>(list||[]).some(([a,b])=>at>=a&&at<b);
export function weatherAt(camp,at){const sc=camp.schedule;if(!sc)return 'cloudy';return inside(sc.sun,at)?'sun':inside(sc.rain,at)?'rain':'cloudy';}
export function fireLit(camp,at){return inside(camp.schedule?.fire,at);}
function currentFire(camp,at){return (camp.schedule?.fire||[]).find(([a,b])=>at>=a&&at<b)||null;}

function useLog(camp,day,at,user,kind,amount){camp.log.push({day,at,user,kind,amount});if(camp.log.length>300)camp.log=camp.log.slice(-300);}
// Caza y cubo pendientes que ya han llegado a su hora.
function settleCamp(s,t,now){
 const camp=s.camps[t];if(!camp)return;
 for(const h of camp.hunts.filter(h=>!h.done&&now>=h.readyAt)){
  h.done=true;const before=camp.food;camp.food=Math.min(MAX_SUPPLY,camp.food+GATHER_AMOUNT);
  useLog(camp,h.day,h.readyAt,h.username,'hunt',camp.food-before);
 }
 camp.hunts=camp.hunts.filter(h=>!h.done||now-h.readyAt<DAY_MS);
 const b=camp.bucket;
 if(b&&!b.done&&now>=b.readyAt){b.done=true;const before=camp.water;camp.water=Math.min(MAX_SUPPLY,camp.water+GATHER_AMOUNT);useLog(camp,b.day,b.readyAt,b.username,'bucket',camp.water-before);camp.bucket=null;}
}

// ---------- Días ----------
function assignTribes(s){
 // V313: las tribus se forman por orden de inscripción (los 10 primeros juntos), sin sortear.
 // Así nadie cambia de tribu respecto a cómo salía en la inscripción. Los bots van siempre al final.
 const order=s.players.map((p,i)=>({p,i})).sort((a,b)=>(!!a.p.bot-!!b.p.bot)||((a.p.joinedAt??0)-(b.p.joinedAt??0))||(a.i-b.i)).map(x=>x.p);
 const carried=order.filter(p=>p.carried),fresh=order.filter(p=>!p.carried);
 if(!carried.length){fresh.forEach((p,i)=>{p.tribe=i<TRIBE_SIZE?'A':'B';});return;}
 // La tribu unificada espera a que se llene la otra: los nuevos completan primero la tribu B.
 for(const p of carried)p.tribe='A';
 let b=0;for(const p of fresh){if(b<TRIBE_SIZE){p.tribe='B';b++;}else p.tribe='A';}
}
function startDay(s,at){
 s.day++;s.deadline=at+DAY_MS;s.ballots={};
 s.challenge={day:s.day,kind:KINDS[random(KINDS.length)],immunityKind:KINDS[random(KINDS.length)]};
 s.required=Math.min(...TRIBES.map(t=>tribeOf(s,t).length));
 s.sitouts[s.day]={A:[],B:[]};s.scores[s.day]={};s.immunity[s.day]={};
 for(const t of TRIBES){s.camps[t].schedule=daySchedule(at,s.day===1);}
 for(const p of alive(s))p.daySeconds=challengeSeconds(p.food,p.water);
}
function eliminate(s,p,at,cause){
 const place=alive(s).length;p.status='eliminated';p.placement=place;p.eliminatedAt=at;p.deathCause=cause;
 p.final={food:p.food,water:p.water};
}
// Puntuación de la tribu: si juegan más de las necesarias, se quitan las pruebas más altas sobrantes.
export function tribeTotal(s,day,t,required){
 const sitting=new Set((s.sitouts[day]?.[t]||[]).map(key));
 const scores=Object.entries(s.scores[day]||{}).filter(([id])=>byId(s,id)?.tribe===t&&!sitting.has(key(id))).map(([id,x])=>({id,points:x.points})).sort((a,b)=>b.points-a.points);
 const dropped=new Set(scores.slice(0,Math.max(0,scores.length-required)).map(x=>x.id));
 const total=scores.filter(x=>!dropped.has(x.id)).reduce((n,x)=>n+x.points,0);
 return {total,dropped:[...dropped]};
}
function resultRows(s,day,t,dropped,roster){
 const sitting=new Set((s.sitouts[day]?.[t]||[]).map(key)),drop=new Set(dropped.map(key));
 return roster.map(p=>{const x=s.scores[day]?.[key(p.id)];return {username:p.username,result:sitting.has(key(p.id))?'sitting':x?(drop.has(key(p.id))?'dropped':'score'):'none',points:x?.points??null};});
}
function closeCouncil(s,day,at){
 const t=s.nominated;if(!t)return null;
 const voters=tribeOf(s,t);if(!voters.length)return null;
 const imm=Object.entries(s.immunity[day]||{}).filter(([id])=>byId(s,id)?.status==='active'&&byId(s,id)?.tribe===t).sort((a,b)=>b[1].points-a[1].points||a[1].at-b[1].at);
 const immune=imm.length?imm[0][0]:null;
 const counts=Object.fromEntries(voters.map(p=>[key(p.id),0]));
 for(const [voter,target] of Object.entries(s.ballots)){if(byId(s,voter)?.tribe===t&&byId(s,voter)?.status==='active'&&key(target) in counts&&key(target)!==key(immune))counts[key(target)]++;}
 const candidates=voters.filter(p=>key(p.id)!==key(immune));
 if(!candidates.length)return {tribe:t,immune:byId(s,immune)?.username||null,votes:[],out:null};
 const top=Math.max(...candidates.map(p=>counts[key(p.id)])),tied=candidates.filter(p=>counts[key(p.id)]===top);
 const out=tied[random(tied.length)];
 const votes=voters.map(p=>({username:p.username,votes:counts[key(p.id)],immune:key(p.id)===key(immune)}));
 const immunityRows=voters.map(p=>({username:p.username,points:s.immunity[day]?.[key(p.id)]?.points??null}));
 eliminate(s,out,at,'vote');out.eliminatedDay=day;
 log(s,out.username+' ha sido expulsado por su tribu.',at,'vote-out',{username:out.username,day});
 return {tribe:t,immune:byId(s,immune)?.username||null,immunity:immunityRows,votes,out:out.username,tie:tied.length>1};
}
function closeDay(s,at){
 const day=s.day,required=s.required;
 for(const t of TRIBES)settleCamp(s,t,at);
 const rosters=Object.fromEntries(TRIBES.map(t=>[t,tribeOf(s,t)]));
 const council=closeCouncil(s,day,at);
 // Quien está a 0 de pollo y 0 de agua (o comió con el fuego apagado y le salió mal) muere en el cambio de día.
 for(const p of alive(s).filter(p=>p.doomed||(p.food<=0&&p.water<=0))){eliminate(s,p,at,'starvation');p.eliminatedDay=day;log(s,p.username+' no ha resistido: se quedó sin pollo ni agua.',at,'starvation',{username:p.username,day});}
 for(const p of alive(s)){p.water=clamp(p.water-DECAY_WATER);p.food=clamp(p.food-DECAY_FOOD);}
 const totals={};for(const t of TRIBES)totals[t]=tribeTotal(s,day,t,required);
 let loser=totals.A.total<totals.B.total?'A':totals.B.total<totals.A.total?'B':null,tieBreak=false;
 if(!loser){loser=TRIBES[random(2)];tieBreak=true;}
 const entry={day,required,kind:s.challenge?.kind||null,totals:{A:totals.A.total,B:totals.B.total},rows:{A:resultRows(s,day,'A',totals.A.dropped,rosters.A),B:resultRows(s,day,'B',totals.B.dropped,rosters.B)},winner:loser==='A'?'B':'A',loser,tieBreak,council};
 s.history.push(entry);
 const remaining=alive(s);
 if(remaining.length<=MERGE_AT||TRIBES.some(t=>!tribeOf(s,t).length)){merge(s,at);return;}
 s.nominated=loser;
 log(s,'La tribu '+entry.winner+' gana la prueba del día '+day+(tieBreak?' en el desempate aleatorio':'')+'. La tribu '+loser+' juega la inmunidad individual y vota durante el día siguiente.',at,'challenge',{day,winner:entry.winner,loser});
 startDay(s,at);
}
function merge(s,at){
 const remaining=alive(s);
 for(const p of remaining){p.status='merged';p.placement=1;p.mergedAt=at;}
 s.phase='finished';s.finishedAt=at;s.deadline=null;s.nominated=null;
 const humans=remaining.filter(p=>!p.bot);
 s.carry=humans.length?{from:s.id,players:humans.map(p=>({id:p.id,username:p.username,food:mergeSupply(p.food),water:mergeSupply(p.water)}))}:null;
 log(s,'¡Unificación! Quedan '+remaining.length+' náufragos y comparten el primer puesto.'+(humans.length?' '+humans.length+(humans.length===1?' superviviente pasa':' supervivientes pasan')+' a la siguiente partida como una tribu.':' Solo quedan bots: el ciclo termina.'),at,'merge',{survivors:remaining.map(p=>p.username)});
}
// Una prueba empezada antes del cambio de día conserva todo su tiempo.
function runningUntil(s){
 let end=0;for(const a of Object.values(s.attempts))if(a.day===s.day&&!a.done)end=Math.max(end,a.startedAt+a.duration*1000+ATTEMPT_GRACE_MS);
 return end;
}
export function advanceSurvivor(s,now=Date.now()){
 if(s.phase==='waiting'){
  if(s.players.length===CAPACITY&&validStart172(s,'survivor')){
   assignTribes(s);s.startedAt=now;s.phase='day';
   for(const t of TRIBES)s.camps[t]={food:START_RESERVE,water:START_RESERVE,hunts:[],bucket:null,log:[],schedule:null};
   log(s,'¡Empieza Survivor! Los 20 náufragos forman dos tribus de diez. Cuidad del campamento: pollo, agua y fuego, y jugad la prueba.',now,'story');
   startDay(s,now);
  }
  return;
 }
 for(let n=0;n<40&&s.phase==='day';n++){
  for(const t of TRIBES)settleCamp(s,t,Math.min(now,s.deadline));
  if(now<s.deadline)break;
  const wait=runningUntil(s);if(wait>s.deadline&&now<wait){s.deadline=wait;break;}
  closeDay(s,s.deadline);
 }
}

// ---------- Acciones ----------
function requirePlayer(s,user){const p=user&&s.players.find(q=>key(q.id)===key(user.id));if(s.phase!=='day'||!p||p.status!=='active')throw Error('Ahora no puedes hacer esta acción.');return p;}
function amount(v){const n=Number(v);if(!Number.isInteger(n)||n<0||n>MAX_SUPPLY)throw Error('Cantidad no válida.');return n;}
export function actSurvivor(s,user,input,now=Date.now(),trusted=false){
 const action=input?.action;
 if(action==='join'){
  const enrollment=enrollmentOptions(input);if(s.phase!=='waiting')throw Error('La inscripción está cerrada.');
  if(s.players.some(p=>key(p.id)===key(user.id)))return;if(s.players.length>=CAPACITY)throw Error('No quedan plazas.');
  const health=trusted&&input.health?input.health:null;
  s.players.push({id:user.id,username:user.username,bot:false,tribe:null,status:'active',placement:null,food:clamp(health?.food??MAX_SUPPLY),water:clamp(health?.water??MAX_SUPPLY),joinedAt:now,tie:random(0x7fffffff),...(enrollment?{notifyOnStart:enrollment.notifyOnStart}:{})});
  if(enrollment)s.welcomes.push({username:user.username,body:enrollment.welcome,at:now});return;
 }
 if(action==='fill_bots'){
  if(!canFillBots(user)||s.phase!=='waiting')throw Error('Solo admin1 puede completar con bots.');
  let n=1;while(s.players.length<CAPACITY){const id=-(s.id*100+n);if(!s.players.some(p=>p.id===id))s.players.push({id,username:'Bot_'+String(n).padStart(2,'0'),bot:true,tribe:null,status:'active',placement:null,food:MAX_SUPPLY,water:MAX_SUPPLY,joinedAt:now,tie:random(0x7fffffff)});n++;}
  return;
 }
 if(action==='start'){
  if(!startAdmin172(user)||s.phase!=='waiting'||s.players.length<CAPACITY)throw Error('Solo admin1 puede iniciar con las 20 plazas completas.');
  authorizeStart172(s,user,'survivor',now);advanceSurvivor(s,now);return;
 }
 if(action==='whisper'){
  const p=requirePlayer(s,user),to=byId(s,input.to),body=String(input.body||'').trim();
  if(!to||to.bot||key(to.id)===key(p.id)||to.status!=='active'||!body||body.length>500)throw Error('Mensaje privado no válido.');
  if((s.whispers||=[]).some(w=>key(w.from)===key(p.id)&&now-w.at<3000))throw Error('Espera tres segundos.');
  s.whispers.push({id:crypto.randomUUID(),from:p.id,to:to.id,body,at:now});s.whispers=s.whispers.slice(-500);return;
 }
 const p=requirePlayer(s,user),camp=s.camps[p.tribe];settleCamp(s,p.tribe,now);
 if(action==='hunt'){
  if(weatherAt(camp,now)!=='sun')throw Error('Solo se puede cazar cuando hace sol.');
  if(p.water<HUNT_WATER)throw Error('Necesitas '+HUNT_WATER+' de agua para cazar. Espera al fuego para beber.');
  if(camp.hunts.some(h=>!h.done&&key(h.user)===key(p.id)))throw Error('Ya estás cazando. Vuelve cuando termine la caza.');
  p.water=clamp(p.water-HUNT_WATER);camp.hunts.push({user:p.id,username:p.username,day:s.day,at:now,readyAt:now+between(HUNT_MIN_MS/60000,HUNT_MAX_MS/60000)*60000,done:false});
  useLog(camp,s.day,now,p.username,'hunt-start',-HUNT_WATER);return;
 }
 if(action==='bucket'){
  if(weatherAt(camp,now)!=='rain')throw Error('Solo se puede sacar el cubo cuando llueve.');
  if(camp.bucket&&!camp.bucket.done)throw Error('Ya hay alguien recogiendo agua con el cubo.');
  if(p.food<BUCKET_FOOD)throw Error('Necesitas '+BUCKET_FOOD+' de pollo para sacar el cubo.');
  p.food=clamp(p.food-BUCKET_FOOD);camp.bucket={user:p.id,username:p.username,day:s.day,at:now,readyAt:now+between(BUCKET_MIN_MS/60000,BUCKET_MAX_MS/60000)*60000,done:false};
  useLog(camp,s.day,now,p.username,'bucket-start',-BUCKET_FOOD);return;
 }
 if(action==='eat'){
  const food=amount(input.food||0),water=amount(input.water||0);if(!food&&!water)throw Error('Elige cuánto pollo o agua quieres tomar.');
  if(food>camp.food||water>camp.water)throw Error('La reserva de la tribu no tiene tanto.');
  if(p.food+food>MAX_SUPPLY||p.water+water>MAX_SUPPLY)throw Error('No puedes pasar de '+MAX_SUPPLY+'.');
  camp.food-=food;camp.water-=water;p.food=clamp(p.food+food);p.water=clamp(p.water+water);
  if(food)useLog(camp,s.day,now,p.username,'eat',-food);if(water)useLog(camp,s.day,now,p.username,'drink',-water);
  // V309: se puede comer y beber libremente aunque el fuego esté apagado.
  return {poisoned:false};
 }
 if(action==='fan'){
  const fire=currentFire(camp,now);if(!fire)throw Error('Solo puedes avivar el fuego mientras está encendido.');
  if(p.water<FAN_WATER)throw Error('Necesitas '+FAN_WATER+' de agua para avivar el fuego.');
  p.water=clamp(p.water-FAN_WATER);fire[1]=Math.min(fire[1]+FAN_MS,s.deadline);useLog(camp,s.day,now,p.username,'fan',-FAN_WATER);return;
 }
 if(action==='sitout'){
  const mine=tribeOf(s,p.tribe),list=s.sitouts[s.day][p.tribe],sitting=list.some(id=>key(id)===key(p.id));
  if(s.scores[s.day]?.[key(p.id)]||Object.values(s.attempts).some(a=>a.day===s.day&&a.mode==='tribe'&&key(a.user)===key(p.id)))throw Error('Ya has jugado la prueba de hoy.');
  if(sitting){s.sitouts[s.day][p.tribe]=list.filter(id=>key(id)!==key(p.id));return;}
  if(list.length>=mine.length-s.required)throw Error('Tu tribu ya tiene a todos los que deben sentarse hoy.');
  list.push(p.id);return;
 }
 if(action==='vote'){
  if(s.nominated!==p.tribe)throw Error('Hoy tu tribu no está en el Consejo Tribal.');
  const target=byId(s,input.target);if(!target||target.status!=='active'||target.tribe!==p.tribe||key(target.id)===key(p.id))throw Error('Elige a un compañero de tu tribu.');
  s.ballots[key(p.id)]=target.id;return;
 }
 if(trusted&&action==='flash_start'){
  const mode=input.mode==='immunity'?'immunity':'tribe';if(input.day!==s.day)throw Error('El día ha cambiado. Vuelve a la partida.');
  const kind=mode==='immunity'?s.challenge.immunityKind:s.challenge.kind;if(input.kind&&input.kind!==kind)throw Error('Ese no es el minijuego de hoy.');
  if(mode==='tribe'){if(s.scores[s.day][key(p.id)])throw Error('Ya has jugado la prueba de hoy.');if(s.sitouts[s.day][p.tribe].some(id=>key(id)===key(p.id)))throw Error('Hoy te sientas: no juegas la prueba de tribu.');}
  else{if(s.nominated!==p.tribe)throw Error('Hoy tu tribu no juega la inmunidad.');if(s.immunity[s.day][key(p.id)])throw Error('Ya has jugado la inmunidad de hoy.');}
  const id=s.day+':'+mode+':'+key(p.id),old=s.attempts[id];
  if(old&&!old.done&&now<old.startedAt+old.duration*1000+ATTEMPT_GRACE_MS)return {attempt:old};
  if(old?.done)throw Error('Ya has jugado esta prueba.');
  s.attempts[id]={user:p.id,day:s.day,mode,kind,token:crypto.randomUUID(),startedAt:now,duration:daySeconds(p),done:false};
  return {attempt:s.attempts[id]};
 }
 if(trusted&&action==='flash_finish'){
  const mode=input.mode==='immunity'?'immunity':'tribe',id=Number(input.day)+':'+mode+':'+key(p.id),a=s.attempts[id];
  if(!a||a.token!==String(input.token||''))throw Error('Intento no válido. Vuelve a abrir la prueba.');
  if(a.done)return {attempt:a};
  const points=input.points;if(typeof points!=='number'||!Number.isSafeInteger(points)||points<0||points>1000000)throw Error('Resultado inválido.');
  if(now>a.startedAt+a.duration*1000+ATTEMPT_GRACE_MS)throw Error('El tiempo de la prueba ha terminado.');
  a.done=true;a.score=points;const store=mode==='immunity'?s.immunity:s.scores;(store[a.day]||={})[key(p.id)]={points,at:now};
  return {attempt:a};
 }
 throw Error('Acción no permitida.');
}

// ---------- Vista: solo lo que cada uno puede ver ----------
function campView(s,t,now,me){
 const c=s.camps[t];if(!c)return null;
 const own=me&&me.tribe===t;
 return {tribe:t,fire:fireLit(c,now),weather:weatherAt(c,now),food:c.food,water:c.water,
  fireUntil:currentFire(c,now)?.[1]||null,
  hunting:c.hunts.filter(h=>!h.done).map(h=>({username:h.username,at:own?h.at:null,readyAt:own?h.readyAt:null})),
  bucket:c.bucket&&!c.bucket.done?{username:c.bucket.username,at:own?c.bucket.at:null,readyAt:own?c.bucket.readyAt:null}:null,
  log:own?c.log.slice(-60).map(({day,at,user,kind,amount})=>({day,at,user,kind,amount})):[]};
}
export function survivorView(s,user,now=Date.now(),viewTribe=null){
 const me=user?s.players.find(p=>key(p.id)===key(user.id)):null,active=me?.status==='active',day=s.day;
 const tribe=TRIBES.includes(viewTribe)?viewTribe:me?.tribe||'A';
 const ownTribe=me?.tribe||null,sitting=s.sitouts[day]||{A:[],B:[]};
 const running=(p,mode)=>Object.values(s.attempts).some(a=>a.day===day&&a.mode===mode&&!a.done&&key(a.user)===key(p.id)&&now<a.startedAt+a.duration*1000+ATTEMPT_GRACE_MS);
 const immunityRows=(t)=>tribeOf(s,t).map(p=>({username:p.username,bot:!!p.bot,points:s.immunity[day]?.[key(p.id)]?.points??null,at:s.immunity[day]?.[key(p.id)]?.at??null,started:running(p,'immunity')}));
 const imm=s.nominated?immunityRows(s.nominated).filter(r=>r.points!==null).sort((a,b)=>b.points-a.points):[];
 const todayRows=t=>tribeOf(s,t).map(p=>{const x=s.scores[day]?.[key(p.id)];return {username:p.username,bot:!!p.bot,result:sitting[t]?.some(id=>key(id)===key(p.id))?'sitting':x?'score':'none',points:x?.points??null,at:x?.at??null,started:running(p,'tribe')};});
 return {id:s.id,phase:s.phase,day,now,deadline:s.deadline,startedAt:s.startedAt,finishedAt:s.finishedAt,capacity:CAPACITY,
  carriedFrom:s.carriedFrom,nextId:s.nextId,viewTribe:tribe,nominated:s.nominated,required:s.required,
  canStart:canFillBots(user)&&s.phase==='waiting'&&s.players.length===CAPACITY,canFillBots:canFillBots(user)&&s.phase==='waiting'&&s.players.length<CAPACITY,
  players:s.players.map(p=>({id:p.id,username:p.username,bot:!!p.bot,tribe:p.tribe,status:p.status,placement:p.placement,carried:!!p.carried,
   atCouncil:p.status==='active'&&s.phase==='day'&&p.tribe===s.nominated,
   voted:p.status==='active'&&ownTribe===p.tribe&&s.nominated===p.tribe?!!s.ballots[key(p.id)]:null,
   immunityLeader:!!imm.length&&imm[0].username===p.username&&p.tribe===s.nominated&&(ownTribe===p.tribe)})),
  camp:s.phase==='day'?campView(s,tribe,now,me):null,
  challenge:s.challenge?{day:s.challenge.day,kind:s.challenge.kind,immunityKind:s.challenge.immunityKind}:null,
  today:s.phase==='day'?{
   own:ownTribe?{tribe:ownTribe,rows:todayRows(ownTribe),total:tribeTotal(s,day,ownTribe,s.required).total}:null,
   other:ownTribe?{tribe:ownTribe==='A'?'B':'A',hidden:true}:null,
   sitouts:Object.fromEntries(TRIBES.map(t=>[t,(sitting[t]||[]).map(id=>byId(s,id)?.username)])),
   seatsToSit:Object.fromEntries(TRIBES.map(t=>[t,Math.max(0,tribeOf(s,t).length-(s.required||0))]))}:null,
  immunity:s.nominated&&ownTribe===s.nominated?immunityRows(s.nominated).sort((a,b)=>(b.points??-1)-(a.points??-1)):null,
  me:me?{id:me.id,tribe:me.tribe,status:me.status,placement:me.placement,food:me.food,water:me.water,doomed:!!me.doomed&&active,
   seconds:daySeconds(me),
   played:!!s.scores[day]?.[key(me.id)],score:s.scores[day]?.[key(me.id)]?.points??null,
   playedImmunity:!!s.immunity[day]?.[key(me.id)],immunityScore:s.immunity[day]?.[key(me.id)]?.points??null,
   sitting:!!sitting[me.tribe]?.some(id=>key(id)===key(me.id)),
   atCouncil:active&&s.phase==='day'&&s.nominated===me.tribe,vote:s.ballots[key(me.id)]??null,
   hunting:!!s.camps[me.tribe]?.hunts.some(h=>!h.done&&key(h.user)===key(me.id))}:null,
  // Los resultados de la prueba de tribu se comparten al cambiar de día; la inmunidad solo la ve su tribu.
  history:s.history.map(h=>({...h,council:h.council?{...h.council,immunity:ownTribe===h.council.tribe?h.council.immunity:null}:null})).reverse(),
  events:s.events.slice(-60).reverse().map(({id,text,at,kind})=>({id,text,at,kind})),
  whispers:me?(s.whispers||[]).filter(w=>key(w.from)===key(me.id)||key(w.to)===key(me.id)).map(w=>({id:w.id,from:byId(s,w.from)?.username,to:byId(s,w.to)?.username,body:w.body,at:w.at})):[],
  welcomes:s.welcomes};
}
