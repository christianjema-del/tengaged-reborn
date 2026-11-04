import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as extras} from '../functions/api/profile-extras.js';
import {onRequest as friends} from '../functions/api/friends.js';
import {onRequest as mail} from '../functions/api/mail.js';
import {onRequest as groups} from '../functions/api/groups.js';
import {onRequest as questions} from '../functions/api/questions.js';
import {onRequest as blog} from '../functions/api/blog.js';
import {onRequest as feed} from '../functions/api/community-feed.js';
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)");
class S{
 constructor(q,args=[]){this.q=q;this.args=args;}
 bind(...args){return new S(this.q,args);}
 async first(){return sql.prepare(this.q).get(...this.args)||null;}
 async all(){return {results:sql.prepare(this.q).all(...this.args)};}
 async run(){const r=sql.prepare(this.q).run(...this.args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let id=1;id<=4;id++){
 sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['Alice','Bob','Carol','Dave'][id-1]);
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex');
 sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');
}
async function call(fn,path,user=1,body,method,origin='https://test.local'){
 const r=await fn({request:new Request('https://test.local/'+path,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}

const {onRequest:designs}=await import('../functions/api/designs.js');const {COLOR_LEVELS}=await import('../color-level-catalog.js');const made=await call(designs,'api/designs',1,{title:'Prueba de diseño',description:'Prueba',theme_code:'rose',price:0,layer_type:'profile'});assert.equal(made.status,201);const id=made.id;assert.equal((await call(designs,'api/designs',1,{action:'vote',design_id:id,value:1})).status,403);for(const c of COLOR_LEVELS){sql.prepare('UPDATE user_inventory SET is_equipped=0 WHERE user_id=2').run();sql.prepare('INSERT INTO user_inventory(user_id,item_code,is_equipped) VALUES(?,?,1) ON CONFLICT(user_id,item_code) DO UPDATE SET is_equipped=1').run(2,c.itemCode);assert.equal((await call(designs,'api/designs',2,{action:'vote',design_id:id,value:1,weight:99999})).status,200);let d=await call(designs,'api/designs?id='+id,2);assert.equal(d.designs[0].likes,1+c.power);assert.equal(d.designs[0].my_vote,1);await call(designs,'api/designs',2,{action:'vote',design_id:id,value:-1});assert.equal((await call(designs,'api/designs?id='+id,2)).designs[0].likes,1-c.power);await call(designs,'api/designs',2,{action:'vote',design_id:id,value:0});assert.equal((await call(designs,'api/designs?id='+id,2)).designs[0].likes,1);}sql.prepare("UPDATE community_designs SET created_at=datetime('now','-4 days') WHERE id=?").run(id);assert.equal((await call(designs,'api/designs',2,{action:'vote',design_id:id,value:1})).status,409);
const {fresh,act,advance,view}=await import('../functions/_shared/hunger.js');const now=Date.now(),owner={id:1,username:'admin1',is_admin:1},s=fresh(now);act(s,owner,{action:'join'},now);act(s,owner,{action:'fill_bots'},now);act(s,owner,{action:'start'},now);assert.equal(s.players.length,30);for(const [i,p] of s.players.filter(p=>p.bot).entries()){p.health=0;p.placement=i+2;p.eliminatedAt=now;}advance(s,now+1);assert.equal(s.phase,'finished');assert.deepEqual(s.players[0].prize,{karma:140,money:300});assert.equal(view(s,owner,now+1).myPrize.reduced,false);const n=s.ops.length;advance(s,now+1000);assert.equal(s.ops.length,n);assert.equal(s.ops.filter(x=>x.key.includes(':prize:')).length,1);
console.log('PASS 20 design vote powers, negative/unvote, forged weight ignored, own/expired rejection and full bot-game prizes without repeats.');
