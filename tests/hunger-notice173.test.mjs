import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
class E{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.textContent='';}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attrs[k]=v;}}
const c=vm.createContext({document:{createElement:t=>new E(t),createTextNode:t=>({textContent:t})},room:'hunger:4',iso:()=>new Date().toISOString(),relative:()=> 'Ahora',setAvatar(){},Date,JSON,Number,Math});
let s=readFileSync(new URL('../game-chat.js',import.meta.url),'utf8');s=s.slice(s.indexOf('function eventCard('),s.indexOf('\ninput.oninput'));vm.runInContext(s+'\nthis.eventCard=eventCard;',c);
const body='Hunger Games 4 reabierto: inscripciones abiertas. Solo admin1 puede pulsar Iniciar.';
const row=c.eventCard({event:{kind:'lobby-system'},body,created_at:new Date().toISOString()});const all=[];function walk(x){all.push(x);for(const n of x.children||[])walk(n);}walk(row);
assert.ok(all.some(x=>x.tag==='img'&&x.src==='/assets/regaged/games/hunger/user_hidden.gif'));assert.equal(all.some(x=>x.tag==='p'&&x.textContent===body),false);assert.equal(all.some(x=>x.textContent==='Actualización del juego'),false);
console.log('PASS: Hunger reopening notice retains original hidden-tribute image without narrative text, without the added game-update heading.');
