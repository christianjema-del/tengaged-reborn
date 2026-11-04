// Requested correction of completed Castings 1–5. Keep the established order
// inside each group; remove only the advantage of simulated participants.
export function recoverCompletedCastings161(s,now=Date.now()){
 if(s.id<1||s.id>5||s.phase!=='finished'||s.positionRecovery161)return false;
 const original=s.players.map((p,index)=>({p,index}));
 const priorRank=({p,index})=>Number.isInteger(p.placement)&&p.placement>0?p.placement:s.players.length+index;
 const ordered=original.slice().sort((a,b)=>Number(!!a.p.bot)-Number(!!b.p.bot)||priorRank(a)-priorRank(b)||a.index-b.index);
 s.positionRecovery161={at:now,previousWinner:s.winner,previous:original.map(({p})=>({username:p.username,placement:p.placement,bot:!!p.bot})),policy:'humans-first-stable-order'};
 const previousRows=new Map((s.finalStandings||[]).map(r=>[r.username.toLowerCase(),r]));
 ordered.forEach(({p},i)=>p.placement=i+1);
 s.winner=ordered[0]?.p.username||null;
 s.finalStandings=ordered.map(({p})=>({...previousRows.get(p.username.toLowerCase()),username:p.username,placement:p.placement,bot:!!p.bot}));
 s.events??=[];s.events.unshift({at:now,text:'Clasificación corregida: todos los usuarios reales por delante de los bots, conservando el orden previo entre usuarios.'});
 return true;
}
