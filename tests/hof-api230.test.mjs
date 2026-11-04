import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
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


const {onRequestGet}=await import('../functions/api/hall-of-fame.js');
let response=await onRequestGet({env:{DB:db}});assert.equal(response.status,200);
let data=await response.json();assert.equal(data.fashionista,null);assert.deepEqual(data.starsWinners,[]);assert.deepEqual(data.survivors,[]);
sql.exec("INSERT INTO community_designs(id,user_id,author,title,description,theme_code,price,image_data,layer_type) VALUES(901,1,'Alice','Pelo','Prueba','test',12,'data:image/png;base64,AA','hair')");
sql.exec("INSERT INTO user_avatar_layers(user_id,layer_type,design_id) VALUES(2,'hair',901)");
const balances=sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all();
data=await (await onRequestGet({env:{DB:db}})).json();assert.equal(data.fashionista.username,'Bob');assert.equal(data.fashionista.designs[0].title,'Pelo');assert.equal(data.fashionista.designs[0].price,12);assert.equal(data.fashionista.designs[0].author,'Alice');
assert.deepEqual(sql.prepare('SELECT id,karma,t_money FROM users ORDER BY id').all(),balances);
sql.exec("UPDATE users SET is_banned=1 WHERE id=2");data=await (await onRequestGet({env:{DB:db}})).json();assert.equal(data.fashionista,null);
console.log('PASS HOF: empty formats, real equipped outfit/prices/authors, excluded banned users, balances unchanged.');
