import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fresh,player187,advance,act,view,editionPrizes176} from '../functions/_shared/hunger.js';
import {VASALLAJE,VASALLAJE_PRIZES,FEAST_AT,FOG_FROM} from '../functions/_shared/hunger-vasallaje320.js';
const T0=VASALLAJE.startAt,H=3600000,M=60000;
// Igual que Hunger #11 en producción: iniciada por admin1 a las 14:12 (13:12 UTC).
function arena(n=4,edition=11){const s=fresh(T0-10*H,edition);s.manualGate187=true;s.runId='run';for(let i=1;i<=n;i++)s.players.push(player187(i,'U'+i));
 const start=T0-8*H;s.manualStart172={kind:'hunger',game:edition,run:'run',by:'admin1',at:start};s.manualStart160={by:'admin1',at:start,edition};advance(s,start+M,()=>0.5);return s;}
const half=()=>0.5,keep=(s,at)=>{for(const p of s.players)if(p.health>0)p.health=90;advance(s,at,half);};
test('V320: El Vasallaje empieza a las 22:00 españolas dentro de la partida en marcha',()=>{
 assert.equal(new Date(T0).toISOString(),'2026-11-09T21:00:00.000Z');
 const s=arena();assert.equal(s.phase,'active');
 for(let t=-7*H;t<0;t+=H)keep(s,T0+t);
 assert.equal(s.events.filter(e=>e.kind==='event320').length,0);
 const before=view(s,null,T0-M).event320;assert.equal(before.started,false);assert.equal(before.today,null);
 keep(s,T0+2*M);
 assert.ok(s.events.some(e=>e.kind==='event320'&&/día 1: Lluvia de flechas/.test(e.text)));
 assert.equal(view(s,null,T0+2*M).event320.today.title,'Lluvia de flechas');
});
test('V320: otras ediciones no tienen evento ni cambian premios',()=>{
 const s=arena(4,12);keep(s,T0+H);assert.ok(!s.events.some(e=>e.kind==='event320'));
 assert.equal(editionPrizes176(12).length,6);assert.equal(view(s,null,T0).event320,null);
});
test('V320: premios para 19 puestos, 1.º 600K y 1200 T$',()=>{
 assert.equal(VASALLAJE_PRIZES.length,19);assert.deepEqual(editionPrizes176(11).slice(0,3),[[600,1200],[300,600],[200,450]]);
 for(let i=1;i<19;i++){assert.ok(VASALLAJE_PRIZES[i][0]<VASALLAJE_PRIZES[i-1][0]);assert.ok(VASALLAJE_PRIZES[i][1]<VASALLAJE_PRIZES[i-1][1]);}
 const s=arena(4);s.players[3].health=0.05;s.players[3].location='forest';keep(s,T0-7*H);
});
test('V320: día 1 dianas cada 10 min; día 2 Festín; día 3 niebla',()=>{
 const s=arena(4);for(let t=-7*H;t<0;t+=H)keep(s,T0+t);
 const before=s.events.filter(e=>e.kind==='bonus').length;for(let t=0;t<=H;t+=5*M)keep(s,T0+t);
 const targets=s.events.filter(e=>e.kind==='bonus').length-before;assert.ok(targets>=5,'dianas en 1 hora: '+targets);
 for(let t=2*H;t<=FEAST_AT-H/2;t+=2*H)keep(s,T0+t);
 assert.ok(s.events.some(e=>/Festín empieza dentro de una hora/.test(e.text)));
 s.players[0].location='cornucopia';s.players[0].health=50;s.players[1].location='forest';s.players[1].health=50;
 advance(s,T0+FEAST_AT,half);
 assert.ok(s.events.some(e=>/¡Empieza el Festín!/.test(e.text)));
 assert.ok(s.players[0].health>=64.9,'festín +15: '+s.players[0].health);assert.ok(s.players[1].health<50);
 assert.deepEqual(s.drops.filter(d=>d.id.includes('festin')).map(d=>d.type).sort(),['axe','mace','sword']);
 for(let t=FEAST_AT+2*H;t<FOG_FROM;t+=2*H)keep(s,T0+t);keep(s,T0+FOG_FROM);
 const p=s.players[2];p.location='forest';p.health=90;s.players[3].location='forest';s.players[3].health=90;advance(s,T0+FOG_FROM+H,half);
 // 1 hora en el bosque: 6 de salud con niebla (3 sin ella), algo más si coincide el Modo Lobo.
 assert.ok(p.health<=84.1&&p.health>=82.5,'niebla x2 en el bosque: '+p.health);
 assert.ok(s.events.some(e=>/Niebla tóxica/.test(e.text)));
});
test('V320: Duelo de campeones con 3 vivos solo desde las 22:00',()=>{
 const s=arena(3);const [a,b]=s.players;a.health=b.health=90;b.location='cornucopia';
 act(s,{id:a.id,username:a.username},{action:'attack',target:b.id},T0-6*H,half);assert.equal(s.fights.at(-1).stake,30);
 act(s,{id:a.id,username:a.username},{action:'run'},T0-6*H+M,half);
 for(const p of s.players)p.health=90;keep(s,T0+2*M);assert.ok(s.events.some(e=>/Duelo de campeones/.test(e.text)));
 b.location='cornucopia';act(s,{id:a.id,username:a.username},{action:'attack',target:b.id},T0+3*M,half);
 const f=s.fights.at(-1);assert.equal(f.stake,60);assert.equal(f.champion320,true);
 assert.equal(view(s,null,T0+3*M).event320.today.title,'Duelo de campeones');
});
test('V320: la página muestra el cartel EVENTO del Vasallaje',()=>{
 const html=fs.readFileSync(new URL('../hunger.html',import.meta.url),'utf8'),page=fs.readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8');
 assert.match(html,/id="event320"/);assert.match(html,/hunger-start124\.js\?v=320/);assert.match(page,/renderEvent320/);
 assert.match(fs.readFileSync(new URL('../hunger-start124.js',import.meta.url),'utf8'),/hunger-page\.js\?v=320/);
});
