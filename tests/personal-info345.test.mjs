import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
import {ensureProfileSchema} from '../functions/_shared/auth.js';import {onRequest,cleanPersonalInfo345} from '../functions/api/personal-info.js';
// V345: «Información personal» como en el Tengaged original; sustituye al editor de biografía duplicado del perfil.
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes)}};}}
const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{for(const q of items)await q.run();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
await ensureProfileSchema(db);sql.prepare("INSERT INTO users(id,username,bio) VALUES(1,'Ana','Hola')").run();sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update('a'.repeat(64)).digest('hex'),1,'2099-01-01');
const call=(method,body,origin='https://t.local')=>onRequest({env:{DB:db},request:new Request('https://t.local/api/personal-info',{method,headers:{Cookie:'session='+'a'.repeat(64),Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})});
let r=await call('GET');let d=await r.json();assert.equal(r.status,200);assert.equal(d.info.bio,'Hola');assert.equal(d.info.full_name,'');assert.equal(d.info.news,true);
r=await call('PUT',{full_name:' Ana García ',birth_day:'29',birth_month:'12',birth_year:'1993',language:'Español',gender:'Mujer',bio:'Nueva bio',blog:'http://ana.blogspot.com',news:false,notify:true});assert.equal(r.status,200,await r.clone().text());
d=await (await call('GET')).json();assert.deepEqual({...d.info},{username:'Ana',bio:'Nueva bio',full_name:'Ana García',birth_day:29,birth_month:12,birth_year:1993,language:'Español',gender:'Mujer',blog:'ana.blogspot.com',news:false,notify:true});
assert.equal(sql.prepare('SELECT bio FROM users WHERE id=1').get().bio,'Nueva bio','la biografía sigue en users.bio');
for(const bad of [{birth_day:'31',birth_month:'2',birth_year:'2000'},{birth_day:'1',birth_month:'',birth_year:''},{language:'Klingon'},{gender:'X'},{blog:'javascript:alert(1)'},{bio:'x'.repeat(1001)},{full_name:'x'.repeat(61)}])assert.throws(()=>cleanPersonalInfo345(bad),Error,JSON.stringify(bad));
assert.equal((await call('PUT',{bio:'x'},'https://evil.example')).status,403,'solo desde la propia web');
assert.equal((await onRequest({env:{DB:db},request:new Request('https://t.local/api/personal-info')})).status,401,'hace falta sesión');
const profile=readFileSync(new URL('../profile.html',import.meta.url),'utf8');assert.doesNotMatch(profile,/editBio|bioForm|bioInput/,'sin el editor duplicado del perfil');
const page=readFileSync(new URL('../profile-edit.html',import.meta.url),'utf8');for(const t of ['Información personal','Cambiar imagen','Cambiar contraseña','Nombre completo','Fecha de nacimiento','Idioma preferido para los juegos','Sexo','Sobre mí. Algunas palabras que te describen.','¿Tienes blog?','http://','Guardar'])assert.ok(page.includes(t),t);
assert.match(page,/profile-edit345\.js\?v=345/);
console.log('PASS V345: Información personal 1:1, guarda biografía y datos, valida y sin editor duplicado');
