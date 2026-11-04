import assert from 'node:assert/strict';
import {fresh,advance,view} from '../functions/_shared/hunger.js';
import {gamePrize} from '../prize-catalog.js';
const expected=[[140,300],[60,100],[20,60],[20,20],[10,10],[10,10]];
const now=Date.now(),s=fresh(now);s.phase='active';s.startedAt=now;s.lastTickAt=now;s.nextDropAt=now+60000;
s.players=Array.from({length:7},(_,i)=>({id:i+1,username:'Prize'+i,bot:false,health:i===0?100:0,placement:i===0?null:i+1,eliminatedAt:i===0?null:now,location:'forest',kills:0,arrows:0,experience:0}));
advance(s,now);assert.equal(s.phase,'finished');
for(let i=0;i<6;i++){assert.deepEqual(gamePrize('hunger',i+1),{karma:expected[i][0],money:expected[i][1]});assert.deepEqual(s.players[i].prize,gamePrize('hunger',i+1));assert.deepEqual(view(s,{id:i+1},now).myPrize.karma,expected[i][0]);assert.equal(s.ops.filter(x=>x.key===`hunger:${s.edition}:prize:${i+1}`).length,1);}
assert.equal(s.players[6].prize,undefined);const ops=s.ops.length;advance(s,now+1);assert.equal(s.ops.length,ops);
