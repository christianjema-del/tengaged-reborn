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

const created=await call(blog,'api/blog',1,{title:'Blog @Bob',body:'Mención real a @Bob y texto <script>alert(1)</script>'});assert.equal(created.status,200);const id=created.id;await call(blog,'api/blog',2,{action:'vote',post_id:id,value:1});let data=await call(blog,'api/blog?id='+id,2);assert.equal(data.posts[0].plus_count,2);assert.equal(data.posts[0].top_rank,1);assert.equal(data.trending[0].username,'Bob');assert.equal(data.trending[0].count,1);await call(blog,'api/blog',2,{action:'comment',post_id:id,body:'Comentario de Bob'});data=await call(blog,'api/blog?id='+id,1);const cid=data.comments[0].id;assert.equal((await call(blog,'api/blog',2,{action:'comment_vote',comment_id:cid,value:1})).status,403);assert.equal((await call(blog,'api/blog',0,{action:'comment_vote',comment_id:cid,value:1})).status,401);assert.equal((await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:1},undefined,'https://wrong.local')).status,403);await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:1});await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:1});data=await call(blog,'api/blog?id='+id,1);assert.equal(data.comments[0].plus_count,1);assert.equal(data.comments[0].my_vote,1);await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:-1});data=await call(blog,'api/blog?id='+id,1);assert.equal(data.comments[0].plus_count,1);assert.equal(data.comments[0].minus_count,0);await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:0});assert.equal((await call(blog,'api/blog?id='+id,1)).comments[0].minus_count,0);
sql.prepare("UPDATE blog_posts SET created_at=datetime('now','-25 hours') WHERE id=?").run(id);data=await call(blog,'api/blog?id='+id,1);assert.equal(data.posts[0].top_rank,0);assert.equal(data.posts[0].voting_open,1);assert.equal((await call(blog,'api/blog?sort=today',1)).posts.length,0);sql.prepare("UPDATE blog_posts SET created_at=datetime('now','-4 days') WHERE id=?").run(id);assert.equal((await call(blog,'api/blog',2,{action:'vote',post_id:id,value:1})).status,409);assert.equal((await call(blog,'api/blog?sort=previous',1)).posts.length,1);await call(blog,'api/blog',1,{action:'comment_vote',comment_id:cid,value:1});assert.equal((await call(blog,'api/blog?id='+id,2,undefined,'DELETE')).status,403);assert.equal((await call(blog,'api/blog?id='+id,1,undefined,'DELETE')).status,200);assert.equal(sql.prepare('SELECT COUNT(*) n FROM blog_comment_votes').get().n,0);assert.equal((await call(blog,'api/blog?id='+id,1)).posts.length,0);
console.log('PASS blogs: actual mentions, top-24h and 72h window, counts, safe text, comment votes auth/CSRF/idempotence, permissions and delete cleanup.');
