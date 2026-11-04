import assert from 'node:assert/strict';
import {fresh,advance,act} from '../functions/_shared/hunger.js';
const T=Date.now(),admin={id:100,username:'admin1',is_admin:true};
const s=fresh(T-100000,4);s.manualStartVersion=160;s.phase='active';s.startedAt=T-100000;s.tickAt=T-100000;s.manualStart160={by:'admin1',at:T-100000};
s.players=['Peach','Lamine','Cristi','PauCubarsi','Other','Tributo_01'].map((username,i)=>({id:i===5?-1:i+1,username,bot:i===5,health:2,placement:i+1,weapon:'axe',arrows:0,experience:10,notifyOnStart:true}));
s.ops=[{key:'hunger:4:entry:1',user:1,money:-20,karma:0}];s.receipts=['receipt-before'];s.fights=[{id:'old'}];s.manualPause160={at:T};
advance(s,T);
assert.deepEqual(s.players.map(p=>p.username),['Peach','Lamine','Cristi','PauCubarsi']);assert.equal(s.phase,'waiting');assert.equal(s.startAt,null);assert.equal(s.startedAt,undefined);assert.equal(s.fights.length,0);assert.equal(s.manualPause160,undefined);assert.equal(s.manualStart160,undefined);assert.equal(s.reopening161.previous.players.length,6);
assert.ok(s.players.every(p=>p.health===70&&p.weapon===null&&p.placement===null));assert.equal(s.ops.length,1);
const snapshot=JSON.stringify(s);advance(s,T+100000000);assert.equal(JSON.stringify(s),snapshot);
act(s,{id:99,username:'NewHuman'},{action:'join'},T+100000000);assert.equal(s.players.length,5);assert.equal(s.phase,'waiting');assert.throws(()=>act(s,{...admin,username:'AnotherAdmin'},{action:'start'},T+100000000));
act(s,admin,{action:'start'},T+100000001);assert.equal(s.phase,'active');assert.equal(s.players.length,5,'start does not add bots');assert.equal(s.startedAt,T+100000001);advance(s,T+100000002);assert.equal(s.players.length,5,'recovery never repeats');
for(const edition of [3,5]){const g=fresh(T,edition);advance(g,T);assert.equal(g.reopening161,undefined);}
console.log('PASS V161 Hunger: exactly four retained, full snapshot, reopened registrations, no charge for retained users, no automatic start/fill, one-time recovery.');
