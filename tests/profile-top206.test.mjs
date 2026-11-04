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


const first=await call(blog,'api/blog',1,{title:'Primero',body:'Texto'});assert.equal(first.status,200);
let d=await call(blog,'api/blog?author=Alice',0);assert.equal(d.posts[0].best_top_rank,1);
const second=await call(blog,'api/blog',2,{title:'Segundo',body:'Otro texto'});
d=await call(blog,'api/blog?author=Alice',0);assert.equal(d.posts[0].top_rank,2);assert.equal(d.posts[0].best_top_rank,1,'best rank cannot worsen');
sql.prepare("UPDATE blog_posts SET created_at=datetime('now','-48 hours') WHERE id=?").run(first.id);
d=await call(blog,'api/blog?author=Alice',0);assert.equal(d.posts[0].top_rank,0);assert.equal(d.posts[0].best_top_rank,1,'historical badge survives leaving daily top');
const archived=await call(blog,'api/blog',3,{title:'Never observed in top',body:'Old'});sql.prepare("UPDATE blog_posts SET created_at=datetime('now','-48 hours') WHERE id=?").run(archived.id);
d=await call(blog,'api/blog?author=Carol',0);assert.equal(d.posts[0].best_top_rank,0,'do not fabricate old top ranks');
for(let n=0;n<3;n++)await call(blog,'api/blog?author=Alice',0);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM blog_top206 WHERE post_id=?').get(first.id).n,1);
console.log('PASS V206 public profiles: real daily rank, durable best rank, expiry, no invented historic awards, idempotent observations');
