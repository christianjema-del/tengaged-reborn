import assert from 'node:assert/strict';import {fresh,act,advance,view,wolfActive,WOLF_CYCLE_MS,BUSH_CYCLE_MS,upgrade,TARGET_INTERVAL_MS} from '../functions/_shared/hunger.js';
const t=Date.now(),a={id:1,username:'Alice'},b={id:2,username:'Bob'},spectator={id:3,username:'Carol'};
function arena(){const s=fresh(t,77);act(s,a,{action:'join'},t);act(s,b,{action:'join'},t);s.phase='active';s.startedAt=s.tickAt=t;s.nextDropAt=s.nextBonusAt=t+1e9;s.bushCycle=0;for(const p of s.players){p.arrows=10;p.lastShot=0;}return s;}

assert.equal(TARGET_INTERVAL_MS,20*60000);
let s=arena();s.players[0].location='cornucopia';s.players[0].arrows=15;
advance(s,t+24*60000);assert.equal(s.players[0].arrows,15);
advance(s,t+25*60000);assert.equal(s.players[0].arrows,16);
advance(s,t+49*60000);assert.equal(s.players[0].arrows,16);
advance(s,t+50*60000);assert.equal(s.players[0].arrows,17);
s=arena();s.players[0].arrows=14;s.bonuses=[{id:'one',kind:'target',expiresAt:t+1e7,claimedBy:null}];act(s,a,{action:'claim_bonus',bonusId:'one'},t);assert.equal(s.players[0].arrows,15);
s.bonuses.push({id:'two',kind:'target',expiresAt:t+1e7,claimedBy:null});s.players[0].arrows=24;assert.throws(()=>act(s,a,{action:'claim_bonus',bonusId:'two'},t));assert.equal(s.players[0].arrows,24);assert.equal(s.bonuses[1].claimedBy,null);
act(s,spectator,{action:'sponsor',target:1,gift:'arrows'},t);assert.equal(s.players[0].arrows,29);
s=arena();delete s.targetScheduleVersion;s.nextBonusAt=t+60000;upgrade(s,t);assert.equal(s.nextBonusAt,t+TARGET_INTERVAL_MS);assert.equal(s.targetScheduleVersion,202);
advance(s,t+19*60000);assert.equal(s.bonuses.length,0);advance(s,t+20*60000);assert.equal(s.bonuses.length,1);advance(s,t+39*60000);assert.equal(s.bonuses.length,1);advance(s,t+40*60000);assert.equal(s.bonuses.length,2);
s=arena();s.nextBonusAt=t+TARGET_INTERVAL_MS;advance(s,t+180*60000);assert.equal(s.bonuses.length,1,'no backlog of targets after a long gap');assert.ok(s.nextBonusAt>t+180*60000);
console.log('PASS V202: 20-minute targets, old schedule migration, no backlog bursts, Cornucopia and sponsors exceed 15, targets cap at 15 without consuming unavailable reward');
