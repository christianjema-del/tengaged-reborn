import assert from 'node:assert/strict';
import {freshDuel,actDuel,advanceDuel,duelView,duelAlive,duelEligible} from '../functions/_shared/duel212.js';
let now=Date.now();const users=Array.from({length:13},(_,i)=>({id:i+1,username:'Player'+(i+1)})),s=freshDuel(1,now);
for(const u of users.slice(0,11))actDuel(s,u,{action:'join'},now);
assert.equal(s.phase,'waiting');actDuel(s,users[0],{action:'join'},now);assert.equal(s.players.length,11);
actDuel(s,users[11],{action:'join'},now);assert.equal(s.phase,'waiting');assert.throws(()=>actDuel(s,users[0],{action:'start'},now));actDuel(s,{id:999,username:'admin1',is_admin:1},{action:'start'},now);assert.equal(s.phase,'immunity');assert.throws(()=>actDuel(s,users[12],{action:'join'},now));
assert.throws(()=>actDuel(s,users[0],{action:'list',order:Array(11).fill(2)},now));
assert.throws(()=>actDuel(s,users[0],{action:'flash_start',stage:s.stage,kind:s.challenge},now));
actDuel(s,users[0],{action:'whisper',to:2,body:'Privado'},now);assert.equal(duelView(s,users[1],now).whispers.length,1);assert.equal(duelView(s,users[2],now).whispers.length,0);assert.equal(duelView(s,null,now).whispers.length,0);
for(let turn=0;turn<25&&s.phase!=='finished';turn++){
 const phase=s.phase,participants=duelEligible(s);if(phase==='immunity')for(const p of duelAlive(s))actDuel(s,p,{action:'list',order:duelAlive(s).filter(q=>q.id!==p.id).map(q=>q.id)},now);
 for(const p of participants){actDuel(s,p,{action:'flash_start',stage:s.stage,kind:s.challenge},now,true);const run=s.runs[p.id];assert.throws(()=>actDuel(s,p,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:'wrong',points:100},now+2000,true));actDuel(s,p,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:run.token,points:p.id*100},now+2000,true);if(p!==participants.at(-1))actDuel(s,p,{action:'flash_finish',stage:s.stage,kind:s.challenge,token:run.token,points:999999},now+2001,true);assert.equal(run.score,p.id*100);}
 const outsider=duelView(s,users[12],now);assert.equal(outsider.runs,undefined);assert.equal(outsider.lists,undefined);assert.ok(outsider.players.every(p=>p.score===undefined));
 assert.equal(s.deadline,now+600000);now+=3000;assert.equal(advanceDuel(s,now),true);
 if(phase==='immunity'){assert.ok(!s.nominees.includes(s.immune));assert.equal(new Set(s.nominees).size,2);assert.equal(s.history.at(-1).route.length,duelAlive(s).length-2);}
 if(phase==='duel'){const out=s.players.find(p=>p.eliminatedAt===now);assert.ok(out);assert.throws(()=>actDuel(s,out,{action:'list',order:[]},now));}
}
assert.equal(s.phase,'finished');assert.deepEqual(s.players.map(p=>p.placement).sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));assert.equal(s.history.filter(h=>h.phase==='duel').length,9);assert.equal(s.players.filter(p=>p.status==='finished').length,3);assert.equal(duelView(s,users[0],now).fee,0);
console.log('PASS El Duelo: 12-seat manual start, one attempt, immutable score, private scores/lists/messages, ranked save chain, immune protection, nine eliminations, final three, unique positions, free edition');

const owner={id:999,username:'admin1',is_admin:1},bots=freshDuel(2,now);actDuel(bots,users[0],{action:'join'},now);assert.throws(()=>actDuel(bots,users[0],{action:'fill_bots'},now));actDuel(bots,owner,{action:'fill_bots'},now);assert.equal(bots.phase,'waiting');assert.equal(bots.players.filter(p=>p.bot).length,11);assert.equal(advanceDuel(bots,now+999999999),false);actDuel(bots,owner,{action:'start'},now);assert.equal(bots.phase,'immunity');assert.equal(Object.keys(bots.runs).length,11);assert.throws(()=>actDuel(bots,owner,{action:'start'},now));console.log('PASS owner-only bots and manual start, no automatic start after elapsed time');
