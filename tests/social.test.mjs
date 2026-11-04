import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequest as friends} from '../functions/api/friends.js';
import {onRequest as chat} from '../functions/api/game-chat.js';
const sql=new DatabaseSync(':memory:');
sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);CREATE TABLE casting_matches(id INTEGER PRIMARY KEY,state TEXT);CREATE TABLE hunger_arena(id INTEGER PRIMARY KEY,state TEXT)');
class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)||null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
const db={prepare:q=>new Statement(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(let i=1;i<=3;i++){sql.prepare('INSERT INTO users VALUES(?,?,0)').run(i,['Alice','Bob','Carol'][i-1]);const token=String(i).repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,i,'2099-01-01');}
async function call(api,path,user=1,body){const request=new Request('https://test.local/api/'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local',...(user?{Cookie:'session='+String(user).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const response=await api({request,env:{DB:db}});return {status:response.status,...await response.json()};}
assert.equal((await call(friends,'friends?username=Bob',1,{action:'request'})).relation,'outgoing');
assert.equal((await call(friends,'friends?username=Alice',2)).relation,'incoming');
assert.equal((await call(friends,'friends?username=Bob',1,{action:'accept'})).relation,'outgoing');
assert.equal((await call(friends,'friends?username=Alice',2,{action:'accept'})).relation,'accepted');
assert.equal((await call(friends,'friends?username=Alice',0)).friends[0].username,'Bob');
assert.equal((await call(friends,'friends?username=Alice',1,{action:'request'})).status,400);
await call(friends,'friends?username=Bob',1,{action:'remove'});assert.equal((await call(friends,'friends?username=Alice')).friends.length,0);
let s={players:[{username:'Alice',status:'active'},{username:'Bob',status:'eliminated'}]};sql.prepare('INSERT INTO casting_matches VALUES(1,?)').run(JSON.stringify(s));sql.prepare('INSERT INTO casting_matches VALUES(2,?)').run(JSON.stringify(s));
const path='game-chat?type=casting&id=1';
assert.equal((await call(chat,path,1,{message:'Hola <script>alert(1)</script>'})).status,200);
assert.equal((await call(chat,path,1,{message:'spam'})).status,429);
assert.equal((await call(chat,path,2,{message:'eliminado'})).status,403);
assert.equal((await call(chat,path,3,{message:'espectador'})).status,403);
assert.equal((await call(chat,path,0,{message:'anónimo'})).status,401);
assert.equal((await call(chat,path,2)).messages.length,1);
assert.equal((await call(chat,'game-chat?type=casting&id=2')).messages.length,0);
s.players[0].status='eliminated';sql.prepare('UPDATE casting_matches SET state=? WHERE id=1').run(JSON.stringify(s));assert.equal((await call(chat,path,1,{message:'ya eliminado'})).status,403);
sql.prepare('INSERT INTO hunger_arena VALUES(1,?)').run(JSON.stringify({edition:3,players:[{username:'Alice',health:0},{username:'Bob',health:80}]}));
assert.equal((await call(chat,'game-chat?type=hunger&id=3',1,{message:'muerto'})).status,403);
assert.equal((await call(chat,'game-chat?type=hunger&id=3',2,{message:'vivo'})).status,200);
assert.equal((await call(chat,'game-chat?type=hunger&id=2',2,{message:'antigua'})).status,409);
for(let i=0;i<24;i++)sql.prepare("INSERT INTO game_chat(room,user_id,body) VALUES('casting:1',1,?)").run('Mensaje '+i);
const firstPage=await call(chat,path,0),secondPage=await call(chat,path+'&page=2',0);
assert.equal(firstPage.total,25);assert.equal(firstPage.messages.length,20);assert.equal(secondPage.messages.length,5);assert.ok(firstPage.messages.at(-1).id>secondPage.messages[0].id);assert.equal(firstPage.messages[0].body,'Mensaje 23');assert.equal((await call(chat,path+'&page=999',0)).page,2);
console.log('PASS: friendships, consent, removal, chat isolation, authentication, rate limit, eliminated players read only in Casting and Hunger.');
// Arena events and comments share chronological pages, without private whispers.
const hungerState={edition:3,players:[{id:1,username:'Alice',health:0},{id:2,username:'Bob',health:80}],whispers:[{text:'SECRET'}],events:Array.from({length:25},(_,i)=>({kind:'arrow',actor:i===0?2:undefined,target:1,damage:2,text:'Disparo '+i,at:Date.now()+100000-i*1000}))};
sql.prepare('UPDATE hunger_arena SET state=? WHERE id=1').run(JSON.stringify(hungerState));
const feed=await call(chat,'game-chat?type=hunger&id=3',0),older=await call(chat,'game-chat?type=hunger&id=3&page=2',0);assert.equal(feed.total,26);assert.equal(feed.messages.length,20);assert.equal(older.messages.length,6);assert.equal(feed.messages[0].actor,'Bob');assert.equal(feed.messages[1].actor,null);assert.equal(feed.messages[0].target,'Alice');assert.equal(feed.messages[0].event.damage,2);assert.equal(JSON.stringify(feed).includes('SECRET'),false);assert.equal(new Set([...feed.messages,...older.messages].map(m=>m.id)).size,26);
console.log('PASS combined Hunger feed: pagination, order, actor anonymity and whisper privacy.');
