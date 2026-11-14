import assert from 'node:assert/strict';
import {freshRace,actRace,advanceRace} from '../functions/_shared/race356.js';
// V367: Race #53 es un EVENTO (ver games-directory.js): no se autocompleta con bots ni arranca sola a los
// 10 minutos como el resto de Race; solo admin1 o RelsB pueden iniciarla a mano.
const ana={id:20,username:'Ana'},AUTO_START_MS=10*60000;
{
 const s=freshRace(53,0);actRace(s,ana,{action:'join'},0);
 advanceRace(s,AUTO_START_MS+1000);
 assert.equal(s.phase,'waiting','Race #53 no arranca sola');assert.equal(s.players.length,1,'Race #53 no se rellena con bots sola');
}
{
 const s=freshRace(54,0);actRace(s,ana,{action:'join'},0);
 advanceRace(s,AUTO_START_MS+1000);
 assert.equal(s.phase,'leg','el resto de Race sigue arrancando sola a los 10 minutos');assert.equal(s.players.length,12);
}
console.log('PASS V367: Race #53 solo arranca a mano (admin1 o RelsB)');
