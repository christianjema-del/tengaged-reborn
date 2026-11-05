import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {onRequest as reset} from '../functions/api/admin-reset-password.js';import {onRequest as change} from '../functions/api/change-password.js';import {onRequestPost as login} from '../functions/api/login.js';import {onRequestGet as me} from '../functions/api/me.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const q of items)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const hash=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
for(const [id,u,admin] of [[1,'admin1',1],[2,'Cristi',0],[3,'Otro',1]]){sql.prepare('INSERT INTO users(id,username,email,password_hash,is_admin) VALUES(?,?,?,?,?)').run(id,u,u+'@t.local',await hash('anterior'+id),admin);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await hash(String(id).repeat(64)),id,'2099-01-01');}
const call=async(fn,path,input,id=1,origin='https://test.local')=>{const r=await fn({request:new Request('https://test.local/'+path,{method:input?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(id?{Cookie:'session='+(typeof id==='string'?id:String(id).repeat(64))}:{})},...(input?{body:JSON.stringify(input)}:{})}),env:{DB:db},waitUntil(){}});return {status:r.status,cookie:r.headers.get('Set-Cookie'),...await r.json()};};
// Permisos
assert.equal((await call(reset,'api/admin-reset-password',{username:'Cristi'},2)).status,403,'un usuario normal no puede');
assert.equal((await call(reset,'api/admin-reset-password',{username:'Cristi'},3)).status,403,'otro administrador no puede');
assert.equal((await call(reset,'api/admin-reset-password',{username:'Cristi'},0)).status,403,'sin sesion no puede');
assert.equal((await call(reset,'api/admin-reset-password',{username:'Cristi'},1,'https://evil.local')).status,403,'otro origen no puede');
assert.equal((await call(reset,'api/admin-reset-password',{username:'admin1'})).status,400,'no sobre si mismo');assert.equal((await call(reset,'api/admin-reset-password',{username:'nadie'})).status,404);
assert.equal(sql.prepare('SELECT password_hash p FROM users WHERE id=2').get().p,await hash('anterior2'),'nada cambia si se rechaza');
// Restablecer
const done=await call(reset,'api/admin-reset-password',{username:'cristi'});assert.equal(done.status,200);assert.match(done.temporaryPassword,/^[A-HJ-NP-Z2-9]{12}$/);assert.equal(done.username,'Cristi');
const row=sql.prepare('SELECT * FROM users WHERE id=2').get();assert.equal(row.must_change_password,1);assert.notEqual(row.password_hash,done.temporaryPassword,'se guarda solo la huella');assert.equal(row.password_hash,await hash(done.temporaryPassword));
assert.equal(sql.prepare('SELECT COUNT(*) n FROM sessions WHERE user_id=2').get().n,0,'cierra sus sesiones');
const audit=sql.prepare("SELECT * FROM admin_audit_log WHERE action='reset_password'").get();assert.equal(audit.target_user_id,2);assert.ok(!JSON.stringify(audit).includes(done.temporaryPassword),'la temporal no queda registrada');
assert.equal((await call(login,'api/login',{username:'Cristi',password:'anterior2'},0)).status,401,'la anterior deja de valer');
// Entrar y cambiar
const entered=await call(login,'api/login',{username:'Cristi',password:done.temporaryPassword},0);assert.equal(entered.status,200);assert.equal(entered.user.must_change_password,true);
const token=/session=([a-f0-9]{64})/.exec(entered.cookie)[1];assert.equal((await call(me,'api/me',null,token)).user.must_change_password,true,'la web sabe que debe cambiarla');
assert.equal((await call(change,'api/change-password',{password:'corta',confirm:'corta'},token)).status,400);assert.equal((await call(change,'api/change-password',{password:'nuevaclave1',confirm:'otraclave11'},token)).status,400);assert.equal((await call(change,'api/change-password',{password:done.temporaryPassword,confirm:done.temporaryPassword},token)).status,400,'no vale repetir la temporal');
assert.equal((await call(change,'api/change-password',{password:'nuevaclave1',confirm:'nuevaclave1'},token,'https://evil.local')).status,403);
assert.equal((await call(change,'api/change-password',{password:'nuevaclave1',confirm:'nuevaclave1'},token)).status,200);
assert.equal((await call(me,'api/me',null,token)).user.must_change_password,false);assert.equal((await call(change,'api/change-password',{password:'otraclave12',confirm:'otraclave12'},token)).status,403,'solo cuando esta pendiente');
assert.equal((await call(login,'api/login',{username:'Cristi',password:done.temporaryPassword},0)).status,401,'la temporal deja de valer');assert.equal((await call(login,'api/login',{username:'Cristi',password:'nuevaclave1'},0)).status,200);
// Caducidad
const again=await call(reset,'api/admin-reset-password',{username:'Cristi'});sql.prepare("UPDATE users SET temporary_password_until='2000-01-01T00:00:00Z' WHERE id=2").run();const late=await call(login,'api/login',{username:'Cristi',password:again.temporaryPassword},0);assert.equal(late.status,403);assert.match(late.error,/caducado/);
const shell=readFileSync(new URL('../shell.js',import.meta.url),'utf8');assert.ok(shell.includes("user?.must_change_password&&pageKey!=='change-password'"),'la web obliga a cambiarla');
console.log('PASS Contraseñas: solo admin1 restablece, cierra sesiones, sin guardar la temporal en claro, cambio obligado y caducidad a las 24 horas.');
