import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fresh,act,advance,compactBallots319} from '../functions/_shared/casting-daily.js';
function game(t){const s=fresh(9,t);for(let i=0;i<8;i++)act(s,{username:'P'+i},{action:'join'},t);s.phase='elimination';s.round=3;s.dayStartedAt=t;s.deadline=t+12*3600000;for(const p of s.players){p.status='active';p.bot=false;p.lastActiveAt=p.lastChatAt=t;p.health=70;p.idleCharged=0;}s.nominees=['P5','P6','P7'];s.ballots={};return s;}
test('V319: un nominado no muere por inactividad mientras dura la votación',()=>{
 const t=Date.now(),s=game(t);const nom=s.players.find(p=>p.username==='P7'),other=s.players.find(p=>p.username==='P1');nom.health=1;other.health=1;nom.lastChatAt=other.lastChatAt=t-6*3600000;
 advance(s,t+60000);assert.equal(nom.status,'active');assert.ok(nom.health>=1);assert.ok(s.nominees.includes('P7'));assert.equal(other.status,'eliminated');
});
test('V319: si sale un nominado, las papeletas se reajustan a 1..n conservando el orden',()=>{
 const t=Date.now(),s=game(t);s.ballots={p0:{P5:1,P6:2,P7:3},p1:{P5:3,P6:1,P7:2}};s.nominees=['P5','P7'];compactBallots319(s,'P6');
 assert.deepEqual(s.ballots.p0,{P5:1,P7:2});assert.deepEqual(s.ballots.p1,{P5:2,P7:1});
});
test('V319: se pueden cambiar los votos hasta que acabe el día',()=>{
 const t=Date.now(),s=game(t);act(s,{username:'P0'},{action:'evict',round:3,points:{P5:3,P6:2,P7:1}},t);act(s,{username:'P0'},{action:'evict',round:3,points:{P5:1,P6:2,P7:3}},t+1);assert.deepEqual(s.ballots.p0,{P5:1,P6:2,P7:3});
 const ui=fs.readFileSync(new URL('../casting-vote.js',import.meta.url),'utf8');assert.match(ui,/Cambiar votos/);assert.ok(!ui.includes('input.disabled=s.me.hasVoted'));
});
