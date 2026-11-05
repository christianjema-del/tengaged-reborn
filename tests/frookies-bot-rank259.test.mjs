import assert from 'node:assert/strict';import {fresh,order,eligibleHoh194} from '../functions/_shared/frookies-engine.js';
const s=fresh(10,Date.now());s.round=9;s.hoh='Lamine';s.previousHoh='Lamine';
s.players=[['Cristi',false,3319483962],['Lamine',false,598989355],['Tributo 5',true,1700554246],['Tributo 9',true,4147422742]].map(([username,bot,tie])=>({username,bot,tie,status:'active'}));
assert.equal(order(s,eligibleHoh194(s))[0].username,'Cristi','el caso real de Frookies #10');
s.activity={'tributo 5':{positiveVoters:9,positives:9,messages:9}};
assert.deepEqual(order(s,s.players).map(p=>p.username),['Lamine','Cristi','Tributo 5','Tributo 9'],'ni con mas actividad un bot adelanta a un real');
const bots=s.players.filter(p=>p.bot);assert.equal(order(s,bots)[0].username,'Tributo 5','entre bots sigue la actividad');
console.log('PASS Frookies: los usuarios reales van siempre por delante de los bots.');
