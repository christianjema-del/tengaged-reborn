import assert from 'node:assert/strict';
import {freshRookies,advanceRookies,actRookies,rookiesView,alive,votersOf,DAY_MS,FINALE_MS,setActivity} from '../functions/_shared/rookies-engine.js';
const t0=Date.now(),admin={id:999,username:'admin1',is_admin:1},us=Array.from({length:13},(_,i)=>({id:i+1,username:'U'+(i+1)}));
const s=freshRookies(7,t0);for(const u of us)actRookies(s,u,{action:'join'},t0);
assert.throws(()=>actRookies(s,{id:1,username:'U1'},{action:'start'},t0));assert.throws(()=>actRookies(s,{id:50,username:'X'},{action:'join'},t0));actRookies(s,admin,{action:'start'},t0);
assert.equal(s.phase,'day');assert.equal(s.day,1);assert.equal(s.deadline,t0+DAY_MS);assert.equal(s.nominees.length,0);
let hoh=s.players.find(p=>p.id===s.hoh);
assert.throws(()=>actRookies(s,{id:hoh.id===1?2:1},{action:'nominate',targets:[3,4]},t0),'solo el HoH');assert.throws(()=>actRookies(s,hoh,{action:'nominate',targets:[hoh.id,3]},t0));
const picks=alive(s).filter(p=>p.id!==hoh.id).slice(0,2).map(p=>p.id);actRookies(s,hoh,{action:'nominate',targets:picks},t0);
assert.equal(s.nominees.length,0,'las nominaciones cuentan al día siguiente');advanceRookies(s,t0+DAY_MS-1);assert.equal(s.day,1,'el día dura 24 horas');
advanceRookies(s,t0+DAY_MS);assert.equal(s.day,2);assert.equal(s.nominees.length,4);for(const id of picks)assert.ok(s.nominees.includes(id));assert.ok(!s.nominees.includes(s.hoh));
const nominee=s.players.find(p=>p.id===s.nominees[0]),ballot=Object.fromEntries(s.nominees.map((id,i)=>[id,i]));
assert.throws(()=>actRookies(s,nominee,{action:'vote',ballot},t0+DAY_MS),/nominados no pueden/);
const voter=votersOf(s)[0];assert.throws(()=>actRookies(s,voter,{action:'vote',ballot:{...ballot,[s.nominees[0]]:1}},t0+DAY_MS),/una sola vez/);
assert.equal(rookiesView(s,voter).me.isPov,voter.id===s.pov);assert.ok(!JSON.stringify(rookiesView(s,{id:s.hoh})).includes('"pov"'),'el PoV es secreto');
const expected=Object.fromEntries(s.nominees.map((id,i)=>[id,i]));for(const p of votersOf(s))actRookies(s,p,{action:'vote',ballot:expected},t0+DAY_MS);
const [,,third,fourth]=s.nominees;const pov=s.players.find(p=>p.id===s.pov);
if(s.nominees.includes(pov.id))assert.equal(rookiesView(s,pov).me.canVote,false);actRookies(s,pov,{action:'save',target:fourth},t0+DAY_MS);
assert.throws(()=>actRookies(s,hoh.id===pov.id?{id:s.players.find(p=>p.id!==pov.id).id}:hoh,{action:'save',target:fourth},t0+DAY_MS),/PoV/);
advanceRookies(s,t0+2*DAY_MS);assert.equal(s.players.find(p=>p.id===fourth).status,'active','el salvado no sale');assert.equal(s.players.filter(p=>p.status==='eliminated').length,2,'con cuatro nominados salen los dos con más puntos');assert.equal(s.players.find(p=>p.id===third).placement,13);
let at=t0+2*DAY_MS;for(let i=0;i<20&&s.phase==='day';i++){at+=DAY_MS;advanceRookies(s,at);if(s.phase==='day'&&alive(s).length===5)assert.equal(s.nominees.length,3,'final de cinco con tres nominados');}
assert.equal(s.phase,'finale');assert.equal(alive(s).length,4);assert.equal(s.nominees.length,0,'sin nominaciones en la final');assert.equal(s.deadline-at,FINALE_MS);
const [a,b,c,d]=alive(s);{const chat=(p,n)=>Array.from({length:n},(_,i)=>[{user_id:p.id,score:0,created_at:new Date(t0+1000+i*2000).toISOString()},{user_id:0,score:0,created_at:new Date(t0+2000+i*2000).toISOString()}]).flat();setActivity(s,[...chat(a,3),...chat(b,30),...chat(c,9),...chat(d,1)].sort((x,y)=>x.created_at<y.created_at?-1:1));}advanceRookies(s,at+FINALE_MS);assert.equal(s.phase,'finished');assert.equal(s.winner,b.username,'gana el más activo de todo el juego');assert.deepEqual([b,c,a,d].map(p=>p.placement),[1,2,3,4]);
assert.deepEqual(s.players.map(p=>p.placement).sort((x,y)=>x-y),Array.from({length:13},(_,i)=>i+1));
// Los puntos van de 0 a 3 y los votos antiguos, de 1 a 4, cuentan igual al cerrar el día.
{const v=freshRookies(8,t0);for(const u of us)actRookies(v,u,{action:'join'},t0);actRookies(v,admin,{action:'start'},t0);advanceRookies(v,t0+DAY_MS);assert.deepEqual(rookiesView(v,us[0]).points,[0,1,2,3]);
 const [a,b,c,d]=v.nominees,voter=votersOf(v);v.ballots[voter[0].id]={[a]:4,[b]:3,[c]:2,[d]:1};actRookies(v,voter[1],{action:'vote',ballot:{[a]:3,[b]:2,[c]:1,[d]:0}},t0+DAY_MS);assert.throws(()=>actRookies(v,voter[2],{action:'vote',ballot:{[a]:4,[b]:3,[c]:2,[d]:1}},t0+DAY_MS),/una sola vez/,'el 4 ya no es válido');
 advanceRookies(v,t0+2*DAY_MS);assert.deepEqual(v.history[0].rows.find(r=>r.username===v.players.find(p=>p.id===d).username).points,0,'el voto antiguo no suma de más');assert.equal(v.history[0].rows[0].out,true);}
console.log('PASS Rookies: días de 24 h, HoH, nominaciones al día siguiente, votos, PoV secreto, final de cinco y de cuatro.');
