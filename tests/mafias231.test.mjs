import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
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
 sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,0)').run(id,['admin1','Bob','Carol','Dave'][id-1]);
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).repeat(64)))).toString('hex');
 sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,id,'2099-01-01');
}
async function call(fn,path,user=1,body,method,origin='https://test.local'){
 const r=await fn({request:new Request('https://test.local/'+path,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env:{DB:db}});
 return {status:r.status,...await r.json()};
}



const {onRequest}=await import('../functions/api/mafias.js');const {mafiaSeat231}=await import('../functions/_shared/mafia-seat231.js');
const callM=(uid,body,id=0,origin='https://test.local')=>call(onRequest,'api/mafias'+(id?'?id='+id:''),uid,body,undefined,origin);
let d=await callM(0);assert.equal(d.status,200);assert.equal(d.total,0);assert.equal((await callM(0,{action:'create',name:'Test'})).status,401);assert.equal((await callM(3,{action:'create',name:'Test'})).status,403);
sql.exec('UPDATE users SET is_admin=1 WHERE id IN (1,2)');d=await callM(1,{action:'create',name:'Primera',description:'Descripción'});assert.equal(d.status,200);const a=d.myMafiaId;d=await callM(2,{action:'create',name:'Segunda'});assert.equal(d.status,200);const b=d.myMafiaId;
assert.equal((await callM(1,{action:'create',name:'Tercera'})).status,409);
assert.equal((await callM(3,{action:'join',mafia_id:a})).myRole,'aspirant');
await callM(1,{action:'comment',mafia_id:a,body:'SECRET231',private:true},a);
assert.ok(!JSON.stringify(await callM(0,null,a)).includes('SECRET231'));assert.ok(!JSON.stringify(await callM(3,null,a)).includes('SECRET231'));
assert.equal((await callM(3,{action:'comment',mafia_id:a,body:'forged',private:true},a)).status,403);
assert.equal((await callM(2,{action:'vote',mafia_id:a,target_id:3},a)).status,403);
await callM(1,{action:'vote',mafia_id:a,target_id:3},a);d=await callM(3,null,a);assert.equal(d.myRole,'member');assert.ok(JSON.stringify(d).includes('SECRET231'));
await callM(1,{action:'vote',mafia_id:a,target_id:3},a);assert.equal(sql.prepare('SELECT COUNT(*) n FROM mafia_votes231 WHERE voter_id=1 AND target_id=3').get().n,1);
assert.equal((await callM(3,{action:'edit',mafia_id:a,description:'forged'},a)).status,403);assert.equal((await callM(1,{action:'edit',mafia_id:a,emblem:'data:image/svg+xml;base64,AA'},a)).status,400);
assert.equal((await callM(1,{action:'comment',mafia_id:a,body:'test'},a,'https://other.test')).status,403);
assert.equal((await callM(2,{action:'start_seat'})).status,409);d=await callM(1,{action:'start_seat'});assert.equal(d.status,200);assert.equal(d.seat.status,'active');assert.ok(!JSON.stringify(d.seat).includes('holderId'));
const hidden=JSON.parse(sql.prepare('SELECT state FROM mafia_seat231').get().state),actor=hidden.mafiaId===a?2:1;
d=await callM(actor,{action:'guess_seat',target_id:hidden.holderId});assert.equal(d.status,200);assert.ok(d.notice.includes('robado'));assert.equal(d.seat.events.length,1);
const after=JSON.parse(sql.prepare('SELECT state FROM mafia_seat231').get().state);await callM(actor,{action:'raffle',mafia_id:after.mafiaId},after.mafiaId);
const balances=sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all();d=await mafiaSeat231(db,null,{},after.endsAt+1);assert.equal(d.status,'finished');assert.equal(d.winner.user_id,actor);await mafiaSeat231(db,null,{},after.endsAt+1);assert.equal(sql.prepare('SELECT COUNT(*) n FROM mafia_raffle_winners231').get().n,1);assert.deepEqual(sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all(),balances);
await callM(1,{action:'leave'});assert.equal((await callM(3,null,a)).detail.isPresident,true);
sql.exec("CREATE TABLE IF NOT EXISTS blog_votes(post_id INTEGER,user_id INTEGER,value INTEGER,weight INTEGER DEFAULT 1);CREATE TABLE IF NOT EXISTS blog_comments(id INTEGER PRIMARY KEY,post_id INTEGER,user_id INTEGER,body TEXT,hidden162 INTEGER DEFAULT 0);INSERT INTO blog_posts(id,user_id,author,title,body,initial_points159) VALUES(901,3,'Carol','Prueba ficha','Texto público',2);INSERT INTO blog_votes(post_id,user_id,value,weight) VALUES(901,1,1,3);INSERT INTO blog_comments(id,post_id,user_id,body,hidden162) VALUES(901,901,1,'Oculto',1);");
d=await callM(0,null,a);const post=d.detail.blogs.find(p=>p.id===901);assert.equal(post.score,5);assert.equal(post.comments_count,0);assert.equal(post.excerpt,'Texto público');
console.log('PASS mafias: TV/admin creation, atomic membership, aspirants, unique stars/admission, private room isolation, CSRF/edit restrictions, hidden star, admin-only start, steal, single weekly draw, succession, unchanged balances.');
