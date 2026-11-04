import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
const flash=readFileSync(new URL('../original-flash.js',import.meta.url),'utf8'),touch=readFileSync(new URL('../guitar-touch238.js',import.meta.url),'utf8');
assert.match(flash,/kind==='guitar'&&window\.matchMedia\?\.\('\(any-pointer: coarse\) and \(max-width: 1024px\)'\)/,'botones solo en pantallas táctiles');
assert.match(flash,/installGuitarTouch\(container,player\)/);
assert.match(touch,/stopPropagation/,'una pulsación fuera del reproductor no debe quitarle el foco a Ruffle');
for(const code of [49,50,51,52,53])assert.ok(touch.includes(','+code+','),'tecla '+code);
const raw=readFileSync(new URL('../original-games/swf/Guitar.swf',import.meta.url));assert.equal(raw.subarray(0,3).toString(),'CWS');
const body=Buffer.concat([raw.subarray(0,8),inflateSync(raw.subarray(8))]);assert.equal(body.readUInt32LE(4),body.length,'longitud de cabecera');
const bits=body[8]>>3;let p=8+Math.ceil((5+4*bits)/8)+4,sound=null;
while(p<body.length){const h=body.readUInt16LE(p);p+=2;const t=h>>6;let l=h&63;if(l===63){l=body.readUInt32LE(p);p+=4;}if(t===14&&body.readUInt16LE(p)===2)sound={format:body[p+2]>>4,samples:body.readUInt32LE(p+3)};if(t===0)break;p+=l;}
assert.ok(sound,'canción presente');assert.equal(sound.format,1,'ADPCM');
const seconds=sound.samples/11025;assert.ok(seconds>=150,'dura más que el mayor tiempo de prueba: '+seconds);
console.log('PASS Guitar: tema propio integrado y botones táctiles solo en móvil');
