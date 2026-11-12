import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {AUTO_START_MS} from '../functions/_shared/auto-start351.js';
import {freshRookies,actRookies,advanceRookies,rookiesView} from '../functions/_shared/rookies-engine.js';
import {fresh as freshFro,act as actFro,advance as advanceFro,view as viewFro} from '../functions/_shared/frookies-engine.js';
import {freshDuel,actDuel,advanceDuel,duelView} from '../functions/_shared/duel212.js';
import {fresh as freshCast,act as actCast,advance as advanceCast,view as viewCast} from '../functions/_shared/casting-daily.js';
import {requireStart172} from '../functions/_shared/manual-start172.js';
// V351: al inscribirse un usuario real empieza una cuenta atrás de 10 minutos; al acabar, el sistema completa con bots e inicia.
const T=Date.UTC(2026,10,13,10,0),peach={id:14,username:'Peach'},oscar={id:20,username:'Oscar'};
function check(name,s,join,adv,view,cap){
 requireStart172(s);
 join(s,peach,T);assert.equal(s.autoStart351.at,T+AUTO_START_MS,name+': cuenta atrás de 10 min');
 assert.equal(view(s,peach).deadline,T+AUTO_START_MS,name+': el reloj muestra la cuenta atrás');
 join(s,oscar,T+60000);assert.equal(s.autoStart351.at,T+AUTO_START_MS,name+': otro usuario no la reinicia');
 adv(s,T+AUTO_START_MS-1000);assert.equal(s.phase,'waiting',name+': antes de tiempo no empieza');
 adv(s,T+AUTO_START_MS+1000);assert.notEqual(s.phase,'waiting',name+': empieza solo a los 10 min');
 assert.equal(s.players.length,cap,name+': plazas completas');assert.equal(s.players.filter(p=>!p.bot).length,2,name+': los dos reales siguen');
 assert.equal(s.players.filter(p=>p.bot).length,cap-2,name+': el resto bots');assert.equal(new Set(s.players.map(p=>p.username)).size,cap,name+': sin nombres repetidos');
 const again=JSON.stringify(s);adv(s,T+AUTO_START_MS+2000);assert.equal(s.players.length,cap,name+': no se rellena dos veces');
 return again;
}
check('Rookies',freshRookies(1,T-1000),(s,u,t)=>actRookies(s,u,{action:'join'},t),(s,t)=>advanceRookies(s,t),(s,u)=>rookiesView(s,u,T),13);
check('Frookies',freshFro(1,T-1000),(s,u,t)=>actFro(s,{...u,is_system:0,is_banned:0},{action:'join'},t),(s,t)=>advanceFro(s,t),(s,u)=>viewFro(s,u,T),13);
check('El Duelo',freshDuel(1,T-1000),(s,u,t)=>actDuel(s,u,{action:'join'},t),(s,t)=>advanceDuel(s,t),(s,u)=>duelView(s,u,T),12);
check('Casting',freshCast(1,T-1000),(s,u,t)=>actCast(s,u,{action:'join'},t),(s,t)=>advanceCast(s,t),(s,u)=>viewCast(s,u,T),20);
// Sin usuarios reales no hay cuenta atrás.
{const s=freshRookies(2,T);assert.equal(s.autoStart351,undefined);advanceRookies(s,T+AUTO_START_MS*3);assert.equal(s.phase,'waiting');}
// Partidas que ya tenían a alguien inscrito antes de V351: la cuenta atrás empieza al abrirlas.
{const s=freshDuel(7,T-5000);s.players.push({id:20,username:'Oscar',status:'active',placement:null,joinedAt:T-5000});advanceDuel(s,T);assert.equal(s.autoStart351.at,T+AUTO_START_MS);advanceDuel(s,T+AUTO_START_MS);assert.equal(s.phase,'immunity');assert.equal(s.players.length,12);}
// Hunger y Survivor no cambian.
for(const f of ['hunger.js','survivor-engine.js'])assert.doesNotMatch(readFileSync(new URL('../functions/_shared/'+f,import.meta.url),'utf8'),/AutoStart351|autoStart351/,f+' sin inicio automático');
assert.match(readFileSync(new URL('../casting-game.js',import.meta.url),'utf8'),/'Empieza en '/);assert.match(readFileSync(new URL('../duel-page212.js',import.meta.url),'utf8'),/s\.phase==='waiting'&&!s\.deadline/);
console.log('PASS V351: Frookies, Casting, Rookies y El Duelo empiezan solos 10 minutos después de inscribirse un usuario real');
