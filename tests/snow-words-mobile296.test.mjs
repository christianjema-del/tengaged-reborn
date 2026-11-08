import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {inflateSync} from 'node:zlib';
const swf=n=>readFileSync(new URL('../original-games/swf/'+n+'.swf',import.meta.url));
function tags(bytes){const body=inflateSync(bytes.subarray(8)),bits=body[0]>>3;let pos=Math.ceil((5+bits*4)/8)+4;const out=[];while(pos<body.length){const raw=body.readUInt16LE(pos);pos+=2;const code=raw>>6;let size=raw&63;if(size===63){size=body.readUInt32LE(pos);pos+=4;}out.push([code,body.subarray(pos,pos+size)]);pos+=size;if(!code)break;}return out;}
// Snow Flakes: solo cambia el código AS3; el resto del SWF (gráficos, sonidos) es idéntico al de V293.
const a=tags(swf('StarFlakes293')),b=tags(swf('StarFlakes296'));assert.equal(a.length,b.length);let changed=0;
for(let i=0;i<a.length;i++){assert.equal(a[i][0],b[i][0]);if(!a[i][1].equals(b[i][1])){assert.equal(a[i][0],82);changed++;}}assert.equal(changed,1);
const oldAbc=a.find(([t])=>t===82)[1],abc=b.find(([t])=>t===82)[1];
// Inserciones: tope de 50 ms (17 B), dos topes de velocidad *k (7 B c/u), dos rozamientos 1-(1-f)*k (13 B extra c/u), dos desplazamientos *k (7 B c/u)
assert.equal(abc.length,oldAbc.length+17+7*2+13*2+7*2);
const flash=readFileSync(new URL('../original-flash.js',import.meta.url),'utf8');
assert.match(flash,/snow:'StarFlakes296'/);
// Words móvil: mismo SWF salvo los 4 huecos «*» aleatorios (pushbyte 4 → 0 en dos sitios).
const w=inflateSync(swf('Words').subarray(8)),t=inflateSync(swf('WordsTouch296').subarray(8));assert.equal(w.length,t.length);
const diff=[];for(let i=0;i<w.length;i++)if(w[i]!==t[i])diff.push([i,w[i],t[i]]);assert.equal(diff.length,2);for(const [i,x,y] of diff){assert.equal(x,4);assert.equal(y,0);assert.equal(w[i-1],0x24);}
assert.match(flash,/mobileWords\?'WordsTouch296':file/);assert.match(flash,/const mobileWords=kind==='words'&&window\.matchMedia\?\.\('\(any-pointer: coarse\) and \(max-width: 1024px\)'\)\.matches/);
assert.match(flash,/import\('\/words-touch296\.js\?v=296'\)/);
assert.ok(Number(readFileSync(new URL('../casting-minigame-launcher.js',import.meta.url),'utf8').match(/original-flash\.js\?v=(\d+)/)[1])>=296,'el lanzador carga original-flash v296 o posterior');
const {letterPosition,ROWS}=await import('../words-touch296.js');
assert.deepEqual(ROWS,['ABCDEFGHI','JKLMNOPQR','STUVWXYZ']);
assert.deepEqual(letterPosition('A'),{x:129,y:263});assert.deepEqual(letterPosition('I'),{x:417,y:263});assert.deepEqual(letterPosition('R'),{x:417,y:314});assert.deepEqual(letterPosition('Z'),{x:381,y:365});
assert.throws(()=>letterPosition('*'));
const css=readFileSync(new URL('../words-touch296.css',import.meta.url),'utf8');assert.match(css,/height:48px/);assert.match(css,/touch-action:manipulation/);assert.match(css,/user-select:none/);
console.log('PASS Snow Flakes con física por tiempo y teclado grande de Words en móvil');
