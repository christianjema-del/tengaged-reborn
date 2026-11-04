import assert from 'node:assert/strict';import {fresh as freshCurrent,act,advance,WEAPONS} from '../functions/_shared/hunger.js';
const fresh=(...args)=>({...freshCurrent(...args),rulesVersion:76});
const now=Date.now(),a={id:1,username:'Alice'},b={id:2,username:'Bob'};
for(const type of Object.keys(WEAPONS)){
 const s=fresh(now);act(s,a,{action:'join'},now);act(s,b,{action:'join'},now);s.phase='active';s.startedAt=s.tickAt=now;s.nextDropAt=now+999999;s.drops=[{id:'weapon-test',type,expiresAt:now+999999}];
 act(s,a,{action:'collect',drop:'weapon-test'},now);assert.equal(s.drops.length,0);assert.equal(s.players[0].collect.type,type);assert.equal(s.players[0].location,'cornucopia');assert.equal(s.events[0].phase,'collecting');assert.equal(s.events[0].weapon,type);
 assert.throws(()=>act(s,b,{action:'collect',drop:'weapon-test'},now));advance(s,now+WEAPONS[type].time-1,()=>.99);assert.equal(s.players[0].weapon,null);advance(s,now+WEAPONS[type].time,()=>.99);assert.equal(s.players[0].weapon,type);const events=s.events.filter(e=>e.kind==='weapon');assert.equal(events.length,1);assert.equal(events[0].actor,1);assert.equal(events[0].weapon,type);assert.equal(events[0].phase,'collected');advance(s,now+WEAPONS[type].time+1,()=>.99);assert.equal(s.events.filter(e=>e.kind==='weapon').length,1);
}
console.log('PASS all four weapon reservations, collection times, single pickup events and competing claim rejection.');
