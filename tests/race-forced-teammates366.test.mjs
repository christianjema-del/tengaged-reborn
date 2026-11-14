import assert from 'node:assert/strict';
import {freshRace,actRace} from '../functions/_shared/race356.js';
// V366: a petición de administración, RelsB y Cristi siempre quedan en la misma pareja cuando coinciden en una Race.
const admin={id:1,username:'admin1',is_admin:1},relsb={id:11,username:'RelsB'},cristi={id:13,username:'Cristi'};
for(let i=0;i<20;i++){
 const s=freshRace(1000+i,Date.UTC(2026,10,14,12,0));
 actRace(s,relsb,{action:'join'},0);actRace(s,cristi,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);
 actRace(s,admin,{action:'start'},1000);
 const r=s.players.find(p=>p.id===11),c=s.players.find(p=>p.id===13);
 assert.equal(r.pair,c.pair,'RelsB y Cristi deben quedar en la misma pareja (intento '+i+')');
}
console.log('PASS V366: RelsB y Cristi siempre son pareja en Race cuando ambos juegan');
