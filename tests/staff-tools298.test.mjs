import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {onRequest as moderation} from '../functions/api/admin-moderation.js';import {onRequestGet as list} from '../functions/api/admin-users.js';import {onRequestGet as me} from '../functions/api/me.js';
import {onRequest as notices} from '../functions/api/admin-notices.js';import {onRequestGet as audit} from '../functions/api/admin-audit.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(id INTEGER PRIMARY KEY,token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new S(q),batch:async ss=>{sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}},env={DB:db};
const hex=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
for(const [i,n] of ['admin1','Alice','Mod','Bob'].entries()){const id=i+1;sql.prepare('INSERT INTO users(id,username,email,password_hash,is_admin,t_money) VALUES(?,?,?,?,?,?)').run(id,n,n.toLowerCase()+'@x.test',await hex('clave-'+n),id===1?1:0,100);sql.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await hex(String(id).repeat(64)),id,'2099-01-01');}
const call=async(fn,id,path,{body,ip='198.51.100.7'}={})=>{const r=await fn({env,request:new Request('https://t.test/api/'+path,{method:body?'POST':'GET',headers:{Origin:'https://t.test','CF-Connecting-IP':ip,...(id?{Cookie:'session='+String(id).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})});return {status:r.status,...await r.json()};};
await call(me,1,'me');await call(me,2,'me',{ip:'203.0.113.5'});await call(me,4,'me',{ip:'203.0.113.5'});await call(moderation,1,'admin-moderation?username=Mod');sql.exec('UPDATE users SET is_moderator=1 WHERE id=3');

// Moderador: busca por IP, ve IP y cuentas relacionadas sin email, y puede cerrar sesiones
let r=await call(list,3,'admin-users?q=203.0.113.5');assert.deepEqual(r.users.map(u=>u.username).sort(),['Alice','Bob']);assert.equal(r.stats.money_total,null,'el moderador no ve el dinero total');assert.ok('blocked_ips' in r.stats&&'active_today' in r.stats);
r=await call(list,1,'admin-users');assert.equal(r.stats.money_total,300,'admin1 ve el T$ en circulación sin contar su cuenta');
r=await call(moderation,3,'admin-moderation?username=Alice');assert.equal(r.capabilities.logout,true);assert.equal(r.capabilities.rename,false);assert.equal(r.capabilities.blockIp,false);assert.equal('email' in r.account,false);assert.deepEqual(r.account.related.map(x=>x.username),['Bob']);assert.deepEqual(r.account.names,[]);
r=await call(moderation,3,'admin-moderation',{body:{username:'Alice',action:'logout',reason:'Cuenta compartida'}});assert.equal(r.ok,true,r.message);assert.equal(sql.prepare('SELECT COUNT(*) n FROM sessions WHERE user_id=2').get().n,0);
r=await call(moderation,3,'admin-moderation',{body:{username:'Bob',action:'rename',newName:'Roberto',reason:'x'}});assert.equal(r.status,403,'el moderador no cambia nombres');
r=await call(moderation,3,'admin-moderation',{body:{username:'admin1',action:'logout',reason:'x'}});assert.equal(r.status,403,'el moderador no actúa sobre el equipo');

// admin1: cambio de nombre gratuito y registrado
r=await call(moderation,1,'admin-moderation?username=Bob');assert.equal(r.capabilities.rename,true);assert.equal(r.account.email,'bob@x.test');
r=await call(moderation,1,'admin-moderation',{body:{username:'Bob',action:'rename',newName:'alice',reason:'x'}});assert.equal(r.status,409,'nombre ocupado');
r=await call(moderation,1,'admin-moderation',{body:{username:'Bob',action:'rename',newName:'admin',reason:'x'}});assert.equal(r.status,400,'nombre reservado');
r=await call(moderation,1,'admin-moderation',{body:{username:'admin1',action:'rename',newName:'Jefe',reason:'x'}});assert.equal(r.status,403);
r=await call(moderation,1,'admin-moderation',{body:{username:'Bob',action:'rename',newName:'Roberto',reason:'Lo pidió por correo'}});assert.equal(r.ok,true,r.message);assert.equal(r.username,'Roberto');
const bob=sql.prepare('SELECT username,t_money FROM users WHERE id=4').get();assert.equal(bob.username,'Roberto');assert.equal(bob.t_money,100,'gratis');
r=await call(moderation,1,'admin-moderation?username=Roberto');assert.deepEqual(r.account.names.map(n=>[n.old_username,n.new_username,n.price]),[['Bob','Roberto',0]]);
r=await call(audit,1,'admin-audit?kind=names');assert.equal(r.events.length,1);assert.equal(r.events[0].action,'rename_user');assert.match(r.events[0].reason,/Bob → Roberto · Lo pidió por correo/);
r=await call(audit,3,'admin-audit?kind=names');assert.equal(r.status,200,'el moderador ve los cambios de nombre');

// Avisos: solo admin1; a todos (sin sistema, bots ni suspendidos) o a uno
assert.equal((await call(notices,3,'admin-notices')).status,403);
sql.exec("UPDATE users SET is_banned=1 WHERE id=2");
r=await call(notices,1,'admin-notices',{body:{to:'all',subject:'Mantenimiento',body:'Esta noche paramos 10 minutos.'}});assert.equal(r.ok,true,r.message);assert.equal(r.sent,3,'admin1, Mod y Roberto; no Alice suspendida');
const sysId=sql.prepare("SELECT id FROM users WHERE username='Tengaged'").get().id;
assert.equal(sql.prepare("SELECT COUNT(*) n FROM private_messages WHERE sender=? AND subject='Mantenimiento'").get(sysId).n,3);
assert.equal(sql.prepare("SELECT COUNT(*) n FROM private_messages WHERE recipient=2 AND subject='Mantenimiento'").get().n,0);
assert.match(sql.prepare("SELECT body FROM private_messages WHERE recipient=4 AND subject='Mantenimiento'").get().body,/no admite respuesta/);
r=await call(notices,1,'admin-notices',{body:{to:'Roberto',subject:'Hola',body:'Tu cambio de nombre está hecho.'}});assert.equal(r.sent,1);assert.equal(r.notices.length,2);assert.equal(r.notices[0].amount,1);assert.equal(r.notices[1].amount,3);
assert.equal((await call(notices,1,'admin-notices',{body:{to:'Nadie',subject:'Hola',body:'xxx'}})).status,404);
assert.equal((await call(notices,1,'admin-notices',{body:{to:'all',subject:'x',body:'xxx'}})).status,400);

// Interfaz
const html=readFileSync(new URL('../admin.html',import.meta.url),'utf8');
assert.match(html,/data-staff-tab="multi">IP y multicuentas<\/button>/);assert.match(html,/data-staff-tab="audit">Registro<\/button>/);assert.match(html,/data-staff-tab="notices" data-owner-only hidden>Avisos/);assert.match(html,/admin-page\.js\?v=298/);
const page=readFileSync(new URL('../admin-page.js',import.meta.url),'utf8');assert.match(page,/admin-workbench\.js\?v=298/);assert.match(page,/if\(!canBlock\)return/);
assert.match(readFileSync(new URL('../profile.html',import.meta.url),'utf8'),/admin-workbench\.js\?v=298/);
console.log('PASS herramientas de moderación y administración V298');
