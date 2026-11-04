import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {onRequest as blog} from '../functions/api/blog.js';
import {onRequest as designs} from '../functions/api/designs.js';
import {COLOR_LEVELS} from '../color-level-catalog.js';
const sql=new DatabaseSync(':memory:');
sql.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 500);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);
CREATE TABLE blog_posts(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,author TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO blog_posts(user_id,author,title,body) VALUES(1,'Publisher','Publicación histórica','Sin modificar');`);
for(let i=1;i<=2;i++){sql.prepare('INSERT INTO users(id,username) VALUES(?,?)').run(i,i===1?'Publisher':'Voter');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(String(i).repeat(64)).digest('hex'),i,'2099-01-01');}
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const item of items)out.push(await item.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
async function call(handler,url,uid=1,body){const r=await handler({env:{DB:db},request:new Request('https://test.local/api/'+url,{method:body?'POST':'GET',headers:{Origin:'https://test.local',Cookie:'session='+String(uid).repeat(64),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})});return {status:r.status,...await r.json()};}
assert.equal((await call(blog,'blog?id=1')).posts[0].score,0,'historical entries do not receive a retroactive bonus');
const balances=sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all();
const ids=[];
for(const level of COLOR_LEVELS){
 sql.prepare('UPDATE user_inventory SET is_equipped=0 WHERE user_id=1').run();sql.prepare('INSERT INTO user_inventory(user_id,item_code,is_equipped) VALUES(1,?,1) ON CONFLICT(user_id,item_code) DO UPDATE SET is_equipped=1').run(level.itemCode);
 const made=await call(blog,'blog',1,{title:'Tarjeta '+level.label,body:'Prueba #colores @Voter',initial_points:999999,weight:999999});assert.equal(made.status,200);ids.push(made.id);
 let row=(await call(blog,'blog?id='+made.id)).posts[0];assert.equal(row.initial_points,level.power);assert.equal(row.score,level.power);assert.equal(row.plus_count,level.power);assert.equal(row.my_vote,0);
 const creation=await call(designs,'designs',1,{action:'create',title:'Diseño '+level.label,description:'Prueba',theme_code:'rose',price:0,layer_type:'profile',initial_points:999999});assert.equal(creation.status,201,JSON.stringify(creation));
 let d=(await call(designs,'designs?id='+creation.id)).designs[0];assert.equal(d.initial_points,level.power);assert.equal(d.likes,level.power);assert.equal(d.my_vote,0);assert.equal((await call(designs,'designs',1,{action:'vote',design_id:creation.id,value:1})).status,403);
 const edit=await call(designs,'designs',1,{action:'edit',design_id:creation.id,title:'Editado '+level.label,description:'Misma puntuación',theme_code:'sky',price:3,layer_type:'profile'});assert.equal(edit.status,200);d=(await call(designs,'designs?id='+creation.id)).designs[0];assert.equal(d.likes,level.power);
 sql.prepare('INSERT INTO withdrawn_designs(design_id) VALUES(?)').run(creation.id);
}
const tv=ids[COLOR_LEVELS.findIndex(l=>l.code==='tv-star')];assert.equal((await call(blog,'blog?id='+tv)).posts[0].score,30);
sql.prepare('UPDATE user_inventory SET is_equipped=0 WHERE user_id=1').run();for(let i=0;i<3;i++)assert.equal((await call(blog,'blog?id='+tv)).posts[0].score,30,'card changes and repeated reads retain the publication snapshot');
assert.equal((await call(blog,'blog',1,{action:'vote',post_id:tv,value:1})).status,403);
await call(blog,'blog',2,{action:'vote',post_id:tv,value:1});assert.equal((await call(blog,'blog?id='+tv)).posts[0].score,31);
assert.equal((await call(blog,'blog',2,{action:'vote',post_id:tv,value:-1})).status,409);assert.equal((await call(blog,'blog?id='+tv)).posts[0].score,31);
assert.equal((await call(blog,'blog',2,{action:'vote',post_id:tv,value:0})).status,400);assert.equal((await call(blog,'blog?id='+tv)).posts[0].score,31);
const one=await call(blog,'blog?page=1'),two=await call(blog,'blog?page=2');assert.equal(one.posts.length,15);assert.equal(two.posts.length,6);assert.equal(one.total,21);assert.equal(one.posts.filter(p=>two.posts.some(q=>q.id===p.id)).length,0);assert.equal(one.topics[0].tag,'#colores');
// Public gallery pagination and top ordering use stored initial points, independently of the current page.
sql.exec('DELETE FROM withdrawn_designs');const d1=await call(designs,'designs?page=1'),d2=await call(designs,'designs?page=2');assert.equal(d1.designs.length,15);assert.equal(d2.designs.length,5);assert.equal(d1.total,20);assert.equal(d1.top_designs[0].initial_points,40);assert.equal(d1.designs.filter(p=>d2.designs.some(q=>q.id===p.id)).length,0);
assert.deepEqual(sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all(),balances,'publication points never alter wallet or karma');assert.equal(sql.prepare('SELECT COUNT(*) n FROM blog_votes WHERE user_id=1').get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM design_likes WHERE user_id=1').get().n,0);
console.log('PASS all twenty card initial scores in blogs and designs, server authority, atomic snapshot, legacy zero, edits/card changes/read stability, external votes, no self-votes, pagination, top ordering, topics and balances unchanged.');
