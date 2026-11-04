import assert from 'node:assert/strict';
import {describeHungerEvent} from '../functions/_shared/hunger-events.js';
const s={players:[{id:1,username:'Lamine'},{id:2,username:'PauCubarsi'}]};
const anonymous=describeHungerEvent({kind:'arrow',actor:1,target:2,text:'Un tributo desconocido dispara una flecha a PauCubarsi: −3 de salud.'},s);assert.equal(anonymous.actor,null);assert.equal(anonymous.event.actor,undefined);assert.equal(anonymous.target,'PauCubarsi');assert.equal(anonymous.event.damage,3);
assert.equal(describeHungerEvent({kind:'arrow',actor:1,target:2,text:'Lamine dispara una flecha a PauCubarsi: −3 de salud.'},s).actor,'Lamine');
console.log('PASS anonymous arrow cannot inherit Lamine; legitimately revealed actor retained');
