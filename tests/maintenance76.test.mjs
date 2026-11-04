import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fresh as freshCurrent,act} from '../functions/_shared/hunger.js';
const fresh=(...args)=>({...freshCurrent(...args),rulesVersion:76});
const now=Date.now(),a={id:1,username:'Alice'},b={id:2,username:'Bob'};
for(const saved of [false,true]){const s=fresh(now,76);act(s,a,{action:'join'},now);act(s,b,{action:'join'},now);s.phase='active';s.startedAt=s.tickAt=now;act(s,b,{action:'enter'},now);act(s,a,{action:'attack',target:2},now);if(saved)s.fights[0].runs[1]={saved:true,recorded:true,score:100};s.bonuses=[{id:'target',kind:'target',claimedBy:null,expiresAt:now+10000}];const arrows=s.players[0].arrows;act(s,a,{action:'claim_bonus',bonusId:'target'},now);assert.equal(s.players[0].arrows,arrows+3);assert.equal(s.bonuses[0].claimedBy,1);assert.throws(()=>act(s,b,{action:'claim_bonus',bonusId:'target'},now));assert.equal(s.fights[0].endedAt,undefined);}
for(const file of ['index','games','hunger','profile','casting']){const content=readFileSync(new URL('../'+file+'.html',import.meta.url),'utf8');assert.doesNotMatch(content,/href="\/(mobile|diagnostico)\.html"/);}
assert.ok(existsSync(new URL('../normas.html',import.meta.url)));assert.match(readFileSync(new URL('../shell.js',import.meta.url),'utf8'),/href="\/normas.html"/);
console.log('PASS targets during unsaved/saved fights, one claimant, no forced fight result, removed recovery sections and shared rules.');
