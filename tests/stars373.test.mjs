import test from 'node:test';import assert from 'node:assert/strict';
import {freshStars,actStars,advanceStars,starsView,STARS_CAPACITY} from '../functions/_shared/stars-engine.js';
// V373: Stars. 16 concursantes, nominación de dos por ronda, pareja de nominados, voto de expulsión,
// final a tres. Solo admin1 puede iniciar/completar bots/pausar/expulsar; la partida de pruebas es solo
// para admin1 mientras no termine.
const admin={id:1,username:'admin1',is_admin:1},ana={id:20,username:'Ana'};
test('V373: 16 plazas, solo admin1 inicia, se completa con bots y empieza en nominaciones',()=>{
 const s=freshStars(1,0);actStars(s,ana,{action:'join'},0);
 assert.throws(()=>actStars(s,ana,{action:'start'},0),/admin1/);
 actStars(s,admin,{action:'fill_bots'},0);assert.equal(s.players.length,STARS_CAPACITY);
 actStars(s,admin,{action:'start'},0);assert.equal(s.phase,'nominate');assert.equal(s.round,1);
});
test('V373: nominación válida, pareja de nominados y voto de expulsión',()=>{
 const s=freshStars(2,0);actStars(s,ana,{action:'join'},0);actStars(s,admin,{action:'fill_bots'},0);actStars(s,admin,{action:'start'},0);
 const others=s.players.filter(p=>p.id!==20).map(p=>p.id);
 assert.throws(()=>actStars(s,ana,{action:'nominate',targets:[20,others[0]]},0),/sin incluirte/);
 actStars(s,ana,{action:'nominate',targets:[others[0],others[1]]},0);
 advanceStars(s,0);assert.equal(s.phase,'vote','todos los bots ya han nominado, pasa a votación');
 assert.equal(s.nominees.length,2);
 const voter=s.players.find(p=>p.status==='active'&&!s.nominees.includes(p.id)&&!p.bot)||s.players.find(p=>p.status==='active'&&!s.nominees.includes(p.id));
 if(!voter.bot)actStars(s,{id:voter.id,username:voter.username},{action:'vote',target:s.nominees[0]},0);
 advanceStars(s,0);assert.equal(s.phase,'nominate');assert.equal(s.round,2);
 assert.equal(s.players.filter(p=>p.status==='eliminated').length,1);
});
test('V373: admin1 puede pausar y reanudar; nadie actúa mientras está pausada',()=>{
 const s=freshStars(3,0);actStars(s,ana,{action:'join'},0);actStars(s,admin,{action:'fill_bots'},0);actStars(s,admin,{action:'start'},0);
 actStars(s,admin,{action:'pause'},1000);assert.equal(starsView(s,admin,1000).paused,true);
 assert.throws(()=>actStars(s,ana,{action:'nominate',targets:[s.players[1].id,s.players[2].id]},2000),/pausada/);
 actStars(s,admin,{action:'resume'},61000);assert.equal(starsView(s,admin,61000).paused,false);
});
test('V373: la partida llega hasta el final y decide un ganador',()=>{
 const s=freshStars(4,0);actStars(s,ana,{action:'join'},0);actStars(s,admin,{action:'fill_bots'},0);actStars(s,admin,{action:'start'},0);
 let now=0,guard=0;
 while(s.phase!=='finished'&&guard++<400){now+=11*60000;advanceStars(s,now);}
 assert.equal(s.phase,'finished');assert.ok(s.winner);
 const placements=s.players.map(p=>p.placement).filter(Boolean).sort((a,b)=>a-b);
 assert.deepEqual(placements,Array.from({length:STARS_CAPACITY},(_, i)=>i+1));
});
console.log('PASS V373: Stars (16 plazas, nominación-pareja-voto, final a tres, pausa, solo admin1 controla)');
