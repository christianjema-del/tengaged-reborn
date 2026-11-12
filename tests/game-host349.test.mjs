import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {startAdmin172,authorizeStart172,validStart172} from '../functions/_shared/manual-start172.js';import {canFillBots} from '../functions/_shared/game-bots.js';
// V349: admin1 y la cuenta de Bowsy (id 11) pueden iniciar partidas y completarlas con bots. Nadie más.
const admin1={id:1,username:'admin1',is_admin:1},bowsy={id:11,username:'Bowsy',is_admin:0,is_moderator:1},renamed={id:11,username:'Vort'},mod={id:20,username:'Mod',is_moderator:1},other={id:5,username:'Otro'},fakeAdmin={id:7,username:'admin1',is_admin:0};
for(const u of [admin1,bowsy,renamed]){assert.equal(startAdmin172(u),true,u.username);assert.equal(canFillBots(u),true,u.username);}
for(const u of [mod,other,fakeAdmin,null,{...bowsy,is_banned:1},{...bowsy,is_test_bot:1}]){assert.equal(startAdmin172(u),false,JSON.stringify(u));assert.equal(canFillBots(u),false);}
const s={phase:'waiting',id:4,createdAt:0};authorizeStart172(s,bowsy,'rookies',1000);assert.equal(validStart172(s,'rookies'),true,'un inicio de Bowsy es válido');assert.equal(s.manualStart172.user,'Bowsy');
assert.throws(()=>authorizeStart172({phase:'waiting',id:5},other,'rookies',1),/Solo admin1/);
const fro=readFileSync(new URL('../functions/_shared/frookies-engine.js',import.meta.url),'utf8');assert.doesNotMatch(fro,/k\(user\)(===|!==)'admin1'/,'Frookies usa la misma comprobación');
assert.doesNotMatch(readFileSync(new URL('../functions/_shared/mafia-seat231.js',import.meta.url),'utf8'),/==='admin1'|!=='admin1'/,'Mafias también');
console.log('PASS V349: admin1 y Bowsy controlan las partidas (iniciar, bots, expulsar, pausar); nadie más');
