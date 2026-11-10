import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fresh,player187,advance,act,view} from '../functions/_shared/hunger.js';
import {VASALLAJE} from '../functions/_shared/hunger-vasallaje320.js';
const T0=VASALLAJE.startAt,H=3600000,M=60000,half=()=>0.5,admin={id:1000,username:'admin1',is_admin:1};
function arena(edition=11){const s=fresh(T0-10*H,edition);s.manualGate187=true;s.runId='run';s.players.push(player187(11,'Vort'),player187(2,'Peach'),player187(3,'Cristi'),player187(4,'Oscar'),player187(5,'Gio'));
 const start=T0-8*H;s.manualStart172={kind:'hunger',game:edition,run:'run',by:'admin1',at:start};s.manualStart160={by:'admin1',at:start,edition};advance(s,start+M,half);return s;}
const keep=(s,at)=>{for(const p of s.players)if(p.health>0){p.health=95;p.location='cornucopia';}advance(s,at,half);};
test('V327: al acabar la niebla Vort recibe 400 flechas y puede dispararse a sí mismo',()=>{
 const s=arena();for(let t=-7*H;t<=0;t+=H)keep(s,T0+t+M);
 keep(s,T0+H);act(s,admin,{action:'event_next_day'},T0+H,half);keep(s,T0+2*H);act(s,admin,{action:'event_next_day'},T0+2*H,half);
 const vort=s.players[0],peach=s.players[1],before=vort.arrows;
 keep(s,T0+2*H+30*M);assert.ok(vort.arrows<before+50,'durante la niebla todavía no');
 assert.throws(()=>act(s,vort,{action:'shoot',target:vort.id},T0+2*H+30*M,half),/inválido/);
 keep(s,T0+3*H+2*M);assert.ok(vort.arrows>=before+400&&vort.arrows<before+410,'400 flechas: '+vort.arrows);const got=vort.arrows;assert.ok(s.events.some(e=>/Vort recibe 400 flechas/.test(e.text)));
 assert.equal(view(s,vort,T0+3*H+2*M).canShootSelf,true);assert.equal(view(s,peach,T0+3*H+2*M).canShootSelf,false);
 const h=vort.health;act(s,vort,{action:'shoot',target:vort.id},T0+3*H+3*M,()=>0.5);
 assert.ok(vort.health<h);assert.equal(vort.arrows,got-1);assert.equal(vort.kills,0);assert.ok(s.events.some(e=>e.self&&/se dispara una flecha a sí mismo/.test(e.text)));
 assert.throws(()=>act(s,peach,{action:'shoot',target:peach.id},T0+3*H+4*M,half),/inválido/);
 keep(s,T0+4*H);assert.equal(s.events.filter(e=>/400 flechas/.test(e.text)).length,1,'solo una vez');
});
test('V327: en otras ediciones nadie puede dispararse ni recibe las flechas',()=>{
 const s=arena(12);keep(s,T0+5*H);const vort=s.players[0];assert.ok(vort.arrows<400);
 assert.throws(()=>act(s,vort,{action:'shoot',target:vort.id},T0+5*H,half),/inválido/);
 assert.match(fs.readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8'),/Dispararme/);
});
