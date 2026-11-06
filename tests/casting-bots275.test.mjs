import assert from 'node:assert/strict';
import {fresh,advance,act,DAY_MS} from '../functions/_shared/casting-daily.js';
const admin={username:'admin1',is_admin:1};
function game(users){const t=Date.UTC(2026,10,5,22),s=fresh(10,t);s.manualStartRequired172=true;for(let i=1;i<=users;i++)act(s,{username:'U'+i},{action:'join'},t);act(s,admin,{action:'fill_bots'},t);act(s,admin,{action:'start'},t);for(const p of s.players)if(!p.bot)p.lastChatAt=t;return {s,t};}
const bots=s=>s.players.filter(p=>p.bot&&p.status==='active').length;
// Con cinco usuarios la partida acaba al cerrar el dia 2, con una expulsion ese mismo dia.
{
 const {s,t}=game(5);assert.equal(s.phase,'immunity');
 advance(s,t+DAY_MS);assert.equal(s.round,2);assert.equal(bots(s),15,'el dia 1 no muere ningun bot');
 advance(s,t+2*DAY_MS-1);assert.equal(bots(s),15,'siguen vivos hasta el cierre');
 advance(s,t+2*DAY_MS);assert.equal(bots(s),0,'mueren todos al cerrar el dia 2');
 assert.equal(s.phase,'finished');assert.ok(s.winner.startsWith('U'));
 assert.deepEqual(s.players.filter(p=>!p.bot).map(p=>p.placement).sort((a,b)=>a-b),[1,2,3,4,5],'los usuarios ocupan los cinco primeros puestos');
 assert.ok(s.players.filter(p=>p.bot).every(p=>p.placement>5));
 assert.equal(new Set(s.players.map(p=>p.placement)).size,20,'cada jugador tiene su puesto');
 assert.ok(s.eliminations.some(e=>e.cause==='fin del día 2'));
}
// Con mas de cinco usuarios la partida sigue entre ellos.
{
 const {s,t}=game(8);advance(s,t+DAY_MS);advance(s,t+2*DAY_MS);
 assert.equal(bots(s),0);assert.equal(s.phase,'elimination');assert.equal(s.round,3);
 assert.equal(s.players.filter(p=>p.status==='active').length,8);assert.equal(s.nominees.length,3);
 assert.ok(s.nominees.every(n=>n.startsWith('U')),'los nominados del dia 3 son usuarios');
}
console.log('PASS Casting: los bots mueren al cerrar el dia 2 y la partida sigue o termina segun los usuarios.');
