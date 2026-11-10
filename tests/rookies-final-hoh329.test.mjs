import test from 'node:test';import assert from 'node:assert/strict';
import {freshRookies,advanceRookies,actRookies,rookiesView,alive,DAY_MS,lastVoteDay329} from '../functions/_shared/rookies-engine.js';
test('V329: el día anterior a la final de cuatro no hay HoH; el resto de días sí',()=>{
 assert.equal(lastVoteDay329(5),true);assert.equal(lastVoteDay329(6),true);assert.equal(lastVoteDay329(7),false);assert.equal(lastVoteDay329(4),false);
 const t0=Date.now(),admin={id:999,username:'admin1',is_admin:1},us=Array.from({length:13},(_,i)=>({id:i+1,username:'U'+(i+1)}));
 const s=freshRookies(9,t0);for(const u of us)actRookies(s,u,{action:'join'},t0);actRookies(s,admin,{action:'start'},t0);
 const seen=[];let t=t0;
 for(let n=0;n<12&&s.phase==='day';n++){seen.push({day:s.day,alive:alive(s).length,hoh:s.hoh});t+=DAY_MS;advanceRookies(s,t);}
 assert.equal(s.phase,'finale');assert.equal(alive(s).length,4);
 const last=seen.at(-1);assert.equal(last.hoh,null,'último día de votación sin HoH: '+JSON.stringify(last));
 for(const d of seen.slice(0,-1))assert.ok(d.hoh!=null,'día '+d.day+' con HoH');
 assert.ok(s.events.some(e=>/no hay HoH\. Mañana empieza la final de cuatro/.test(e.text)));
 assert.equal(rookiesView(s,admin).phase,'finale');
});
