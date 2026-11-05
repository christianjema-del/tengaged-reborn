const key=p=>p.username.toLowerCase(),num=n=>Math.max(0,Number(n)||0);
export function hydrateApples188(s){
 for(const p of s.players){if(p.applesCount188)continue;
  const messages=(s.events||[]).filter(e=>e.text?.startsWith(p.username+' recoge una manzana')).length;
  const drops=(s.keyDrops||[]).filter(d=>d.kind==='apple'&&d.claimedBy===key(p)).length;
  const packages=(p.packages||[]).filter(x=>x.kind==='apple'&&x.claimedAt).length;
  p.apples=Math.max(num(p.apples),Math.max(messages,drops)+packages);p.applesCount188=true;
 }
}
export function activeCasting188(s,p,at=Date.now()){
 if(p.bot)return false;
 if(Number(s.id)===8&&key(p)==='oscar')return false;
 if(s.id===7&&(s.positionRecovery188||s.positionRecovery192)){if(['giovanni','antonioj'].includes(key(p)))return false;return true;}
 return num(p.lastChatAt)>=Math.max(num(s.startedAt),at-3600000)&&num(p.lastChatAt)>0;
}
export function resourceOrder188(s,players,final=false,at=Date.now()){
 hydrateApples188(s);
 const rows=players.map(p=>({username:p.username,keys:num(p.keys),apples:num(p.apples),checks:num(p.checks),challengeScore:final?(p.performanceDays?num(p.performanceTotal)/p.performanceDays:0):num(s.flashScores?.[key(p)]?.points),bot:!!p.bot,chatProtected:activeCasting188(s,p,at),tie:num(p.tie)}));
 // Cada recurso se compara por posicion entre los jugadores: 70% llaves, 25% tics y 5% desafios.
 const rank=(row,field)=>rows.length<=1?1:(rows.filter(r=>r[field]<row[field]).length+(rows.filter(r=>r[field]===row[field]).length-1)/2)/(rows.length-1);
 for(const r of rows)r.score=Math.round((rank(r,'keys')*70+rank(r,'checks')*25+rank(r,'challengeScore')*5)*1000)/1000;
 return rows.sort((a,b)=>Number(a.bot)-Number(b.bot)||Number(b.chatProtected)-Number(a.chatProtected)||b.score-a.score||b.keys-a.keys||b.checks-a.checks||b.challengeScore-a.challengeScore||a.tie-b.tie||a.username.localeCompare(b.username));
}
export function repairCastingSeven188(s,now=Date.now()){
 if(s.id!==7||s.phase!=='finished'||s.positionRecovery188)return false;
 s.positionRecovery188={at:now,previousWinner:s.winner,previous:s.players.map(p=>({username:p.username,placement:p.placement})),policy:'active-users-resources-then-minigame',inactive:['Giovanni','AntonioJ']};
 const rows=resourceOrder188(s,s.players,true,s.finishedAt||now);rows.forEach((r,i)=>{r.placement=i+1;s.players.find(p=>key(p)===r.username.toLowerCase()).placement=i+1;});s.finalStandings=rows.map(({tie,...r})=>r);s.winner=rows[0]?.username||null;
 s.events.unshift({at:now,text:'Clasificación corregida: usuarios activos por delante de inactivos y bots; llaves + manzanas + tics verdes, con minijuegos solo para desempatar.'});return true;
}
