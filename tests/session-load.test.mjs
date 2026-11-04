import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequestGet} from '../functions/api/me.js';
const sql=new DatabaseSync(':memory:');
// A healthy account with no notification, group or shop tables must still load.
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,is_banned INTEGER,karma INTEGER,t_money INTEGER,last_seen_at TEXT);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)");
sql.prepare('INSERT INTO users VALUES(1,?,0,0,42,321,NULL)').run('Alice');
const token='a'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,1,'2099-01-01');
const queries=[];
class S{constructor(q,args=[]){this.q=q;this.args=args;}bind(...args){return new S(this.q,args);}async first(){return sql.prepare(this.q).get(...this.args)||null;}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}};}}
const db={prepare(q){queries.push(q);assert.doesNotMatch(q,/CREATE|ALTER|INSERT/i,'Session lookup must not depend on schema/catalog setup');return new S(q);}};
const request=new Request('https://test.local/api/me',{headers:{Cookie:'session='+token}});
let response=await onRequestGet({request,env:{DB:db}});assert.equal(response.status,200);const body=await response.json();assert.equal(body.user.username,'Alice');assert.equal(body.user.karma,42);assert.equal(body.user.t_money,321);assert.ok(queries.length<=3);assert.equal('token' in body,false);
response=await onRequestGet({request:new Request('https://test.local/api/me'),env:{DB:db}});assert.equal(response.status,401);
sql.prepare('UPDATE users SET is_banned=1').run();response=await onRequestGet({request,env:{DB:db}});assert.equal(response.status,401);
console.log('PASS: session loads in at most three queries without mail, group or shop migrations; anonymous and banned users remain rejected.');
