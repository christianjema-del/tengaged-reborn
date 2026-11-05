import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fresh,view,act,player187} from '../functions/_shared/hunger.js';
const now=Date.now(),s=fresh(now,9);s.phase='active';s.rulesVersion=77;s.startedAt=now;s.players=[player187(1,'Lamine'),player187(2,'Ricardito')];for(const p of s.players){p.location='cornucopia';p.health=100;}
assert.equal(view(s,{id:2,username:'Ricardito'},now).players.find(p=>p.id===1).collecting,false);
s.players[0].collect={type:'knife',readyAt:now+60000};
assert.equal(view(s,{id:2,username:'Ricardito'},now).players.find(p=>p.id===1).collecting,true,'los demas ven que recoge un arma');
assert.equal(view(s,{id:2,username:'Ricardito'},now+60001).players.find(p=>p.id===1).collecting,false,'al terminar vuelve a comida');
assert.throws(()=>act(s,{id:1,username:'Lamine'},{action:'hide'},now+1),/recoger/,'no puede esconderse mientras recoge');
const page=readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8'),css=readFileSync(new URL('../hunger.css',import.meta.url),'utf8');
assert.ok(page.includes("x.fighting?'COMBATE':x.collecting?'ARMA':'COMIDA'"));assert.ok(page.includes("(item.role==='attack'&&item.player.fighting)||(item.role==='hide'&&collecting)"));assert.ok(!page.includes('Ocultarme'));assert.ok(css.includes('.corn-slot .slot-action.hide{background:#fff5a6;color:#8f7042}'));
console.log('PASS Hunger: ARMA al recoger, sin esconderse mientras tanto, sin Atacar a quien lucha y boton Esconderme amarillo.');
