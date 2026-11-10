import test from 'node:test';import assert from 'node:assert/strict';
import {standings} from '../functions/_shared/casting-daily.js';
import {castingChallengeTime} from '../functions/_shared/challenge-time.js';
const P=(username,o={})=>({username,status:'active',keys:0,checks:0,apples:0,tie:0,packages:[],applesCount188:true,...o});
test('V332: nominados = peores del desafío, pero una llave salva frente a quien no tiene; el chat no protege',()=>{
 const now=Date.now();
 const s={id:97,round:3,startedAt:0,events:[],keyDrops:[],flashScores:{bueno:{points:900},medio:{points:500},malo:{points:100},peor:{points:10},'peor con llave':{points:5},charlatan:{points:50}},players:[
  P('Bueno'),P('Medio'),P('Malo'),P('Peor'),P('Peor con llave',{keys:1}),P('Charlatan',{lastChatAt:now}),P('Bot',{bot:true,keys:5})]};
 const order=standings(s,false,now).map(r=>r.username);
 assert.deepEqual(order,['Peor con llave','Bueno','Medio','Malo','Charlatan','Peor','Bot']);
 // Con 7 vivos se nominan 2: los dos últimos.
 assert.deepEqual(order.slice(-2).reverse(),['Bot','Peor']);
});
test('V332: quien más posis tiene juega el desafío con 150 segundos desde el día 2',()=>{
 const s={round:2,players:[P('A',{checks:2380}),P('B',{checks:2170}),P('C',{checks:100})]};
 assert.equal(castingChallengeTime(s.players[0],s).duration,150);assert.equal(castingChallengeTime(s.players[1],s).duration,140);
 assert.equal(castingChallengeTime(s.players[0],{...s,round:1}).duration,100);
});
