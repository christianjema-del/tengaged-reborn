import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fresh,player187,advance,act,view,editionPrizes176} from '../functions/_shared/hunger.js';
import {VASALLAJE,VASALLAJE_PRIZES} from '../functions/_shared/hunger-vasallaje320.js';
const T0=VASALLAJE.startAt,H=3600000,M=60000,half=()=>0.5;
const admin={id:1000,username:'admin1',is_admin:1};
// Igual que Hunger #11 en producción: iniciada por admin1 a las 14:12 (13:12 UTC).
function arena(n=4,edition=11){const s=fresh(T0-10*H,edition);s.manualGate187=true;s.runId='run';for(let i=1;i<=n;i++)s.players.push(player187(i,'U'+i));
 const start=T0-8*H;s.manualStart172={kind:'hunger',game:edition,run:'run',by:'admin1',at:start};s.manualStart160={by:'admin1',at:start,edition};advance(s,start+M,half);return s;}
const keep=(s,at)=>{for(const p of s.players)if(p.health>0)p.health=90;advance(s,at,half);};
const next=(s,at,user=admin)=>act(s,user,{action:'event_next_day'},at,half);
test('V320: el día 1 del Vasallaje empieza solo a las 22:00 españolas',()=>{
 assert.equal(new Date(T0).toISOString(),'2026-11-09T21:00:00.000Z');
 const s=arena();for(let t=-7*H;t<0;t+=H)keep(s,T0+t);
 assert.equal(s.events.filter(e=>e.kind==='event320').length,0);
 const before=view(s,admin,T0-M).event320;assert.equal(before.started,false);assert.equal(before.canAdvance,false);
 assert.throws(()=>next(s,T0-M),/22:00/);
 keep(s,T0+2*M);
 assert.ok(s.events.some(e=>e.kind==='event320'&&/día 1: Lluvia de flechas/.test(e.text)));
 const ev=view(s,admin,T0+2*M).event320;assert.equal(ev.today.title,'Lluvia de flechas');assert.equal(ev.canAdvance,true);assert.equal(ev.next.title,'El Festín');
 assert.equal(view(s,{id:1,username:'U1'},T0+2*M).event320.canAdvance,false);
});
test('V322: solo admin1 cambia de día y el evento cabe en menos de 24 horas',()=>{
 const s=arena(4);for(let t=-7*H;t<0;t+=H)keep(s,T0+t);
 const before=s.events.filter(e=>e.kind==='bonus').length;for(let t=0;t<=H;t+=5*M)keep(s,T0+t);
 assert.ok(s.events.filter(e=>e.kind==='bonus').length-before>=5,'dianas cada 10 min el día 1');
 assert.throws(()=>next(s,T0+H,{id:1,username:'U1'}),/admin1/);
 // Día 2 a la hora y media: Festín 15 minutos después.
 for(const p of s.players)p.health=90;next(s,T0+90*M);
 assert.ok(s.events.some(e=>/día 2: El Festín/.test(e.text)));assert.equal(view(s,admin,T0+90*M).event320.feastAt,T0+105*M);
 s.players[0].location='cornucopia';s.players[0].health=50;s.players[1].location='forest';s.players[1].health=50;
 advance(s,T0+105*M,half);
 assert.ok(s.events.some(e=>/¡Empieza el Festín!/.test(e.text)));
 assert.ok(s.players[0].health>=64.9,'festín +15: '+s.players[0].health);assert.ok(s.players[1].health<50);
 assert.deepEqual(s.drops.filter(d=>d.id.includes('festin')).map(d=>d.type).sort(),['axe','mace','sword']);
 // Día 3 a las 3 horas: niebla la primera hora.
 keep(s,T0+3*H);next(s,T0+3*H);assert.ok(s.events.some(e=>/día 3: Niebla tóxica/.test(e.text)));
 for(const p of s.players){p.location='forest';p.health=90;}
 advance(s,T0+4*H,half);const p=s.players[2];
 assert.ok(p.health<=84.1&&p.health>=82.5,'niebla x2 en el bosque: '+p.health);
 assert.ok(s.events.some(e=>/Se disipa la niebla/.test(e.text)));
 assert.throws(()=>next(s,T0+4*H),/último día/);assert.equal(view(s,admin,T0+4*H).event320.canAdvance,false);
});
test('V320: otras ediciones no tienen evento ni cambian premios',()=>{
 const s=arena(4,12);keep(s,T0+H);assert.ok(!s.events.some(e=>e.kind==='event320'));
 assert.equal(editionPrizes176(12).length,6);assert.equal(view(s,null,T0).event320,null);
 assert.throws(()=>next(s,T0+H),/no tiene evento/);
});
test('V320: premios para 19 puestos, 1.º 600K y 1200 T$',()=>{
 assert.equal(VASALLAJE_PRIZES.length,19);assert.deepEqual(editionPrizes176(11).slice(0,3),[[600,1200],[300,600],[200,450]]);
 for(let i=1;i<19;i++){assert.ok(VASALLAJE_PRIZES[i][0]<VASALLAJE_PRIZES[i-1][0]);assert.ok(VASALLAJE_PRIZES[i][1]<VASALLAJE_PRIZES[i-1][1]);}
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
test('V322: la página muestra el cartel EVENTO con el botón de admin1',()=>{
 const html=fs.readFileSync(new URL('../hunger.html',import.meta.url),'utf8'),page=fs.readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8');
 assert.match(html,/id="event320"/);assert.match(html,/hunger-start124\.js\?v=325/);assert.match(page,/renderEvent320/);assert.match(page,/event_next_day/);assert.ok(!/confirm\(/.test(page.replace(/askConfirm\(/g,'')));
 assert.match(fs.readFileSync(new URL('../hunger-start124.js',import.meta.url),'utf8'),/hunger-page\.js\?v=325/);
});
