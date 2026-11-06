export const HEALTH_GRACE142=3600000,HEALTH_STEP142=1800000;
const key=p=>p.username.toLowerCase();
export function applyChatHealth142(s,rows,now=Date.now()){
 if(s.phase==='waiting'||s.phase==='finished')return;
 const map=new Map(rows.map(r=>[r.username.toLowerCase(),r]));
 const migrating=s.healthRuleVersion!==142;
 for(const p of s.players){const r=map.get(key(p)),lastId=Number(r?.last_id||0),lastAt=Number(r?.last_at||0);p.lastChatAt=lastAt||null;
  if(p.status!=='active'){p.healthChatCursor142=lastId;continue;}
  if(migrating){p.healthChatCursor142=lastId;const due=Math.max(0,Math.floor((now-(Math.max(lastAt||0,s.startedAt||0))-HEALTH_GRACE142)/HEALTH_STEP142));
   // Silent bots previously had their inactivity clock reset by fake activity.
   // Correct that debt once, retaining 1% as an installation grace rather than killing retroactively.
   if(p.bot&&!lastAt){p.health=Math.max(1,p.health-Math.max(0,due-(p.idleCharged||0)));p.idleCharged=due;}
   else {p.idleCharged=due;if(lastId&&lastAt>=now-60000)p.health=Math.min(100,p.health+1);}
  }else if(lastId>Number(p.healthChatCursor142||0)){
   // El comentario quita la inactividad al momento; la salud sube al recoger una llave o una manzana.
   p.healthPaid278??=Number(p.healthChatCursor142||0);p.healthChatCursor142=lastId;if(lastAt>=(s.startedAt||0))p.idleCharged=0;
  }
 }
 s.healthRuleVersion=142;
}
// Suma +1 de salud por cada comentario que aun no se haya contado.
export function applyPendingHealth278(s,rows){
 const time=value=>Date.parse(String(value).replace(' ','T').replace(/Z?$/,'Z'));
 for(const p of s.players){
  if(p.status!=='active'||p.bot)continue;
  const base=Number(p.healthPaid278??p.healthChatCursor142??0),mine=rows.filter(r=>r.username.toLowerCase()===key(p)&&Number(r.id)>base&&time(r.created_at)>=(s.startedAt||0));
  p.healthPaid278=Math.max(base,...mine.map(r=>Number(r.id)));
  if(mine.length)p.health=Math.min(100,Math.max(0,p.health)+mine.length);
 }
}
export function restoreCastingThree142(s,now=Date.now()){
 if(s.id!==3||s.healthRecovery142||s.phase==='waiting'||s.phase==='finished')return false;
 const targets=s.players.filter(p=>['cristi','lamine'].includes(key(p)));if(targets.length!==2)return false;
 s.healthRecovery142={at:now,previous:targets.map(p=>({username:p.username,status:p.status,health:p.health,placement:p.placement})),round:s.round};
 for(const p of targets){p.status='active';p.placement=null;p.health=Math.max(70,Number(p.health)||0);p.idleCharged=Math.max(0,Math.floor((now-(Math.max(p.lastChatAt||0,s.startedAt||0))-HEALTH_GRACE142)/HEALTH_STEP142));p.healthRecoveryGrace142=now+HEALTH_STEP142;}
 const silentBots=s.players.filter(p=>p.bot&&p.status==='active'&&!p.lastChatAt);s.healthRecovery142.silentBots=silentBots.map(p=>({username:p.username,health:p.health}));for(const p of silentBots){p.health=Math.max(1,Math.min(5,p.health));p.idleCharged=Math.max(0,Math.floor((now-(s.startedAt||now)-HEALTH_GRACE142)/HEALTH_STEP142));}
 s.eliminations=(s.eliminations||[]).filter(e=>!targets.some(p=>key(p)===String(e.username).toLowerCase()));
 s.events.unshift({at:now,text:'Cristi y Lamine vuelven al Casting. Corregida la salud por actividad en el chat.'});return true;
}
