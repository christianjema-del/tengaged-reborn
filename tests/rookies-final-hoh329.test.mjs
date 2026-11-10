import test from 'node:test';import assert from 'node:assert/strict';
import {freshRookies,advanceRookies,actRookies,rookiesView,alive,DAY_MS,lastVoteDay329,setActivity} from '../functions/_shared/rookies-engine.js';
const admin={id:999,username:'admin1',is_admin:1};
function play(t0,{saveFirst=false}={}){
 const us=Array.from({length:13},(_,i)=>({id:i+1,username:'U'+(i+1)}));
 const s=freshRookies(9,t0);for(const u of us)actRookies(s,u,{action:'join'},t0);actRookies(s,admin,{action:'start'},t0);
 const seen=[];let t=t0;
 for(let n=0;n<12&&s.phase==='day';n++){
  seen.push({day:s.day,alive:alive(s).length,hoh:s.hoh});
  if(lastVoteDay329(alive(s).length)){
   const nominees=[...s.nominees],top=alive(s).filter(p=>!nominees.includes(p.id));
   // U con id más alto = más activo: el último día debe ganar el más activo de la partida.
   const best=top.slice().sort((a,b)=>b.id-a.id)[0];
   setActivity(s,[...Array.from({length:30},(_,i)=>({user_id:best.id,created_at:new Date(t0+i*1000).toISOString(),score:1,body:'hola '+i}))]);
   if(saveFirst&&s.pov){const pov=alive(s).find(p=>p.id===s.pov);if(pov&&!nominees.includes(pov.id)||pov)actRookies(s,pov,{action:'save',target:nominees[0]},t);}
   return {s,seen,nominees,best,t};
  }
  t+=DAY_MS;advanceRookies(s,t);
 }
 throw Error('no llegó al último día');
}
test('V329: el último día de votación no tiene HoH; el resto de días sí',()=>{
 assert.equal(lastVoteDay329(5),true);assert.equal(lastVoteDay329(6),true);assert.equal(lastVoteDay329(7),false);assert.equal(lastVoteDay329(4),false);
 const {s,seen}=play(Date.now());const last=seen.at(-1);assert.equal(last.hoh,null);for(const d of seen.slice(0,-1))assert.ok(d.hoh!=null,'día '+d.day);
 assert.ok(s.events.some(e=>/último día\. No hay HoH/.test(e.text)));
});
test('V330: al cerrar el último día termina la partida: nominados abajo por votos y gana el más activo',()=>{
 const t0=Date.now(),{s,nominees,best,t}=play(t0),n=alive(s).length;
 advanceRookies(s,t+DAY_MS);
 assert.equal(s.phase,'finished');assert.equal(s.winner,best.username);
 const places=s.players.filter(p=>p.status==='finished').map(p=>p.placement).sort((a,b)=>a-b);assert.deepEqual(places,Array.from({length:n},(_,i)=>i+1));
 for(const id of nominees)assert.ok(s.players.find(p=>p.id===id).placement>n-nominees.length,'nominado abajo');
 assert.ok(!s.events.some(e=>/Final de cuatro/.test(e.text)));
});
test('V330: el nominado salvado por el PoV sube al grupo de los que se ordenan por actividad',()=>{
 const t0=Date.now(),{s,nominees,t}=play(t0,{saveFirst:true}),n=alive(s).length;
 if(s.saved==null)return;// la partida de prueba no tuvo PoV vivo
 advanceRookies(s,t+DAY_MS);assert.equal(s.phase,'finished');
 const saved=s.players.find(p=>p.id===nominees[0]);assert.ok(saved.placement<=n-(nominees.length-1),'salvado fuera de los últimos: '+saved.placement);
 for(const id of nominees.slice(1))assert.ok(s.players.find(p=>p.id===id).placement>n-(nominees.length-1));
});
