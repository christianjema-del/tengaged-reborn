import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';

import {onRequest as chat} from '../functions/api/game-chat.js';
const sql=new DatabaseSync(':memory:');
sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);CREATE TABLE casting_matches(id INTEGER PRIMARY KEY,state TEXT);CREATE TABLE hunger_arena(id INTEGER PRIMARY KEY,state TEXT)');
class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)||null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
const db={prepare:q=>new Statement(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let i=1;i<=4;i++){sql.prepare('INSERT INTO users VALUES(?,?,?)').run(i,['admin1','Alice','Other','OtherAdmin'][i-1],i===1||i===4?1:0);const token=String(i).repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,i,'2099-01-01');}
async function call(api,path,user=1,body){const request=new Request('https://test.local/api/'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local',...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const response=await api({request,env:{DB:db}});return {status:response.status,...await response.json()};}
sql.exec('CREATE TABLE frookies_matches(id INTEGER PRIMARY KEY,revision INTEGER DEFAULT 0,state TEXT);CREATE TABLE hunger_history(edition INTEGER PRIMARY KEY,finished_at INTEGER,state TEXT)');
const state={edition:3,id:1,phase:'active',createdAt:Date.now(),players:[{id:2,username:'Alice',status:'active',health:70}],events:[],welcomes:[]};
sql.prepare('INSERT INTO casting_matches VALUES(1,?)').run(JSON.stringify(state));sql.prepare('INSERT INTO hunger_arena VALUES(1,?)').run(JSON.stringify(state));sql.prepare('INSERT INTO frookies_matches(id,state) VALUES(1,?)').run(JSON.stringify(state));
for(const [type,id] of [['casting',1],['frookies',1],['hunger',3]]){
 const url='game-chat?type='+type+'&id='+id;const a=await call(chat,url,1);assert.equal(a.canWrite,true);assert.equal(a.canVote,false);
 const sent=await call(chat,url,1,{message:'Aviso administrativo <b>texto</b>'});assert.equal(sent.status,200,JSON.stringify(sent));assert.equal(sent.messages[0].admin_notice,1);assert.equal(sent.messages[0].canVote,false);assert.equal(sent.messages[0].username,'admin1');
 const reader=await call(chat,url,2);assert.equal(reader.messages[0].admin_notice,1);assert.equal((await call(chat,url,2,{action:'vote',message_id:sent.messages[0].id,value:1})).status,403);
 assert.equal((await call(chat,url,1,{action:'vote',message_id:sent.messages[0].id,value:1})).status,403);
 assert.equal((await call(chat,url,3,{message:'No puedo',admin_notice:true})).status,403);assert.equal((await call(chat,url,4,{message:'Otro administrador'})).status,403);
 sql.exec("UPDATE game_chat SET created_at=datetime('now','-10 seconds')");
}
assert.equal(sql.prepare('SELECT COUNT(*) n FROM game_chat_votes').get().n,0);
for(const table of ['casting_matches','frookies_matches','hunger_arena']){const s=JSON.parse(sql.prepare('SELECT state FROM '+table).get().state);assert.deepEqual(s.players,state.players);}
sql.prepare('UPDATE casting_matches SET state=? WHERE id=1').run(JSON.stringify({...state,phase:'finished'}));const done=await call(chat,'game-chat?type=casting&id=1',1,{message:'Partida finalizada'});assert.equal(done.status,200);assert.equal(done.canWrite,true);sql.exec("UPDATE game_chat SET created_at=datetime('now','-10 seconds')");
sql.prepare('INSERT INTO hunger_history VALUES(2,0,?)').run(JSON.stringify({...state,edition:2,phase:'finished'}));assert.equal((await call(chat,'game-chat?type=hunger&id=2',1,{message:'Aviso en archivo'})).status,200);
const csrf=await chat({env:{DB:db},request:new Request('https://test.local/api/game-chat?type=casting&id=1',{method:'POST',headers:{Cookie:'session='+ '1'.repeat(64),Origin:'https://foreign.local','Content-Type':'application/json'},body:JSON.stringify({message:'No permitido'})})});assert.equal(csrf.status,403);
console.log('PASS admin1-only public posting in all games without joining, server-owned yellow notice flag, no spectator voting or notice reactions, unchanged memberships, finished/archive support, other-admin denial and CSRF retained.');sql.close();
