import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {ATTACKER_XP} from '../functions/_shared/hunger.js';
const src=readFileSync(new URL('../functions/_shared/hunger.js',import.meta.url),'utf8'),page=readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8'),faq=readFileSync(new URL('../faq.html',import.meta.url),'utf8');
assert.equal(ATTACKER_XP,1.5);assert.match(src,/\(p\.id===f\.attacker\?ATTACKER_XP:0\)/);assert.match(src,/attackerXp:id===f\.attacker\?ATTACKER_XP:0/);assert.match(page,/\?\.attackerXp\|\|0/);assert.match(faq,/1,5 de experiencia extra/);
// Mario23 (atacante) contra Giovanni en Hunger #8: 206 y 202 puntos.
const score=(points,xp,bonus,extra)=>Math.round(points*(1+0.02*(xp+bonus+extra))*10)/10;
assert.equal(score(206,8,4,ATTACKER_XP),261.6);assert.equal(score(202,13,0,0),254.5);
assert.doesNotMatch(src,/0\.005\*Math\.max\(0,snap\.health/);assert.doesNotMatch(page,/0\.005\*Math\.max/);assert.match(faq,/diferencia de salud entre los dos no da puntos extra/);
console.log('PASS el atacante juega con +1,5 de experiencia en el cálculo del combate.');
