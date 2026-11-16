import assert from 'node:assert/strict';
import {freshRace,actRace} from '../functions/_shared/race356.js';
// V380: Vort y Cristi ya no van siempre juntos; las parejas son aleatorias entre usuarios reales también
// cuando ambos coinciden.
const admin={id:1,username:'admin1',is_admin:1},vort={id:11,username:'Vort'},cristi={id:13,username:'Cristi'},others=[{id:20,username:'Ana'},{id:21,username:'Leo'}];
let together=0;
for(let i=0;i<30;i++){
 const s=freshRace(141+i,0);actRace(s,vort,{action:'join'},0);actRace(s,cristi,{action:'join'},0);for(const o of others)actRace(s,o,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);actRace(s,admin,{action:'start'},0);
 const v=s.players.find(p=>p.id===11),c=s.players.find(p=>p.id===13);
 if(v.pair===c.pair)together++;
 const vPartner=s.players.find(p=>p.pair===v.pair&&p.id!==v.id),cPartner=s.players.find(p=>p.pair===c.pair&&p.id!==c.id);
 assert.ok(!vPartner.bot,'Vort no se empareja con un bot');assert.ok(!cPartner.bot,'Cristi no se empareja con un bot');
}
assert.ok(together<30,'Vort y Cristi no siempre quedan en la misma pareja (ya no hay regla fija)');
console.log('PASS V380: sin pareja forzada entre Vort y Cristi; '+together+'/30 veces coincidieron por azar');
