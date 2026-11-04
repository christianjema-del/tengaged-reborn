export const BASE_CHALLENGE_SECONDS=100;
export function castingChallengeTime(player,state){
 const players=(state?.players||[]).filter(p=>p.status==='active');
 const ranked=players.slice().sort((a,b)=>(Number(b.checks)||0)-(Number(a.checks)||0)||(Number(a.tie)||0)-(Number(b.tie)||0)||a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
 const rank=ranked.findIndex(p=>p.username.toLowerCase()===String(player?.username||'').toLowerCase())+1;
 const scale=players.length<=8?[150,140,130,120,110]:[150,145,140,135,130,125,120,115,110];
 const duration=state?.round>1&&rank>0?(scale[rank-1]||100):100;
 return {base:100,healthBonus:0,checksBonus:duration-100,duration,checksRank:rank||null,remaining:players.length,ruleVersion:129};
}
