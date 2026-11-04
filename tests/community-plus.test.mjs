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
assert.equal((await call(mail,'api/mail',0)).status,401);
assert.equal((await call(mail,'api/mail',1,{action:'send',recipient:'Bob',subject:'Hello',body:'Private message'})).status,200);
assert.equal((await call(mail,'api/mail',2)).unread,1);
assert.equal((await call(mail,'api/mail',3)).messages.length,0);
assert.equal((await call(mail,'api/mail?with=Bob',3)).messages.length,0);
const mid=(await call(mail,'api/mail',2)).messages[0].id;
await call(mail,'api/mail',3,{action:'read',id:mid});
assert.equal((await call(mail,'api/mail',2)).unread,1);
await call(mail,'api/mail',2,{action:'read',id:mid});
assert.equal((await call(mail,'api/mail',2)).unread,0);
await call(mail,'api/mail',2,{action:'block',recipient:'Alice'});
assert.equal((await call(mail,'api/mail',1,{action:'send',recipient:'Bob',subject:'Hi',body:'Blocked'})).status,403);
await call(mail,'api/mail',2,{action:'unblock',recipient:'Alice'});
assert.equal((await call(mail,'api/mail',1,{action:'send',recipient:'Bob',body:'Too soon'})).status,429);
assert.equal((await call(mail,'api/mail',1,{action:'send',recipient:'Bob',body:'CSRF'},undefined,'https://other.local')).status,403);
assert.equal((await call(questions,'api/questions?user=Alice',2,{action:'ask',question:'How are you?'})).status,200);
assert.equal((await call(questions,'api/questions?user=Alice',0)).questions.length,0);
assert.equal((await call(questions,'api/questions?user=Alice',3)).questions.length,0);
const q=(await call(questions,'api/questions?user=Alice',1)).questions[0];
assert.equal((await call(questions,'api/questions?user=Alice',2,{action:'answer',id:q.id,answer:'Forged'})).status,403);
await call(questions,'api/questions?user=Alice',1,{action:'answer',id:q.id,answer:'Great!'});
assert.equal((await call(questions,'api/questions?user=Alice',0)).questions[0].answer,'Great!');
const g=await call(groups,'api/groups',1,{action:'create',name:'Private group',description:'Test',admission:'private'});
assert.equal(g.status,200);const gid=g.id;
assert.equal((await call(groups,'api/groups?id='+gid,0)).can_read,false);
await call(groups,'api/groups?id='+gid,2,{action:'join'});
assert.equal((await call(groups,'api/groups?id='+gid,2)).membership,'pending');
assert.equal((await call(groups,'api/groups?id='+gid,2,{action:'topic',title:'Test',body:'Pending cannot post'})).status,403);
assert.equal((await call(groups,'api/groups?id='+gid,3,{action:'accept',user_id:2})).status,403);
await call(groups,'api/groups?id='+gid,1,{action:'accept',user_id:2});
assert.equal((await call(groups,'api/groups?id='+gid,2)).can_read,true);
const t=await call(groups,'api/groups?id='+gid,2,{action:'topic',title:'Main chat',body:'Hello group'});
assert.equal(t.status,200);
await call(groups,'api/groups?id='+gid,1,{action:'reply',topic_id:t.topic,body:'Welcome'});
assert.equal((await call(groups,'api/groups?id='+gid+'&topic='+t.topic,2)).replies.length,1);
assert.equal((await call(groups,'api/groups?id='+gid+'&topic='+t.topic,3)).topics.length,0);
await call(groups,'api/groups?id='+gid,1,{action:'lock',topic_id:t.topic});
assert.equal((await call(groups,'api/groups?id='+gid,2,{action:'reply',topic_id:t.topic,body:'Blocked reply'})).status,409);
await call(groups,'api/groups?id='+gid,1,{action:'poll',title:'Choose one',options:['A','B']});
const poll=(await call(groups,'api/groups?id='+gid,2)).polls[0];
assert.equal((await call(groups,'api/groups?id='+gid,3,{action:'vote',poll_id:poll.id,choice:0})).status,403);
assert.equal((await call(groups,'api/groups?id='+gid,2,{action:'vote',poll_id:poll.id,choice:0})).status,200);
assert.equal((await call(groups,'api/groups?id='+gid,2,{action:'vote',poll_id:poll.id,choice:1})).status,409);
await call(groups,'api/groups?id='+gid,1,{action:'close_poll',poll_id:poll.id});
assert.equal((await call(groups,'api/groups?id='+gid,1,{action:'vote',poll_id:poll.id,choice:1})).status,409);
assert.equal((await call(groups,'api/groups?id='+gid,2,{action:'image',title:'Bad',image_data:'invalid'})).status,400);
assert.equal((await call(groups,'api/groups?id='+gid,1,{action:'leave'})).status,400);
await call(groups,'api/groups?id='+gid,1,{action:'transfer',user_id:2});
assert.equal((await call(groups,'api/groups?id='+gid,2)).is_owner,true);
assert.equal((await call(groups,'api/groups?id='+gid,1,{action:'leave'})).status,200);
assert.equal((await call(groups,'api/groups?id='+gid,1)).can_read,false);
const p=await call(blog,'api/blog',1,{title:'First blog',body:'Our first public post'});assert.equal(p.status,200);
assert.equal((await call(blog,'api/blog',1,{action:'vote',post_id:p.id,value:1})).status,403);
await call(blog,'api/blog',2,{action:'vote',post_id:p.id,value:1});
await call(blog,'api/blog',2,{action:'vote',post_id:p.id,value:1});
assert.equal((await call(blog,'api/blog?id='+p.id,0)).posts[0].score,2);
assert.equal((await call(blog,'api/blog',2,{action:'vote',post_id:p.id,value:-1})).status,409);
assert.equal((await call(blog,'api/blog?id='+p.id,0)).posts[0].score,2);
await call(blog,'api/blog',2,{action:'comment',post_id:p.id,body:'Good post'});
assert.equal((await call(blog,'api/blog?id='+p.id,0)).comments[0].body,'Good post');
sql.exec("UPDATE blog_posts SET created_at=datetime('now','-4 days')");
assert.equal((await call(blog,'api/blog',2,{action:'vote',post_id:p.id,value:1})).status,409);
assert.equal((await call(blog,'api/blog?sort=previous',0)).posts.length,1);
assert.equal((await call(blog,'api/blog?id='+p.id,3,undefined,'DELETE')).status,403);
assert.equal((await call(blog,'api/blog?id='+p.id,1,undefined,'DELETE')).status,200);
assert.equal((await call(blog,'api/blog?id='+p.id,0)).posts.length,0);
const publicFeed=await call(feed,'api/community-feed',0);
assert.equal(publicFeed.status,200);assert.equal(publicFeed.unread,0);
assert.equal(publicFeed.users.some(u=>Object.hasOwn(u,'t_money')),false);
console.log('PASS: private mail isolation, reads, blocks, CSRF, pending Q&A privacy, private groups, admission, ownership, forum locks, single poll votes, blog ranking/comments and voting deadlines.');

