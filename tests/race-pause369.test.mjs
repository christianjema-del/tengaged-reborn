import assert from 'node:assert/strict';
import {freshRace,actRace,advanceRace,raceView} from '../functions/_shared/race356.js';
// V369: admin1 o RelsB pueden pausar y reanudar una Race ya empezada; mientras está pausada, los plazos
// se congelan (no se elimina a nadie) y al reanudar se respeta el tiempo que quedaba.
const admin={id:1,username:'admin1',is_admin:1},relsb={id:11,username:'RelsB'},ana={id:20,username:'Ana'},T=0;
const s=freshRace(70,T);actRace(s,ana,{action:'join'},T);actRace(s,admin,{action:'fill_bots'},T);actRace(s,admin,{action:'start'},T+1000);
assert.equal(raceView(s,admin,T+2000).canPause,true);assert.equal(raceView(s,ana,T+2000).canPause,false,'Ana no es admin1 ni RelsB');
assert.throws(()=>actRace(s,ana,{action:'pause'},T+2000),/admin1/);
actRace(s,relsb,{action:'pause'},T+2000);
assert.equal(raceView(s,admin,T+2000).paused,true);
assert.throws(()=>actRace(s,ana,{action:'transport',kind:'bus',stage:s.stage},T+3000),/pausada/,'nadie puede jugar mientras está pausada');
const deadlineBeforeResume=s.deadline;
advanceRace(s,s.deadline+999999);assert.equal(s.phase,'leg','no avanza de etapa mientras está pausada, aunque pase el tiempo');
actRace(s,admin,{action:'resume'},T+2000+60000);
assert.equal(s.deadline,deadlineBeforeResume+60000,'el tiempo pausado se añade al plazo');
assert.equal(raceView(s,admin,T+2000+60000).paused,false);
console.log('PASS V369: pausar/reanudar Race (admin1 o RelsB), sin perder tiempo de etapa');
