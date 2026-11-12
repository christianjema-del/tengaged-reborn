export const DROP_GRACE_MS=30*60000,DROP_INTERVAL_MS=3600000,DROP_MESSAGES=12,DROP_LIMIT=3;
export function resetDropDay(s,at){s.dropPolicy={version:106,round:s.round,counts:{key:0,apple:0},lastAt:null,messageBaseline:Number(s.dropChatTotal||0)};s.keyDrops=[];s.nextDropAt=at+DROP_GRACE_MS;}
function migrate(s){
 const start=s.dayStartedAt??s.startedAt,present=(s.keyDrops||[]).filter(d=>d.at>=start&&d.at<start+12*DROP_INTERVAL_MS);
 // Old builds discarded expired objects. Reserve every unknown old appearance
 // against both caps, so upgrading cannot cause either limit to be exceeded.
 const lastScheduled=Number(s.nextDropAt||start)-DROP_INTERVAL_MS;
 const possible=Math.max(0,Math.floor((Math.min(lastScheduled,start+12*DROP_INTERVAL_MS-1)-start)/DROP_INTERVAL_MS));
 const unknown=Math.max(0,possible-present.length),counts={key:0,apple:0};for(const d of present)counts[d.kind==='apple'?'apple':'key']++;
 for(const kind of ['key','apple'])counts[kind]=Math.min(DROP_LIMIT,counts[kind]+unknown);
 const lastAt=present.length?Math.max(...present.map(d=>d.at)):possible?lastScheduled:null;
 s.dropPolicy={version:106,round:s.round,counts,lastAt,messageBaseline:Number(s.dropChatTotal||0)};s.nextDropAt=Math.max(start+DROP_GRACE_MS,lastAt===null?0:lastAt+DROP_INTERVAL_MS);
}
export function publicDrops(s,at){
 s.chatVoteCutoffAt=Math.max(Number(s.chatVoteCutoffAt||0),...(s.keyDrops||[]).filter(d=>d.claimedBy).map(d=>Number(d.at||0)));
 if(!s.dropPolicy)migrate(s);else if(s.dropPolicy.round!==s.round)resetDropDay(s,s.dayStartedAt);
 s.keyDrops=(s.keyDrops||[]).filter(d=>d.expiresAt>at&&d.at>=s.dayStartedAt);
 const p=s.dropPolicy,total=Number(s.dropChatTotal||0);if(at<s.dayStartedAt+DROP_GRACE_MS||at<s.nextDropAt)return;
 if(p.lastAt!==null&&(at-p.lastAt<DROP_INTERVAL_MS||total-p.messageBaseline<DROP_MESSAGES))return;
 const available=['key','apple'].filter(k=>p.counts[k]<DROP_LIMIT);if(!available.length)return;
 const kind=available[crypto.getRandomValues(new Uint32Array(1))[0]%available.length];
 s.keyDrops.push({id:crypto.randomUUID(),at,expiresAt:at+DROP_INTERVAL_MS,position:2,kind,claimedBy:null});s.ticksPending=true;// V350: al salir una llave o manzana también se actualizan los tics.
 p.counts[kind]++;p.lastAt=at;p.messageBaseline=total;s.nextDropAt=at+DROP_INTERVAL_MS;
}
