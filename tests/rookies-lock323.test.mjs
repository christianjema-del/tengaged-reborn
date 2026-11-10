import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {freshRookies,advanceRookies,actRookies,rookiesView,alive,DAY_MS} from '../functions/_shared/rookies-engine.js';
test('V323: el HoH y el PoV no pueden cambiar lo guardado y su panel desaparece',()=>{
 const t0=Date.now(),admin={id:999,username:'admin1',is_admin:1},us=Array.from({length:13},(_,i)=>({id:i+1,username:'U'+(i+1)}));
 const s=freshRookies(7,t0);for(const u of us)actRookies(s,u,{action:'join'},t0);actRookies(s,admin,{action:'start'},t0);
 const hoh=alive(s).find(p=>p.id===s.hoh);assert.equal(rookiesView(s,hoh).me.hohDone,false);
 const picks=alive(s).filter(p=>p.id!==hoh.id).slice(0,2).map(p=>p.id);actRookies(s,hoh,{action:'nominate',targets:picks},t0);
 assert.equal(rookiesView(s,hoh).me.hohDone,true);
 assert.throws(()=>actRookies(s,hoh,{action:'nominate',targets:alive(s).filter(p=>p.id!==hoh.id).slice(2,4).map(p=>p.id)},t0),/Ya has guardado/);
 assert.deepEqual(s.hohPicks,picks);
 advanceRookies(s,t0+DAY_MS);assert.equal(s.day,2);
 const pov=alive(s).find(p=>p.id===s.pov),hoh2=alive(s).find(p=>p.id===s.hoh);assert.equal(rookiesView(s,hoh2).me.hohDone,false,'nuevo día, nuevo HoH sin guardar');
 assert.equal(rookiesView(s,pov).me.povDone,false);
 assert.throws(()=>actRookies(s,pov,{action:'save',target:null},t0+DAY_MS),/nominado/);
 actRookies(s,pov,{action:'save',target:s.nominees[0]},t0+DAY_MS);assert.equal(rookiesView(s,pov).me.povDone,true);
 assert.throws(()=>actRookies(s,pov,{action:'save',target:s.nominees[1]},t0+DAY_MS),/Ya has usado el PoV/);assert.equal(s.saved,s.nominees[0]);
});
test('V323: la página oculta Nominar/Vetar y los paneles cuando ya se ha guardado',()=>{
 const page=fs.readFileSync(new URL('../rookies-page250.js',import.meta.url),'utf8');
 assert.match(page,/s\.me\?\.isHoh&&!s\.me\.hohDone/);assert.match(page,/s\.me\?\.isPov&&!s\.me\.povDone/);
 assert.match(page,/hoh=me\?\.isHoh&&!me\.hohDone/);assert.match(page,/pov=me\?\.isPov&&!me\.povDone/);
 assert.match(fs.readFileSync(new URL('../rookies.html',import.meta.url),'utf8'),/rookies-page250\.js\?v=329/);
});
