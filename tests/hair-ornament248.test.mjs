import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {renderAvatar,normalizeAvatar} from '../avatar-art.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const svg=renderAvatar(normalizeAvatar({}),{skin:'data:image/png;base64,SKIN',hair:'data:image/png;base64,HAIR',hair_ornament:'data:image/png;base64,ORNAMENT'});
assert.ok(svg.includes('data-owned-layer="hair_ornament"'),'se dibuja');
const first=svg.indexOf('HAIR'),ornament=svg.indexOf('ORNAMENT'),opening=svg.lastIndexOf('<g transform',ornament);
assert.ok(first<ornament,'va sobre el pelo');assert.ok(svg.slice(opening,ornament).includes('translate(100 156) scale(0.9) translate(-100 -156)'),'sigue a la cabeza al 90 %');
assert.ok(!renderAvatar(normalizeAvatar({}),{skin:'data:image/png;base64,SKIN'}).includes('hair_ornament'),'sin adorno no añade nada');
assert.ok(!renderAvatar(normalizeAvatar({}),{skin:'data:image/png;base64,FULL',_fullBody:true,hair_ornament:'data:image/png;base64,ORNAMENT'}).includes('ORNAMENT'),'cuerpo entero no lleva capas');
for(const f of ['functions/api/designs.js','functions/api/avatar.js','functions/api/try-on.js','avatar-editor.js','designs.html'])assert.ok(read(f).includes('hair_ornament'),f);
assert.equal((read('functions/api/avatar.js').match(/'hair_ornament'/g)||[]).length,2,'quitar y equipar');
assert.match(read('designs.html'),/<option value="hair_ornament">Adorno del pelo<\/option>/);
console.log('PASS adornos del pelo: categoría publicable, equipable y dibujada sobre el pelo siguiendo a la cabeza.');

import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
import {onRequest as avatarApi} from '../functions/api/avatar.js';
import {onRequest as designsApi} from '../functions/api/designs.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER DEFAULT 0,karma INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');
class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}
const db={prepare:q=>new Q(q),batch:async list=>{sql.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
for(const [id,name] of [[1,'Alice'],[2,'Bob']]){const token=String(id).repeat(64);sql.prepare('INSERT INTO users(id,username) VALUES(?,?)').run(id,name);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),id,'2099-01-01');}
const call=async(fn,path,id,body)=>{const r=await fn({env:{DB:db},request:new Request('https://test.local/'+path,{method:body?'POST':'GET',headers:{Origin:'https://test.local',...(id?{Cookie:'session='+String(id).repeat(64)}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})});return r;};
await (await call(avatarApi,'api/avatar?username=Alice',0)).text();
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const published=await call(designsApi,'api/designs',1,{title:'Lazo rojo',description:'Adorno',theme_code:'sky',price:0,layer_type:'hair_ornament',image_data:PNG});const out=await published.json();assert.ok(published.status<300,JSON.stringify(out));
const row=sql.prepare('SELECT id,layer_type FROM community_designs ORDER BY id DESC LIMIT 1').get();assert.equal(row.layer_type,'hair_ornament');
const foreign=await call(avatarApi,'api/avatar',2,{settings:{},layers:{hair_ornament:row.id}});assert.equal(foreign.status,403,'no se equipa sin tenerlo');
sql.exec(`INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(2,'userdesign-${row.id}')`);
const wrong=await call(avatarApi,'api/avatar',2,{settings:{},layers:{hair:row.id}});assert.equal(wrong.status,403,'no se equipa en otra categoría');
const equip=await call(avatarApi,'api/avatar',2,{settings:{},layers:{hair_ornament:row.id}});assert.equal(equip.status,200,await equip.clone().text());
const shown=await (await call(avatarApi,'api/avatar?username=Bob',0)).text();assert.ok(shown.includes('data-owned-layer="hair_ornament"'),'el avatar público lo muestra');
const off=await call(avatarApi,'api/avatar',2,{action:'unequip',layer_type:'hair_ornament'});assert.equal(off.status,200);assert.ok(!(await (await call(avatarApi,'api/avatar?username=Bob',0)).text()).includes('hair_ornament'),'se puede quitar');
console.log('PASS adornos del pelo: publicar, propiedad, categoría, equipar, mostrar y quitar con la API real.');
