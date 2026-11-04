import {standings} from './casting-daily.js';
// Explicit one-time correction requested for Casting #4. Preserve the completed match and archive its old state.
export function recoverCastingFour146(s,activity,now=Date.now()){
 if(s.id!==4||s.positionRecovery146||s.phase==='waiting')return false;
 const talkers=new Set(activity.filter(r=>Number(r.last_at)>=(s.startedAt||s.createdAt)).map(r=>r.username.toLowerCase()));
 const eligible=s.players.filter(p=>!p.bot&&talkers.has(p.username.toLowerCase()));
 if(!eligible.length)return false;
 s.positionRecovery146={at:now,previousWinner:s.winner,previous:s.players.map(p=>({username:p.username,status:p.status,placement:p.placement,health:p.health})),restored:eligible.map(p=>p.username)};
 const restored=new Set(eligible.map(p=>p.username.toLowerCase()));
 if(s.phase==='finished'){
  // Re-evaluate all participating real chat users using the existing 50/25/25 formula.
  const rankedPool=new Set([...restored,...s.players.filter(p=>p.status==='active').map(p=>p.username.toLowerCase())]);
  for(const p of s.players)if(rankedPool.has(p.username.toLowerCase())){p.status='active';p.placement=null;p.health=Math.max(1,p.health||0);}
  const ranked=standings(s,true);ranked.forEach((r,i)=>{s.players.find(p=>p.username===r.username).placement=i+1;});
  const others=s.players.filter(p=>!rankedPool.has(p.username.toLowerCase())).sort((a,b)=>(a.placement||99)-(b.placement||99));others.forEach((p,i)=>p.placement=ranked.length+i+1);
  s.finalStandings=ranked.map(({tie,...r})=>r);s.winner=ranked[0]?.username||null;
 }else{
  for(const p of eligible){p.status='active';p.placement=null;p.health=Math.max(70,p.health||0);p.idleCharged=0;p.healthRecoveryGrace142=now+1800000;}
  s.eliminations=(s.eliminations||[]).filter(e=>!restored.has(e.username.toLowerCase()));
  const dead=s.players.filter(p=>p.status==='eliminated').sort((a,b)=>(a.placement||99)-(b.placement||99)),alive=s.players.length-dead.length;dead.forEach((p,i)=>p.placement=alive+i+1);
  s.nominees=(s.nominees||[]).filter(n=>s.players.some(p=>p.username===n&&p.status==='active'));
 }
 s.events.unshift({at:now,text:'Clasificación de Casting #4 corregida con la actividad real del chat y la fórmula de llaves, prueba y tics. Se conserva la clasificación anterior en el registro de recuperación.'});return true;
}
