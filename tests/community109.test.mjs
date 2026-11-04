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

const {ensureCommunitySchema}=await import('../functions/_shared/community.js');await ensureCommunitySchema(db);sql.exec('CREATE TABLE blog_votes(post_id INTEGER,user_id INTEGER,value INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(post_id,user_id))');sql.prepare("INSERT INTO user_inventory(user_id,item_code,is_equipped) VALUES(2,'color-card-yellow',1)").run();sql.prepare('INSERT INTO blog_votes(post_id,user_id,value) VALUES(99,2,1)').run();
const {COLOR_LEVELS}=await import('../color-level-catalog.js');const {onRequestGet:hof}=await import('../functions/api/hall-of-fame.js');const created=await call(blog,'api/blog',1,{title:'Poder de voto',body:'Hola @Bob'});assert.equal(created.status,200);assert.equal(sql.prepare('SELECT weight FROM blog_votes WHERE post_id=99').get().weight,2);sql.prepare('DELETE FROM blog_votes WHERE post_id=99').run();const id=created.id;
for(const level of COLOR_LEVELS){
 sql.prepare('UPDATE user_inventory SET is_equipped=0 WHERE user_id=2').run();sql.prepare('INSERT INTO user_inventory(user_id,item_code,is_equipped) VALUES(?,?,1) ON CONFLICT(user_id,item_code) DO UPDATE SET is_equipped=1').run(2,level.itemCode);
 const target=(await call(blog,'api/blog',1,{title:'Tarjeta '+level.code,body:'Prueba @Bob'})).id;
 await call(blog,'api/blog',2,{action:'vote',post_id:target,value:1,weight:999999});let data=await call(blog,'api/blog?id='+target,2);assert.equal(data.posts[0].score,1+level.power);assert.equal(data.posts[0].plus_count,1+level.power);assert.equal(data.vote_power,level.power);
 assert.equal((await call(blog,'api/blog',2,{action:'vote',post_id:target,value:-1})).status,409);assert.equal((await call(blog,'api/blog',2,{action:'vote',post_id:target,value:0})).status,400);assert.equal((await call(blog,'api/blog?id='+target,2)).posts[0].score,1+level.power);
}

await call(blog,'api/blog',1,{action:'comment',post_id:id,body:'Comentario para votar'});let data=await call(blog,'api/blog?id='+id,2);const cid=data.comments[0].id;await call(blog,'api/blog',2,{action:'comment_vote',comment_id:cid,value:1});assert.equal((await call(blog,'api/blog?id='+id,2)).comments[0].plus_count,40);
let res=await hof({env:{DB:db}});assert.equal(res.status,200);data=await res.json();assert.equal(data.leaders.length,4);assert.ok(data.trending.some(x=>x.username==='Bob'));assert.equal(data.monthly.length,0);sql.prepare('UPDATE users SET karma=karma+30 WHERE id=2').run();data=await (await hof({env:{DB:db}})).json();assert.equal(data.monthly[0].username,'Bob');assert.equal(data.monthly[0].value,30);assert.equal(data.leaders[0].username,'Bob');assert.equal(data.leaders[0].color_code,'diamond');
console.log('PASS all 20 card vote weights, locked positive/negative policy, forged weight ignored, comment weight, HOF real colors and monthly baseline increments.');
