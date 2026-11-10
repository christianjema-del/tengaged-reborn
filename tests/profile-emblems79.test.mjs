import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {gameEmblem} from '../game-emblems.js';
import {renderGames333,pageList333,shortDate333,statusLine333,placement333,gameHref333} from '../profile-games333.js';
for(const [name,position] of [['Castings','-300px 0px'],['FASTING','-300px 0px'],['Rookies','-262px -378px'],['Frookies','-262px -378px'],['Survivor','-166px -263px'],['Hunger Games','-442px -203px']])assert.equal(gameEmblem(name).position,position);assert.equal(gameEmblem('unknown'),null);
// V333: réplica 1:1 de «Mis Juegos» del Tengaged original.
class E{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.className='';this.href='';this.title='';this._text=null;}set textContent(t){this._text=t;this.children=[];}get textContent(){return this._text!=null?this._text:this.children.map(c=>c.textContent??'').join('');}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attrs[k]=v;}}
globalThis.document={createElement:t=>new E(t),createTextNode:t=>({textContent:t})};
const games=Array.from({length:10},(_,i)=>({game_type:['FROOKIES','SURVIVOR','CASTING','ROOKIES','HUNGER','DUEL'][i%6],game_id:String(i+1),status:i<2?'active':i===2?'eliminated':'finished',day:i<3?11-i:null,placement:i===3?'Ganador':i>=2?'Puesto '+(i+2):null,joined_at:'2015-05-31T10:00:00Z',created_at:'2015-05-31T10:00:00Z'}));
const root=new E('section'),state={page:1};renderGames333(root,games,state);
const box=root.children[0],h2=box.children[0],grid=box.children[1];
assert.equal(box.className,'inuser-games-aj');assert.equal(h2.children[0].className,'paginator pGames');assert.equal(h2.children[1].textContent,'Mis Juegos ');assert.equal(h2.children[2].className,'info');assert.equal(h2.children[2].textContent,'10 games played');
assert.equal(grid.className,'inuser-games');assert.equal(grid.children.length,7);
const [g0,g1,g2,g3]=grid.children;
assert.equal(g0.className,'game');assert.equal(g0.children[0].className,'grbutton');assert.equal(g0.children[0].textContent,'Entrar');assert.equal(g0.children[0].href,'/frookies.html?id=1');
assert.equal(g0.children[1].className,'status');assert.equal(g0.children[1].children[0].className,'fastsign');assert.equal(g0.children[1].textContent,'FDía 11#131 May, 15');
assert.equal(g1.children[0].className,'gsvbutton');assert.equal(g1.children[1].textContent,'Día 10#231 May, 15');
assert.equal(g2.children[0].className,'gbutton num');assert.equal(g2.children[0].textContent,'4°','eliminado con su puesto');assert.equal(g2.children[1].textContent,'Día 9#331 May, 15');
assert.equal(g3.children[0].textContent,'1°');assert.equal(g3.children[0].className,'grbutton num','Rookies terminado conserva su burbuja');
{const r=new E('section');renderGames333(r,[{game_type:'DUEL',game_id:'6',status:'finished',placement:'Puesto 1',joined_at:'2026-11-09'},{game_type:'DUEL',game_id:'7',status:'active',day:2,joined_at:'2026-11-10'},{game_type:'HUNGER',game_id:'10',status:'finished',placement:'Puesto 2',joined_at:'2026-11-08'}],{page:1});const [d1,d2,h]=r.children[0].children[1].children;assert.equal(d1.children[0].className,'gdbutton num','Duelo terminado con su burbuja');assert.equal(d1.children[0].textContent,'1°');assert.equal(d2.children[0].className,'gdbutton');assert.equal(d2.children[0].textContent,'Entrar');assert.equal(h.children[0].className,'ghbutton num');}assert.equal(g3.children[1].textContent,'Terminado#431 May, 15');
assert.deepEqual(pageList333(1,117),[1,2,3,'…',117]);assert.deepEqual(pageList333(50,117),[1,2,3,'…',49,50,51,'…',117]);assert.deepEqual(pageList333(1,1),[1]);
assert.equal(shortDate333('2026-11-10T09:00:00Z'),'10 Nov, 26');assert.equal(statusLine333({status:'active',day:0}),'Inscripción');assert.equal(placement333({placement:'Ganador'}),1);
assert.equal(gameHref333({game_type:'HUNGER',game_id:'9',status:'finished'}),'/hunger.html?edition=9');
const html=readFileSync(new URL('../profile.html',import.meta.url),'utf8');assert.match(html,/id="profileGames333"/);assert.match(html,/profile-games333\.js\?v=334/);assert.match(html,/profile-games333\.css\?v=337/);
{const css=readFileSync(new URL('../profile-games333.css',import.meta.url),'utf8');assert.match(css,/\.gdbutton\{background-position:-324px -203px;color:#5e311b\}/,'Duelo con «the duel» claro');assert.match(css,/\.ghbutton\{background-position:-442px -203px;color:#f1d749\}/,'Hunger negro');assert.match(css,/\.ghbutton:hover[^{]*\{background-position:-502px -203px/,'Hunger dorado solo al pasar');assert.ok(!/\.ghbutton\.num\{background-position:-502px/.test(css),'no dorado al terminar');}
console.log('PASS Mis Juegos 1:1: burbujas por juego, puesto con °, cajita Día/Terminado, F de rápidas, paginador 1 2 3 … N.');
