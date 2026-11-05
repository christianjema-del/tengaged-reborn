import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import vm from 'node:vm';
import {onRequest} from '../functions/api/my-games.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,is_admin INTEGER,is_banned INTEGER,last_seen_at TEXT);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT);INSERT INTO users VALUES(1,'Alice',0,0,NULL);CREATE TABLE rookies_matches(id INTEGER PRIMARY KEY,revision INTEGER,state TEXT)");
sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update('1'.repeat(64)).digest('hex'),1,'2099-01-01');
sql.prepare('INSERT INTO rookies_matches VALUES(1,0,?)').run(JSON.stringify({phase:'day',players:[{id:1,username:'Alice',status:'active'}]}));
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.a).changes)}};}}
const db={prepare:q=>new Q(q),batch:async l=>Promise.all(l.map(s=>s.run()))};
const response=await onRequest({env:{DB:db},request:new Request('https://t.test/api/my-games',{headers:{Cookie:'session='+'1'.repeat(64)}})}),{games}=await response.json();
assert.deepEqual(games,[{type:'rookies',id:1,label:'Rookies #1',href:'/rookies.html?id=1'}],'el menú recibe texto y enlace');
// El menú real debe pintar la fila con texto y enlace.
class E{constructor(){this.children=[];this.hidden=true;this.textContent='';}replaceChildren(...n){this.children=n;}append(...n){this.children.push(...n);}}
const root=new E(),document={hidden:false,getElementById:()=>root,createElement:()=>new E(),addEventListener(){}};
vm.runInNewContext(read('my-active-games.js'),{window:{},document,JSON,AbortController,setTimeout,clearTimeout,setInterval(){},fetch:async()=>({status:200,ok:true,json:async()=>({ok:true,games})})});await new Promise(r=>setTimeout(r,20));
assert.equal(root.children[0].textContent,'#Rookies 1');assert.equal(root.children[0].href,'/rookies.html?id=1');
for(const [file,text] of [['profile.html',"kind==='ROOKIES'?'/rookies.html?id='"],['profile-classic166.js',"ROOKIES:'/rookies.html?id='"],['game-feed.js',"type==='rookies'?'/rookies.html?id='"],['community-page.js',"type==='rookies'?'/rookies.html?id='"]])assert.ok(read(file).includes(text),file+' enlaza a la partida');
console.log('PASS Rookies enlazado desde el menú de juegos, el perfil, la actividad y los feeds.');
