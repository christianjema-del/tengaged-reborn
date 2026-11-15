import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {freshRace,actRace} from '../functions/_shared/race356.js';
// V370: Race #53 (EVENTO) dura 4 horas por etapa en vez de los 8 minutos normales; el resto de Race no cambia.
// Además, el API debe aceptar pause/resume (antes daban "Acción no permitida").
const ana={id:20,username:'Ana'},admin={id:1,username:'admin1',is_admin:1};
{
 const s=freshRace(53,0);actRace(s,ana,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);actRace(s,admin,{action:'start'},0);
 assert.equal(s.deadline,4*60*60000,'Race #53 dura 4 horas por etapa');
}
{
 const s=freshRace(54,0);actRace(s,ana,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);actRace(s,admin,{action:'start'},0);
 assert.equal(s.deadline,8*60000,'el resto de Race sigue durando 8 minutos por etapa');
}
assert.match(readFileSync(new URL('../functions/api/race.js',import.meta.url),'utf8'),/'pause','resume'/,'el API acepta pausar y reanudar');
console.log('PASS V370: Race #53 dura 4 horas por etapa; pause/resume permitidos en el API');
