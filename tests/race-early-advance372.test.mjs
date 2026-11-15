import assert from 'node:assert/strict';
import {freshRace,actRace,advanceRace} from '../functions/_shared/race356.js';
// V372: en Race #53 (evento), si todos los viajeros vivos ya jugaron la prueba, la etapa cambia un
// minuto después, sin esperar las 4 horas; el resto de Race sigue esperando su plazo normal.
const admin={id:1,username:'admin1',is_admin:1},ana={id:20,username:'Ana'};
{
 const s=freshRace(53,0);actRace(s,ana,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);actRace(s,admin,{action:'start'},0);
 actRace(s,ana,{action:'flash_start',stage:s.stage,kind:s.challenge},1000,true);const token=s.runs[20].token;
 actRace(s,ana,{action:'flash_finish',stage:s.stage,kind:s.challenge,token,points:100},2000,true);
 advanceRace(s,2001);
 advanceRace(s,30000);assert.equal(s.leg,1,'todavía no ha pasado 1 minuto desde que todos terminaron');
 advanceRace(s,2001+60000+1);assert.equal(s.leg,2,'cambia de etapa al minuto de que todos (incluidos los bots) terminaran');
}
{
 const s=freshRace(54,0);actRace(s,ana,{action:'join'},0);actRace(s,admin,{action:'fill_bots'},0);actRace(s,admin,{action:'start'},0);
 actRace(s,ana,{action:'flash_start',stage:s.stage,kind:s.challenge},1000,true);const token=s.runs[20].token;
 actRace(s,ana,{action:'flash_finish',stage:s.stage,kind:s.challenge,token,points:100},2000,true);
 advanceRace(s,2001);
 advanceRace(s,2001+60000+1);assert.equal(s.leg,1,'el resto de Race sigue esperando su plazo de 8 minutos aunque todos hayan jugado');
}
console.log('PASS V372: Race #53 cambia de etapa un minuto después de que todos jueguen, sin esperar 4 horas');
