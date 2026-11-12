import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {publicDrops} from '../functions/_shared/casting-drops.js';import {refreshCastingTicks,syncCastingSocial} from '../functions/_shared/casting-social.js';
// V350: los tics de Casting se ponen al día cuando SALE un objeto, cuando se RECOGE y antes de cerrar cada día.
const day=Date.UTC(2026,10,12,7,43);
const s={round:2,dayStartedAt:day,dropChatTotal:40,dropPolicy:{version:106,round:2,counts:{key:0,apple:0},lastAt:null,messageBaseline:0},nextDropAt:day+30*60000,keyDrops:[],ticksPending:false,players:[]};
publicDrops(s,day+31*60000);assert.equal(s.keyDrops.length,1,'sale un objeto');assert.equal(s.ticksPending,true,'y se marcan los tics para actualizar');
// Tics: +1 = 10, +2 = 20, el 3.er comentario seguido no cuenta.
const rows=[{id:1,user_id:14,username:'Peach',score:1},{id:2,user_id:14,username:'Peach',score:2},{id:3,user_id:14,username:'Peach',score:3},{id:4,user_id:20,username:'Oscar',score:1}];
const db={prepare:q=>({bind:()=>({all:async()=>({results:rows}),first:async()=>null})})};
const game={id:18,phase:'elimination',rulesVersion:78,ticksPending:true,players:[{username:'Peach',health:64},{username:'Oscar',health:60}]};
assert.equal(await refreshCastingTicks(db,game),true);assert.equal(game.players[0].checks,30,'Peach: 10 + 20, el tercero seguido es spam');assert.equal(game.players[1].checks,10);assert.equal(game.ticksPending,false);
assert.equal(await refreshCastingTicks(db,game),false,'sin objeto nuevo no vuelven a subir');
const social=readFileSync(new URL('../functions/_shared/casting-social.js',import.meta.url),'utf8');assert.match(social,/Date\.now\(\)>=Number\(s\.deadline\|\|Infinity\)\)s\.ticksPending=true/,'antes de cerrar el día');
assert.match(readFileSync(new URL('../functions/_shared/casting-service.js',import.meta.url),'utf8'),/\['claim_key','claim_package'\]\.includes\(input\.action\)&&state\.rulesVersion>=78\)\{state\.ticksPending=true;await refreshCastingTicks/,'antes de recoger');
console.log('PASS V350: tics de Casting al salir o recoger un objeto y antes de cerrar el día');
