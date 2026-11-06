import {recoverCastingFour146} from './casting-recovery146.js';
import {applyChatHealth142,applyPendingHealth278,restoreCastingThree142} from './casting-health142.js';
import {roomPosis} from './chat-posis.js';
export function applyGreenTicks(s,rows){
 const totals=new Map(rows.map(r=>[r.username.toLowerCase(),Number(r.total)||0]));
 for(const p of s.players)p.checks=totals.get(p.username.toLowerCase())||0;
}
export async function syncCastingSocial(db,s){
 if(s.phase==='finished'&&(s.id!==4||s.positionRecovery146||s.positionRecovery161))return;
 try{const chat=await db.prepare('SELECT total FROM game_chat_totals141 WHERE room=?').bind('casting:'+s.id).first();s.dropChatTotal=Number(chat?.total||0);
 const activity=await db.prepare(`SELECT u.username,a.last_id,a.last_at FROM game_chat_activity142 a JOIN users u ON u.id=a.user_id WHERE a.room=?`).bind('casting:'+s.id).all();
 const realActivity=(activity.results||[]).map(r=>({...r,last_at:Date.parse(String(r.last_at).replace(' ','T')+(String(r.last_at).endsWith('Z')?'':'Z'))}));applyChatHealth142(s,realActivity);restoreCastingThree142(s);
 for(const p of s.players)p.packages??=[];recoverCastingFour146(s,realActivity);await refreshCastingTicks(db,s);
 }catch(e){if(!/no such table/i.test(String(e.message||e)))throw e;s.dropChatTotal=0;}
}
// Los tics y la salud de los comentarios solo se actualizan cuando alguien recoge una llave o una manzana.
export async function refreshCastingTicks(db,s){
 if(!s.ticksPending)return false;
 const {rows,totals}=await roomPosis(db,'casting:'+s.id),names=new Map(rows.map(r=>[r.user_id,r.username]));
 applyGreenTicks(s,[...totals].map(([id,total])=>({username:names.get(id),total})));applyPendingHealth278(s,rows);s.ticksPending=false;return true;
}
