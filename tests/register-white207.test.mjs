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


import {onRequestPost as register} from '../functions/api/register.js';
const result=await call(register,'api/register',0,{username:'NewWhite207',email:'white207@example.com',password:'test-password-207'});assert.equal(result.status,200);
const owned=sql.prepare('SELECT * FROM user_inventory WHERE user_id=?').all(result.id);assert.equal(owned.length,1);assert.equal(owned[0].item_code,'color-card-white');assert.equal(owned[0].is_equipped,1);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM user_inventory WHERE user_id=1').get().n,0,'existing users unchanged');
const duplicate=await call(register,'api/register',0,{username:'NewWhite207',email:'white207@example.com',password:'test-password-207'});assert.equal(duplicate.status,409);assert.equal(sql.prepare('SELECT COUNT(*) n FROM user_inventory WHERE user_id=?').get(result.id).n,1);
console.log('PASS V207 registration atomically grants/equips white card, duplicate protection, existing users untouched');
