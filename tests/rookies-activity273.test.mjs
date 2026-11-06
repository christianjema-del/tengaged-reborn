import assert from 'node:assert/strict';
import {freshRookies,advanceRookies,actRookies,setActivity,DAY_MS,FINALE_MS,alive} from '../functions/_shared/rookies-engine.js';
import {totalPosis} from '../functions/_shared/chat-posis.js';
const admin={id:999,username:'admin1',is_admin:1};
function game(t0,ties={}){
 const s=freshRookies(9,t0),us=[1,2,3];
 for(const id of us)actRookies(s,{id,username:'U'+id},{action:'join'},t0);
 actRookies(s,admin,{action:'fill_bots'},t0);
 Object.entries(ties).forEach(([id,tie])=>{s.players.find(p=>p.id===Number(id)).tie=tie;});
 actRookies(s,admin,{action:'start'},t0);return s;
}
const stamp=ms=>new Date(ms).toISOString().replace('T',' ').slice(0,23);
// Intercala autores para que nadie caiga en la regla de spam salvo que se pida.
const line=(rows,t)=>rows.map(([user_id,score],i)=>({id:i+1,user_id,score,created_at:stamp(t+i*1000)}));
const t0=Date.UTC(2026,10,5,8);
// Caso Peach: el HoH elige a dos bots, y el relleno no puede tocar a la usuaria que sí ha participado.
{
 const s=game(t0,{1:1,2:2000000000,3:2000000001});s.hoh=1;
 const bots=s.players.filter(p=>p.bot).map(p=>p.id);
 s.players.filter(p=>p.bot).forEach((p,i)=>{p.tie=10+i;});
 actRookies(s,{id:1,username:'U1'},{action:'nominate',targets:bots.slice(0,2)},t0);
 setActivity(s,line([[2,1],[1,1],[2,1],[1,1],[2,1]],t0+3600000));
 advanceRookies(s,t0+DAY_MS);
 assert.equal(s.day,2);assert.equal(s.nominees.length,4);
 assert.equal(s.hoh,2,'el más activo que no repite es el nuevo HoH');
 assert.ok(!s.nominees.includes(2),'quien ha sido activo no se rellena como nominada');
 assert.equal(s.pov,1,'el PoV también se decide con la actividad del día anterior');
}
// Gana quien más comenta, aunque otro tenga más tics; con los mismos comentarios deciden los tics.
{
 const s=game(t0,{1:1,2:2,3:3});s.hoh=-901;
 setActivity(s,line([[2,5],[1,0],[3,0],[1,0],[3,0],[1,0]],t0+1000));
 const before=s.hoh;advanceRookies(s,t0+DAY_MS);
 assert.notEqual(s.hoh,before);assert.equal(s.hoh,1,'3 comentarios ganan a 1 comentario con muchos tics');assert.equal(s.pov,3,'empatados en comentarios frente a menos');
}
{
 const s=game(t0,{1:1,2:2,3:3});s.hoh=-901;
 setActivity(s,line([[1,0],[2,2],[1,0],[2,0]],t0+1000));
 advanceRookies(s,t0+DAY_MS);assert.equal(s.hoh,2,'mismos comentarios: gana quien tiene más tics');
}
// El spam no da actividad: del tercer comentario seguido en adelante no cuentan.
{
 const s=game(t0,{1:1,2:2,3:3});s.hoh=-901;
 setActivity(s,line([[1,0],[1,0],[1,0],[1,0],[1,0],[2,0],[3,0],[2,0],[3,0],[2,0]],t0+1000));
 advanceRookies(s,t0+DAY_MS);assert.equal(s.hoh,2,'3 comentarios reales ganan a 5 seguidos, de los que valen 2');
}
// Los mensajes escritos después del cierre no cuentan para el día que ya terminó, aunque la partida se actualice tarde.
{
 const s=game(t0,{1:1,2:2,3:3});s.hoh=-901;
 setActivity(s,[...line([[1,0]],t0+1000),...line([[2,0],[3,0],[2,0]],t0+DAY_MS+5000)]);
 advanceRookies(s,t0+DAY_MS+3600000);assert.equal(s.hoh,1,'solo cuenta el día que se cierra');
}
// Con los mismos puntos en la votación sale el nominado menos activo del día.
{
 const s=game(t0,{1:1,2:2,3:3});advanceRookies(s,t0+DAY_MS);
 const quiet=s.players.find(p=>p.bot&&p.id!==s.hoh).id;s.nominees=[1,2,3,quiet];s.saved=null;
 s.ballots={x:{1:1,2:1,3:1,[quiet]:1}};
 s.players.filter(p=>p.bot&&!s.nominees.includes(p.id)).forEach(p=>{p.bot=false;});
 setActivity(s,line([[1,0],[2,0],[3,0],[1,0],[2,0]],t0+DAY_MS+1000));
 advanceRookies(s,t0+2*DAY_MS);
 assert.equal(s.players.find(p=>p.id===quiet).status,'eliminated','sin comentarios sale primero');
 assert.deepEqual(s.players.filter(p=>p.id===1||p.id===2).map(p=>p.status),['active','active'],'los dos más activos siguen');
 assert.equal(s.players.find(p=>p.id===3).status,'eliminated','el menos activo de los usuarios sale');
}
// La final se decide igual.
{
 const s=game(t0);let at=t0;
 for(let i=0;i<15&&s.phase==='day';i++){at+=DAY_MS;advanceRookies(s,at);}
 assert.equal(s.phase,'finale');const [a,b,c,d]=alive(s);a.bot=b.bot=c.bot=d.bot=false;
 setActivity(s,[...line([[a.id,0],[b.id,3],[a.id,0],[b.id,0],[c.id,0]],at+1000),...line([[c.id,0],[d.id,0],[c.id,0],[d.id,0],[c.id,0]],at+FINALE_MS+1000)]);
 advanceRookies(s,at+FINALE_MS+60000);
 assert.equal(s.phase,'finished');assert.equal(s.winner,b.username,'empate a comentarios en la final: ganan los tics');
 assert.equal(s.players.find(p=>p.id===c.id).placement,3,'lo escrito tras la final no cuenta');
}
// El registro del chat nunca se guarda en la partida.
{
 const s=game(t0);setActivity(s,line([[1,0]],t0+1000));advanceRookies(s,t0+DAY_MS);
 assert.ok(!('chatLog' in s));assert.ok(!JSON.stringify(s).includes('chatLog'));
}
// Casting sigue sumando igual: quien solo hace spam sigue apareciendo, y solo cuentan sus dos primeros comentarios.
assert.deepEqual([...totalPosis([{user_id:1,score:1},{user_id:1,score:1},{user_id:1,score:1},{user_id:2,score:0}])],[[1,20],[2,0]]);
console.log('PASS Rookies: gana quien más comenta y los tics solo desempatan, sin spam ni mensajes fuera de plazo.');
