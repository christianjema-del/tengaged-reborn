import assert from 'node:assert/strict';
import {fresh,advance,view,editionPrizes176} from '../functions/_shared/hunger.js';
const base=[[140,300],[60,100],[20,60],[20,20],[10,10],[10,10]],now=Date.now();
for(const edition of [3,4,5]){
 const s=fresh(now);s.edition=edition;s.phase='active';s.manualStart160={by:'admin1',at:now};s.startedAt=now;s.lastTickAt=now;s.nextDropAt=now+60000;
 s.players=Array.from({length:8},(_,i)=>({id:i+1,username:'Prize'+i,bot:i===5,health:i===0?100:0,placement:i===0?null:i+1,eliminatedAt:i===0?null:now,location:'forest',kills:0,arrows:0,experience:0}));
 advance(s,now);assert.equal(s.phase,'finished');const multiplier=edition===4?2:1;
 assert.deepEqual(editionPrizes176(edition),base.map(row=>row.map(v=>v*multiplier)));
 for(let i=0;i<6;i++){
  const p=s.players[i];if(p.bot){assert.equal(p.prize,undefined);continue;}
  assert.deepEqual(p.prize,{karma:base[i][0]*multiplier,money:base[i][1]*multiplier});
  assert.equal(s.ops.filter(op=>op.key===`hunger:${edition}:prize:${p.id}`).length,1);
  assert.equal(view(s,{id:p.id},now).myPrize.reduced,false);
 }
 assert.equal(s.players[6].prize,undefined);assert.equal(s.players[7].prize,undefined);
 assert.equal(view(s,null,now).prizeMultiplier,multiplier);assert.deepEqual(view(s,null,now).prizes,editionPrizes176(edition));
 const ops=JSON.stringify(s.ops);advance(s,now+1);assert.equal(JSON.stringify(s.ops),ops);
}
console.log('PASS edition 4 double karma/money for all prize places, adjacent editions unchanged, no bot payouts, no duplicate operations, published amounts match.');
