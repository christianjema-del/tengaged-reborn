import test from 'node:test';import assert from 'node:assert/strict';
import {finalOrder324} from '../functions/_shared/casting-daily.js';
const P=(username,o={})=>({username,status:'active',keys:0,checks:0,apples:0,tie:0,packages:[],applesCount188:true,...o});
test('V331: gana quien más posis tiene, pero sin llaves no se gana; el chat reciente no cuenta',()=>{
 const now=Date.now();
 const s={id:98,startedAt:0,flashScores:{},events:[],keyDrops:[],players:[
  P('SinLlaves',{keys:0,checks:9000,apples:3,lastChatAt:now}),
  P('Llavero',{keys:3,checks:980,apples:2}),
  P('Posis',{keys:1,checks:2380,apples:2}),
  P('Medio',{keys:2,checks:2170,apples:1}),
  P('EmpatePosisMasLlaves',{keys:2,checks:500}),
  P('EmpatePosis',{keys:1,checks:500}),
  P('Fuera',{status:'eliminated',placement:9,keys:9,checks:9999})]};
 assert.deepEqual(finalOrder324(s,now).map(r=>r.username),['Posis','Medio','Llavero','EmpatePosisMasLlaves','EmpatePosis','SinLlaves','Fuera']);
});
