import assert from 'node:assert/strict';import {freshDuel,actDuel,advanceDuel,PHASE_MS} from '../functions/_shared/duel212.js';
const now=Date.now(),s=freshDuel(1,now),users=Array.from({length:12},(_,i)=>({id:i+1,username:'Player'+(i+1)}));
for(const u of users)actDuel(s,u,{action:'join'},now);actDuel(s,{id:999,username:'admin1',is_admin:1},{action:'start'},now);
assert.equal(PHASE_MS,4*3600000);assert.equal(s.deadline,now+4*3600000,'cada dia dura 4 horas');
const day=s.round;assert.equal(advanceDuel(s,s.deadline-1),false,'no cambia antes de las 4 horas');assert.equal(s.round,day);
const limit=s.deadline;advanceDuel(s,limit);assert.equal(s.round,day+1,'cambia aunque nadie haya jugado');assert.equal(s.phase,'duel');assert.equal(s.deadline,limit+4*3600000,'el dia siguiente tambien dura 4 horas');
const results=s.events.filter(e=>e.kind==='duel-results').at(-1);assert.equal(results.scores.length,12);assert.ok(results.scores.every(x=>x.score===0),'quien no juega saca 0 puntos');
console.log('PASS El Duelo: el dia cambia a las 4 horas y quien no juega saca 0 puntos.');
