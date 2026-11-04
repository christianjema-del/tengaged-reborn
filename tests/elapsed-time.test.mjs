import assert from 'node:assert/strict';import {elapsedMinutes} from '../elapsed-time.js';
for(const [n,want] of [[0,'0 min'],[59,'59 min'],[60,'1 hora'],[119,'1 hora'],[120,'2 horas'],[569,'9 horas'],[1439,'23 horas'],[1440,'1 día'],[2880,'2 días'],[null,'—'],[undefined,'—'],[NaN,'—'],[-1,'0 min']])assert.equal(elapsedMinutes(n),want);
console.log('PASS connection labels at minute/hour/day boundaries, missing values and future timestamps.');
