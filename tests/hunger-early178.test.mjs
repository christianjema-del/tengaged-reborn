import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {fresh,advance} from '../functions/_shared/hunger.js';
const now=Date.now(),s=fresh(now,4);s.phase='active';s.startedAt=now;s.tickAt=now;s.nextDropAt=now+60000;s.manualStart160={by:'admin1',at:now};
s.players=Array.from({length:5},(_,i)=>({id:i===4?27:i+1,username:i===4?'Giovanni':'Player'+i,bot:false,health:i===4?0:70,placement:i===4?5:null,eliminatedAt:i===4?now:null,location:'forest',kills:0,arrows:0,experience:0}));
advance(s,now);assert.equal(s.phase,'active');assert.deepEqual(s.players[4].prize,{karma:20,money:20});
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,karma INTEGER,t_money INTEGER);INSERT INTO users VALUES(27,0,500);CREATE TABLE hunger_wallet(event_key TEXT PRIMARY KEY,user_id INTEGER,money INTEGER,karma INTEGER);CREATE TRIGGER wallet_apply AFTER INSERT ON hunger_wallet BEGIN UPDATE users SET karma=karma+NEW.karma,t_money=t_money+NEW.money WHERE id=NEW.user_id;END;');
function persist(){for(const op of s.ops)sql.prepare('INSERT OR IGNORE INTO hunger_wallet VALUES(?,?,?,?)').run(op.key,op.user,op.money,op.karma);}
persist();advance(s,now+1);persist();assert.equal(sql.prepare('SELECT karma FROM users WHERE id=27').get().karma,20);assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=27').get().t_money,520);
for(let i=1;i<4;i++){s.players[i].health=0;s.players[i].placement=i+1;s.players[i].eliminatedAt=now;}
advance(s,now+2);persist();assert.equal(s.phase,'finished');assert.equal(s.ops.filter(op=>op.key==='hunger:4:prize:27').length,1);assert.equal(sql.prepare('SELECT karma FROM users WHERE id=27').get().karma,20);assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=27').get().t_money,520);
console.log('PASS Giovanni receives 20 karma/20 T$ while Hunger 4 is active; repeated polls and final settlement do not pay twice.');
