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
