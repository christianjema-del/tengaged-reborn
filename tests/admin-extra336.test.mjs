import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {onRequest as moderation} from '../functions/api/admin-moderation.js';import {onRequestGet as me} from '../functions/api/me.js';
import {clientGeo} from '../functions/_shared/user-ips.js';
import {flag336,countryName336,place336} from '../admin-geo336.js';
import * as casting from '../functions/_shared/casting-daily.js';
import {fresh as hungerFresh,player187,advance as hungerAdvance,act as hungerAct} from '../functions/_shared/hunger.js';
import {freshRookies,actRookies,alive as rookiesAlive} from '../functions/_shared/rookies-engine.js';
import {freshDuel,actDuel,duelAlive} from '../functions/_shared/duel212.js';
const admin={id:1,username:'admin1',is_admin:1};
test('V336: país de conexión desde Cloudflare o desde Vercel con la clave',()=>{
 const req=(h,cf)=>Object.assign(new Request('https://t.test/',{headers:h}),cf?{cf}:{});
 assert.deepEqual(clientGeo(req({},{country:'ES',city:'Madrid'}),{}),{country:'ES',city:'Madrid'});
 assert.deepEqual(clientGeo(req({'x-tengaged-proxy-key':'k','x-tengaged-client-country':'ar','x-tengaged-client-city':'Buenos%20Aires'}),{TENGAGED_PROXY_KEY:'k'}),{country:'AR',city:'Buenos Aires'});
 assert.deepEqual(clientGeo(req({'x-tengaged-proxy-key':'mal','x-tengaged-client-country':'AR','cf-ipcountry':'ES'}),{TENGAGED_PROXY_KEY:'k'}),{country:'ES',city:null},'sin la clave no se acepta el país reenviado');
 assert.equal(clientGeo(req({'cf-ipcountry':'XX'}),{}).country,null);
 assert.equal(flag336('es'),'🇪🇸');assert.equal(countryName336('ES'),'España');assert.equal(place336(null),'País desconocido');assert.match(place336('MX','Puebla'),/México · Puebla/);
});
test('V336: admin1 expulsa de Hunger, Rookies, Duelo y Casting; nadie más puede',()=>{
 const T=Date.now();
 // Hunger
 const h=hungerFresh(T-3600000,9);h.manualGate187=true;h.runId='r';for(let i=1;i<=4;i++)h.players.push(player187(i+10,'P'+i));h.manualStart172={kind:'hunger',game:9,run:'r',by:'admin1',at:T-60000};hungerAdvance(h,T-30000,()=>0.5);
 assert.throws(()=>hungerAct(h,{id:11,username:'P1'},{action:'admin_kick',target:'P2'},T,()=>0.5),/admin1/);
 hungerAct(h,admin,{action:'admin_kick',target:'P2'},T,()=>0.5);const p2=h.players.find(p=>p.username==='P2');assert.equal(p2.health,0);assert.equal(p2.deathCause,'admin');assert.equal(p2.placement,4);
 // Rookies
 const r=freshRookies(5,T);for(let i=1;i<=13;i++)actRookies(r,{id:i,username:'U'+i},{action:'join'},T);actRookies(r,admin,{action:'start'},T);
 assert.throws(()=>actRookies(r,{id:2,username:'U2'},{action:'admin_kick',target:'U3'},T),/admin1/);
 const hoh=r.players.find(p=>p.id===r.hoh);actRookies(r,admin,{action:'admin_kick',target:hoh.username},T);
 assert.equal(hoh.status,'eliminated');assert.equal(hoh.placement,13);assert.equal(r.hoh,null);assert.equal(rookiesAlive(r).length,12);
 // Duelo
 const d=freshDuel(8,T);for(let i=1;i<=12;i++)actDuel(d,{id:i,username:'D'+i},{action:'join'},T);actDuel(d,admin,{action:'start'},T);
 actDuel(d,admin,{action:'admin_kick',target:'D4'},T);assert.equal(d.players.find(p=>p.username==='D4').placement,12);assert.equal(duelAlive(d).length,11);
 assert.throws(()=>actDuel(d,admin,{action:'admin_kick',target:'D4'},T),/no sigue/);
 // Casting: sin las protecciones de una eliminación normal (actividad en el chat, nominado en votación).
 const c={id:3,round:3,phase:'elimination',players:[{username:'A',status:'active',lastChatAt:T},{username:'B',status:'active'},{username:'C',status:'active'},{username:'Bot',bot:true,status:'active'}],nominees:['A','C'],ballots:{b:{A:1,C:2},a:{C:1}},eliminations:[],events:[]};
 casting.adminKick336(c,c.players[0],T);
 assert.equal(c.players[0].status,'eliminated');assert.equal(c.players[0].placement,3);assert.deepEqual(c.nominees,['C']);assert.equal(c.ballots.a,undefined);assert.equal(c.eliminations[0].cause,'expulsado por admin1');
});
test('V336: panel: partidas jugadas, aviso de moderación y registro de expulsiones con permisos',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(id INTEGER PRIMARY KEY,token_hash TEXT,user_id INTEGER,expires_at TEXT);CREATE TABLE user_game_history(id INTEGER PRIMARY KEY,username TEXT,game_type TEXT,game_id TEXT,status TEXT,placement TEXT,joined_at TEXT,finished_at TEXT)');
 class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
 const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}},env={DB:db};
 const hex=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
 for(const [i,n] of ['admin1','Alice','Mod'].entries()){const id=i+1;sql.prepare('INSERT INTO users(id,username,email,password_hash,is_admin) VALUES(?,?,?,?,?)').run(id,n,n.toLowerCase()+'@x.test',await hex('c'+n),id===1?1:0);sql.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await hex(String(id).repeat(64)),id,'2099-01-01');}
 const call=async(id,path,body)=>{const r=await (path==='me'?me:moderation)({env,request:Object.assign(new Request('https://t.test/api/'+path,{method:body?'POST':'GET',headers:{Origin:'https://t.test','CF-Connecting-IP':'198.51.100.9',...(id?{Cookie:'session='+String(id).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{cf:{country:'ES',city:'Sevilla'}})});return {status:r.status,...await r.json()};};
 await call(2,'me');await call(1,'admin-moderation?username=Mod');sql.exec('UPDATE users SET is_moderator=1 WHERE id=3');
 for(let g=1;g<=3;g++)sql.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,joined_at) VALUES('Alice','CASTING',?,?,'2026-11-01')").run(String(g),g===3?'active':'finished');
 let d=await call(1,'admin-moderation?username=Alice');
 assert.equal(d.played.real,3);assert.equal(d.played.shown,3);assert.equal(d.capabilities.played,true);assert.equal(d.capabilities.kick,true);assert.equal(d.account.country,'ES');assert.equal(d.account.city,'Sevilla');
 assert.deepEqual(d.games.map(g=>[g.game_type,g.game_id,g.kickable]),[['CASTING','3',true]]);
 assert.equal((await call(1,'admin-moderation',{username:'Alice',action:'set_played',played:758,reason:'Partidas del Tengaged original'})).ok,true);
 d=await call(1,'admin-moderation?username=Alice');assert.equal(d.played.shown,758);assert.equal(d.played.adjust,755);
 const m=await call(3,'admin-moderation?username=Alice');assert.equal(m.capabilities.played,false);assert.equal(m.capabilities.kick,false);assert.equal(m.capabilities.warn,true);assert.equal(m.account.country,'ES');
 assert.equal((await call(3,'admin-moderation',{username:'Alice',action:'set_played',played:1,reason:'x'})).status,403);
 assert.equal((await call(3,'admin-moderation',{username:'Alice',action:'kick_game',game:'CASTING:3',reason:'x'})).status,403);
 assert.equal((await call(3,'admin-moderation',{username:'Alice',action:'warn',message:'Respeta a los demás en el chat.',reason:'Insultos'})).ok,true);
 const mail=sql.prepare("SELECT subject,body FROM private_messages WHERE recipient=2").all();assert.equal(mail.length,1);assert.equal(mail[0].subject,'Aviso de moderación');assert.match(mail[0].body,/Respeta a los demás/);
 assert.equal((await call(3,'admin-moderation',{username:'admin1',action:'warn',message:'hola hola',reason:'x'})).status,403,'no a cuentas del equipo');
 assert.equal((await call(1,'admin-moderation',{username:'Alice',action:'kick_game',game:'CASTING:3',reason:'Trampas'})).ok,true);
 assert.equal((await call(1,'admin-moderation',{username:'Alice',action:'kick_game',game:'FROOKIES:3',reason:'x'})).status,400);
 const log=sql.prepare("SELECT action,amount,reason FROM admin_audit_log WHERE target_user_id=2 ORDER BY id").all().map(r=>r.action+':'+r.reason);
 assert.ok(log.some(x=>x==='set_played:Partidas del Tengaged original'));assert.ok(log.some(x=>x.startsWith('warn:Insultos · Respeta')));assert.ok(log.some(x=>x==='kick_game:Trampas · Casting #3'));
 const page=readFileSync(new URL('../admin-workbench.js',import.meta.url),'utf8');assert.match(page,/kickFromGame/);assert.match(page,/action:'admin_kick'/);assert.match(readFileSync(new URL('../admin.html',import.meta.url),'utf8'),/admin-page\.js\?v=337/);
});
