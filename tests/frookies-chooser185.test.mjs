import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {fresh,act,advance,view,finalChooser185} from '../functions/_shared/frookies-engine.js';
const now=Date.now();
for(const id of [4,5,6]){
 const s=fresh(id,now);s.phase='final_places';s.rules158=true;s.round=10;s.startedAt=now;s.phaseStartedAt=now;s.deadline=now+120000;s.hoh='HoH';s.pov='PoV';s.finalists=['HoH','PoV'];s.players=['HoH','PoV','Third','Fourth'].map((username,i)=>({id:i+1,username,status:'active',placement:null,bot:false,tie:i}));
 const chooser=id===4?'HoH':'PoV',other=id===4?'PoV':'HoH';assert.equal(finalChooser185(s),chooser);assert.equal(view(s,{username:chooser},now).finalChooser,chooser);
 const input={action:'final_places',round:10,phase:'final_places',third:'Third',fourth:'Fourth'};
 assert.throws(()=>act(s,{username:other},input,now+1000),/Solo/);act(s,{username:chooser},input,now+1000);advance(s,s.pending146.at);assert.equal(s.phase,'jury');assert.equal(s.players[2].placement,3);assert.equal(s.players[3].placement,4);assert.deepEqual(s.finalists,['HoH','PoV']);
}
const source=readFileSync(new URL('../functions/_shared/frookies-service.js',import.meta.url),'utf8');assert.equal(source.includes('restorePeach184(s,now)'),false,'#4 must not receive the superseded administrative restoration');
console.log('PASS Frookies #4 retains HoH choice; other editions allow PoV only, preserve immune finalists and assign positions; superseded #4 restoration is disabled.');
