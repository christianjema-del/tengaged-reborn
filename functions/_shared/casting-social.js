import {recoverCastingFour146} from './casting-recovery146.js';
import {applyChatHealth142,restoreCastingThree142} from './casting-health142.js';
export function applyGreenTicks(s,rows){
 const totals=new Map(rows.map(r=>[r.username.toLowerCase(),Number(r.total)||0]));
 for(const p of s.players){p.checks=totals.get(p.username.toLowerCase())||0;
 // Never award the same milestone twice by removing and restoring a vote.
 const earned=Math.max(0,Math.floor(p.checks/3000));p.tickPackagesEarned??=Math.max((p.packages||[]).length,0);p.packages??=[];
 while(p.tickPackagesEarned<earned){p.tickPackagesEarned++;p.packages.push({id:crypto.randomUUID(),kind:crypto.getRandomValues(new Uint32Array(1))[0]%2?'key':'apple',at:Date.now(),claimedAt:null});}
 }
}
export async function syncCastingSocial(db,s){
 if(s.phase==='finished'&&(s.id!==4||s.positionRecovery146||s.positionRecovery161))return;
 try{const chat=await db.prepare('SELECT total FROM game_chat_totals141 WHERE room=?').bind('casting:'+s.id).first();s.dropChatTotal=Number(chat?.total||0);
 const activity=await db.prepare(`SELECT u.username,a.last_id,a.last_at FROM game_chat_activity142 a JOIN users u ON u.id=a.user_id WHERE a.room=?`).bind('casting:'+s.id).all();
 const realActivity=(activity.results||[]).map(r=>({...r,last_at:Date.parse(String(r.last_at).replace(' ','T')+(String(r.last_at).endsWith('Z')?'':'Z'))}));applyChatHealth142(s,realActivity);restoreCastingThree142(s);
 const votes=await db.prepare(`SELECT u.username,t.total FROM game_chat_positive141 t JOIN users u ON u.id=t.user_id WHERE t.room=?`).bind('casting:'+s.id).all();applyGreenTicks(s,votes.results||[]);recoverCastingFour146(s,realActivity);
 }catch(e){if(!/no such table/i.test(String(e.message||e)))throw e;s.dropChatTotal=0;applyGreenTicks(s,[]);}
}
