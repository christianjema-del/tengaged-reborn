import assert from 'node:assert/strict';import {commentPosis,totalPosis} from '../functions/_shared/chat-posis.js';import {fresh,act} from '../functions/_shared/casting-daily.js';import {refreshCastingTicks} from '../functions/_shared/casting-social.js';
assert.deepEqual([-1,0,1,2,3,4].map(commentPosis),[0,0,10,20,40,80]);
const t=totalPosis([{user_id:1,score:1},{user_id:1,score:2},{user_id:1,score:5},{user_id:1,score:5},{user_id:2,score:1},{user_id:1,score:3}]);
assert.equal(t.get(1),10+20+40,'el tercero y cuarto seguidos no suman; tras otro usuario vuelve a contar');assert.equal(t.get(2),10);
// Casting: los tics solo cambian al recoger llave o manzana.
const s=fresh(1,Date.now());act(s,{username:'Ana'},{action:'join'},Date.now());act(s,{username:'Bea'},{action:'join'},Date.now());s.id=1;
const db={prepare:()=>({bind:()=>({all:async()=>({results:[{id:1,user_id:7,username:'Ana',score:2}]})})})};
assert.equal(await refreshCastingTicks(db,s),false);assert.equal(s.players[0].checks,0,'sin recoger nada no cambia');
s.ticksPending=true;assert.equal(await refreshCastingTicks(db,s),true);assert.equal(s.players[0].checks,20);assert.equal(s.ticksPending,false);
console.log('PASS Posis: 10, 20, 40..., sin spam, y tics solo al recoger llave o manzana.');
import {resourceOrder188} from '../functions/_shared/casting-ranking188.js';
const pool={id:20,flashScores:{},players:[]};const P=(username,keys,checks,chal)=>({username,keys,checks,apples:50,performanceTotal:chal,performanceDays:1,tie:1,packages:[]});
pool.players=[P('Llaves',3,0,0),P('Tics',0,9999,0),P('Desafio',0,0,9)];
const o=resourceOrder188(pool,pool.players,true,Date.now());assert.equal(o[0].username,'Llaves','las llaves ganan a muchos tics');assert.equal(o[1].username,'Tics');assert.equal(o[2].username,'Desafio');
assert.deepEqual(o.map(r=>r.score),[70+6.25+1.25,17.5+25+1.25,17.5+6.25+5].map(n=>Math.round(n*1000)/1000).sort((a,b)=>b-a).slice(0,3),'70/25/5 por posicion');
console.log('PASS Casting: clasificacion 70% llaves, 25% tics y 5% desafios; las manzanas no puntuan.');
