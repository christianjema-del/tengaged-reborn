import assert from 'node:assert/strict';
import {eligibility381,equippedColorPower381,onRequest} from '../functions/api/enrollment-level.js';
// V381: /api/enrollment-level existe y devuelve JSON con la elegibilidad por tarjeta equipada.
const white=eligibility381(1),yellow=eligibility381(2),orange=eligibility381(3);
assert.equal(white.race,false);assert.equal(white.casting,true);assert.equal(white.hunger,true);
assert.equal(yellow.race,true);assert.equal(yellow.frookies,true);assert.equal(yellow.rookies,true);assert.equal(yellow.duel,false);assert.equal(yellow.survivor,false);
assert.equal(orange.duel,true);assert.equal(orange.survivor,true);
const db={prepare:()=>({bind:()=>({all:async()=>({results:[{theme_code:'orange'}]})})})};
assert.equal(await equippedColorPower381(db,5),3);
const anon=await onRequest({request:new Request('https://x.test/api/enrollment-level'),env:{}});
assert.match(anon.headers.get('content-type'),/json/);
console.log('PASS V381: /api/enrollment-level responde JSON y calcula la tarjeta equipada');
