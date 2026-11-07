import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {repairSavedFightFood294} from '../functions/_shared/hunger.js';
const src=readFileSync(new URL('../functions/_shared/hunger.js',import.meta.url),'utf8');
assert.match(src,/const gain=Math\.min\(0\.1,100-p\.health\)/,'quien guarda el combate en la Cornucopia recupera 0,1 por minuto');assert.doesNotMatch(src,/saved\?0\.01/);
const start=1_000_000_000_000,T=60000,player=(id,username,health,location='cornucopia')=>({id,username,health,location});
const s={edition:8,startedAt:start,tickAt:start+100*T,players:[player(11,'Lamine',70),player(16,'Mario23',99.5),player(18,'Otro',50)],fights:[
 {id:'8-42',runs:{11:{saved:true,recordedAt:start+60*T+30000}}},
 {id:'8-43',runs:{16:{saved:true,recordedAt:start+10*T}}},
 {id:'8-41',runs:{18:{saved:true,recordedAt:start}}}]};
repairSavedFightFood294(s);
assert.equal(s.players[0].health,73.6);assert.equal(s.players[1].health,100);assert.equal(s.players[2].health,50);
assert.deepEqual(s.savedFood294.changes.map(c=>[c.username,c.minutes]),[['Lamine',40],['Mario23',90]]);
const again=structuredClone(s);repairSavedFightFood294(again);assert.deepEqual(again.players,s.players,'la corrección se aplica una sola vez');
const other={...structuredClone(s),edition:9};delete other.savedFood294;other.players[0].health=70;repairSavedFightFood294(other);assert.equal(other.players[0].health,70);
console.log('PASS combate guardado con comida: +0,1/min y corrección única de Hunger #8.');
