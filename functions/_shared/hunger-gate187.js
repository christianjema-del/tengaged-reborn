import {validStart172} from './manual-start172.js';
export function validHungerClock187(s){return Number.isFinite(s.startedAt)&&s.startedAt>=s.createdAt&&Number.isFinite(s.tickAt)&&s.tickAt>=s.startedAt;}
export function enforceHunger187(s){
 s.manualGate187=true;
 if(s.phase==='active'&&(!validStart172(s,'hunger')||!validHungerClock187(s))){
  s.invalidStart187??={at:Date.now(),phase:s.phase,startedAt:s.startedAt??null,tickAt:s.tickAt??null};
  s.phase='waiting';s.startAt=null;delete s.manualStart172;delete s.manualStart160;
  s.manualPause160={at:Date.now(),clockAt:Date.now()};
 }
 if(s.phase==='waiting'&&!validStart172(s,'hunger')){s.startAt=null;if(!s.runId)s.runId=crypto.randomUUID();}
 return s;
}
