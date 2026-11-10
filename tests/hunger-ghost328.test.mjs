import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fresh,player187,advance,act,view} from '../functions/_shared/hunger.js';
import {VASALLAJE} from '../functions/_shared/hunger-vasallaje320.js';
const T0=VASALLAJE.startAt,H=3600000,M=60000,half=()=>0.5,admin={id:1000,username:'admin1',is_admin:1};
function ready(){const s=fresh(T0-10*H,11);s.manualGate187=true;s.runId='run';s.players.push(player187(11,'Vort'),player187(2,'Peach'),player187(3,'Cristi'),player187(4,'Oscar'));
 const start=T0-8*H;s.manualStart172={kind:'hunger',game:11,run:'run',by:'admin1',at:start};s.manualStart160={by:'admin1',at:start,edition:11};advance(s,start+M,half);
 const keep=at=>{for(const p of s.players)if(p.health>0){p.health=95;p.location='cornucopia';}advance(s,at,half);};
 for(let t=-7*H;t<=0;t+=H)keep(T0+t+M);keep(T0+H);act(s,admin,{action:'event_next_day'},T0+H,half);keep(T0+2*H);act(s,admin,{action:'event_next_day'},T0+2*H,half);keep(T0+3*H+2*M);return s;}
test('V328: si Vort muere por sus flechas sigue disparando hasta que queda un superviviente',()=>{
 const s=ready(),[vort,peach,cristi,oscar]=s.players;let t=T0+3*H+3*M;
 vort.location='forest';vort.health=2;const big=()=>0.99;
 act(s,vort,{action:'shoot',target:vort.id},t,big);assert.equal(vort.health,0);assert.ok(vort.eliminatedAt);assert.equal(vort.deathCause,'arrow');assert.equal(vort.eliminatedBy,null);
 assert.equal(view(s,vort,t).canGhostShoot,true);assert.equal(view(s,vort,t).canShootSelf,false);
 assert.throws(()=>act(s,vort,{action:'shoot',target:vort.id},t+2000,big),/inválido/);
 for(const p of [peach,cristi,oscar])p.location='forest';
 peach.health=cristi.health=5;oscar.health=90;
 for(const target of [peach,cristi]){t+=2000;act(s,vort,{action:'shoot',target:target.id},t,big);}
 assert.equal(peach.health,0);assert.equal(cristi.health,0);assert.equal(s.phase,'finished');assert.equal(s.winner,'Oscar');
 assert.ok(s.events.some(e=>e.ghost&&/ya eliminado, dispara/.test(e.text)));assert.equal(vort.kills,2);
 assert.throws(()=>act(s,vort,{action:'shoot',target:oscar.id},t+2000,big));
});
test('V328: quien muere por la flecha de otro no puede seguir disparando',()=>{
 const s=ready(),[vort,peach]=s.players,t=T0+3*H+3*M;vort.location=peach.location='forest';vort.health=2;peach.arrows=5;
 act(s,peach,{action:'shoot',target:vort.id},t,()=>0.99);assert.ok(vort.eliminatedAt);assert.equal(view(s,vort,t).canGhostShoot,false);
 assert.throws(()=>act(s,vort,{action:'shoot',target:peach.id},t+2000,()=>0.99),/vivo/);
 assert.match(fs.readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8'),/canGhostShoot/);
});
