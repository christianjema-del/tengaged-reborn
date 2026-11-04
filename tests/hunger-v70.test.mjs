import assert from 'node:assert/strict';
import {fresh as freshCurrent,advance,act,view,TICK_MS} from '../functions/_shared/hunger.js';
const fresh=(...args)=>({...freshCurrent(...args),rulesVersion:76});
const t=Date.now();let s=fresh(t,99);s.phase='active';s.startedAt=t;s.tickAt=t;s.startAt=t;s.players=[{id:1,username:'Alice',health:70,experience:10,location:'forest',arrows:0,uses:0,search:null},{id:2,username:'Bob',health:70,experience:0,location:'cornucopia',arrows:0,uses:0,search:null}];s.nextDropAt=t+100000000;s.nextBonusAt=t+100000000;
// Existing duel, no XP awarded merely by saving. Score must include the pre-fight XP multiplier.
s.fights=[{id:'x',mode:'flash-v1',kind:'numbers',attacker:1,defender:2,stake:10,endsAt:t+100000,stats:{1:{health:70,experience:10,bonus:0},2:{health:70,experience:0,bonus:0}},runs:{1:{saved:true,score:600},2:{saved:true,score:500}}}];advance(s,t+TICK_MS);let f=s.fights[0];assert.equal(f.adjustedScores[1],720);assert.equal(f.scoreBonuses[1],120);assert.equal(f.winner,1);assert.equal(s.players[0].experience,12);assert.equal(view(s,{id:1}).fights[0].adjustedScores[1],720);
// User can choose bush even with a pending fight; one choice only.
s=fresh(t,100);s.phase='active';s.startedAt=t;s.tickAt=t;s.startAt=t;s.players=[{id:1,username:'Alice',health:60,experience:0,location:'forest',arrows:0,uses:0,search:null},{id:2,username:'Bob',health:60,experience:0,location:'forest',arrows:0,uses:0,search:null}];s.nextDropAt=t+100000000;s.nextBonusAt=t+100000000;const i=s.bushes[0];act(s,{id:1},{action:'bush',index:i},t);assert.equal(s.players[0].search.index,i);assert.equal(s.players[0].health,70);
// Force first reserve to exhaustion on an active cornucopia tick; second becomes 300 and does not refill after exhaustion.
s.food=.1;s.foodStage=0;s.players[0].location='cornucopia';advance(s,t+TICK_MS);assert.equal(s.foodStage,1);assert.equal(s.food,300);assert.equal(view(s,{id:1}).foodStage,1);
s.food=.1;advance(s,t+TICK_MS*2);assert.equal(s.foodStage,2);assert.equal(s.food,0);advance(s,t+TICK_MS*3);assert.equal(s.food,0);
console.log('PASS V70: adjusted scores, winning XP, interactive bushes, food refill 100→300→0');
