import {GAME_PRIZES,gamePrize} from '../../prize-catalog.js';
const key=p=>p.username.toLowerCase();
export function settleFrookies186(s){
 if(s.phase==='waiting')return;
 for(const p of s.players){if(p.bot||p.id<=0||!Number.isInteger(p.placement)||(s.phase!=='finished'&&p.status!=='eliminated'))continue;
 const pair=GAME_PRIZES.rookies_fast[p.placement-1]||[0,0];const event=`frookies:${s.id}${s.runId&&s.runId!=='initial'?':run:'+s.runId:''}:prize:${p.id}`;
 s.ops??=[];if(!s.ops.some(op=>op.key===event))s.ops.push({key:event,user:p.id,karma:pair[0],money:pair[1]});p.prize={karma:pair[0],money:pair[1]};
 }
}
export function settleCasting186(s){
 if(s.phase==='waiting')return;
 if(s.phase!=='finished'&&!s.positionsLocked186){
  for(const bot of [false,true]){
   const group=s.players.filter(p=>!!p.bot===bot),dead=group.filter(p=>p.status==='eliminated');
   const at=p=>s.eliminations?.find(e=>e.username.toLowerCase()===key(p))?.at??p.eliminatedAt186??p.eliminatedAt??null;
   dead.sort((a,b)=>at(a)!=null&&at(b)!=null?at(a)-at(b):(b.placement||0)-(a.placement||0));
   const top=bot?s.players.length:group.length;dead.forEach((p,i)=>p.placement=top-i);
  }
  s.positionsLocked186=true;
 }
 for(const p of s.players)if(!p.bot&&Number.isInteger(p.placement)&&(s.phase==='finished'||p.status==='eliminated'))p.prize=gamePrize('casting_slow',p.placement);
}