sql.exec("INSERT OR REPLACE INTO friendships(sender,receiver,status) VALUES(1,2,'accepted'),(1,3,'accepted')");
assert.equal((await call(friends,'api/friends?username=Alice',1,{action:'reorder',usernames:['Carol','Bob']})).status,200);
assert.deepEqual((await call(friends,'api/friends?username=Alice',3)).friends.map(x=>x.username),['Carol','Bob']);
assert.equal((await call(friends,'api/friends?username=Alice',2,{action:'reorder',usernames:['Bob','Carol']})).status,403);
assert.equal((await call(friends,'api/friends?username=Alice',1,{action:'reorder',usernames:['Bob','Bob']})).status,400);
assert.equal((await call(friends,'api/friends?username=Alice',1,{action:'reorder',usernames:['Bob','Dave']})).status,409);
sql.exec("INSERT INTO community_designs(id,user_id,author,title,description,theme_code,layer_type,image_data) VALUES(500,1,'Alice','Smile','','sky','mouth','data:image/png;base64,YQ==');INSERT INTO user_inventory(user_id,item_code) VALUES(1,'userdesign-500');CREATE TABLE player_shop_gifts(id INTEGER PRIMARY KEY,design_id INTEGER,buyer_id INTEGER,recipient_id INTEGER,created_at TEXT,message TEXT);INSERT INTO player_shop_gifts VALUES(1,500,2,1,CURRENT_TIMESTAMP,'A gift for you');INSERT INTO blog_posts(user_id,author,title,body) VALUES(2,'Bob','Mention','Hello @Alice and @AliceExtra')");
const detail=await call(extras,'api/profile-extras?username=Alice',0);
assert.equal(detail.status,200);
assert.equal(detail.gift_count,1);assert.equal(detail.owned_count,1);
assert.equal(detail.gifts[0].message,'A gift for you');
assert.equal(detail.gifts[0].sender,'Bob');
assert.equal(detail.mentions.length,1);assert.equal(detail.colors.length,0);
assert.equal((await call(extras,'api/profile-extras?username=AliceExtra',0)).status,404);
assert.equal((await call(extras,'api/profile-extras?username=Bob',0)).groups.length,0);
assert.equal((await call(extras,'api/profile-extras?username=Bob',2)).groups.length,1);
console.log('PASS: friend order is personal and visible, invalid reorder rejected, gift gallery reflects inventory and public profile hides private group memberships.');
sql.exec("UPDATE users SET last_seen_at=CURRENT_TIMESTAMP,is_banned=0,is_system=0,is_test_bot=0 WHERE id BETWEEN 1 AND 4;UPDATE users SET is_banned=1 WHERE id=2;UPDATE users SET is_test_bot=1 WHERE id=3;UPDATE users SET is_system=1 WHERE id=4");
const summary=await call(feed,'api/community-feed?summary=1',0);assert.equal(summary.status,200);assert.equal(summary.online,1);assert.equal(summary.unread,0);assert.equal('users' in summary,false);assert.equal('messages' in summary,false);
console.log('PASS lightweight community indicators count recent real users and return no messages or user records.');
