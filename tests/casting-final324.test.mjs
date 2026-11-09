import test from 'node:test';import assert from 'node:assert/strict';
import {finalOrder324} from '../functions/_shared/casting-daily.js';
const P=(username,o={})=>({username,status:'active',keys:0,checks:0,apples:0,tie:0,packages:[],...o});
test('V324: al acabar el Casting los vivos van delante de los eliminados aunque estos tengan más recursos',()=>{
 const s={id:99,startedAt:0,flashScores:{},events:[],keyDrops:[],players:[
  P('Ganador',{keys:9,checks:9}),P('Vivo',{keys:0,checks:0}),
  P('Vort',{status:'eliminated',placement:6,keys:50,checks:50,lastChatAt:Date.now()}),
  P('Antes',{status:'eliminated',placement:7,keys:80,checks:80}),
  P('Bot vivo',{bot:true,keys:99}),P('Bot fuera',{bot:true,status:'eliminated',placement:12,keys:99})]};
 const order=finalOrder324(s,Date.now()).map(r=>r.username);
 assert.deepEqual(order,['Ganador','Vivo','Vort','Antes','Bot vivo','Bot fuera']);
});
