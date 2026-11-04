import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {letterPosition} from '../wof-touch236.js';
const flash=readFileSync(new URL('../original-flash.js',import.meta.url),'utf8');
assert.match(flash,/kind==='wheel'&&window\.matchMedia\?\.\('\(any-pointer: coarse\) and \(max-width: 1024px\)'\)/,'el teclado grande es solo para pantallas táctiles');
assert.match(flash,/installWofTouch\(container,player\)/);
assert.deepEqual(letterPosition('A'),{x:372,y:143});assert.deepEqual(letterPosition('I'),{x:524,y:143});assert.deepEqual(letterPosition('J'),{x:372,y:176.25});assert.deepEqual(letterPosition('Z'),{x:505,y:209.5});
for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){const p=letterPosition(letter);assert.ok(p.x>0&&p.x<550&&p.y>0&&p.y<400,letter);}
assert.throws(()=>letterPosition('Ñ'));
console.log('PASS Wheel touch: teclado solo en móvil y las 26 letras caen dentro del tablero');
