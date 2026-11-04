import {onRequest as avatar} from '../functions/api/avatar.js';
import {ensureDesignManagement} from '../functions/_shared/design-management.js';
import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {onRequest as designs} from '../functions/api/designs.js';import {ensureProfileSchema} from '../functions/_shared/auth.js';import {ensureCommunitySchema} from '../functions/_shared/community.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const q of items)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const hash=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
for(let id=1;id<=3;id++){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,?)').run(id,['admin1','Peach','Other'][id-1],id===1?1:0);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await hash(String(id).repeat(64)),id,'2099-01-01');}
await ensureProfileSchema(db);await ensureCommunitySchema(db);


import {PEACH_DESIGNS200} from '../functions/_shared/peach-assets200.js';
import {placementForDesign} from '../avatar-fit.js';
async function wardrobe(id){return avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?format=json',{headers:{Cookie:'session='+String(id).repeat(64)}})});}
await wardrobe(3);
assert.equal(sql.prepare("SELECT count(*) n FROM wardrobe_imports WHERE import_key LIKE 'peach200-%'").get().n,0);
for(let i=0;i<3;i++)assert.equal((await wardrobe(2)).status,200);
const rows=sql.prepare("SELECT d.*,i.is_equipped FROM wardrobe_imports w JOIN community_designs d ON d.id=w.design_id JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key LIKE 'peach200-%'").all();
assert.equal(rows.length,4);assert.equal(new Set(rows.map(r=>r.layer_type)).size,4);
for(const d of PEACH_DESIGNS200){const row=rows.find(r=>r.layer_type===d.layer_type);assert.equal(row.image_data,d.image_data);assert.equal(row.is_equipped,0);assert.deepEqual(placementForDesign(d.image_data),{x:0,y:0,width:200,height:230});assert.ok(sql.prepare('SELECT 1 FROM withdrawn_designs WHERE design_id=?').get(row.id));}
assert.equal(sql.prepare('SELECT count(*) n FROM user_avatar_layers WHERE user_id=2').get().n,0);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money,0);
const layers=Object.fromEntries(rows.map(r=>[r.layer_type,r.id]));
async function save(id,layers){return avatar({env:{DB:db},request:new Request('https://test.local/api/avatar',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json',Cookie:'session='+String(id).repeat(64)},body:JSON.stringify({settings:{},layers})})});}
assert.equal((await save(3,layers)).status,403);
assert.equal((await save(2,layers)).status,200);
assert.equal(sql.prepare('SELECT count(*) n FROM user_avatar_layers WHERE user_id=2').get().n,4);
const response=await avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?username=Peach')});assert.equal(response.status,200);const svg=await response.text();for(const d of PEACH_DESIGNS200)assert.ok(svg.includes(d.image_data));
assert.equal((await save(2,{})).status,200);await wardrobe(2);assert.equal(sql.prepare('SELECT count(*) n FROM user_avatar_layers WHERE user_id=2').get().n,0);
assert.equal(sql.prepare("SELECT count(*) n FROM community_designs WHERE image_data IN (SELECT image_data FROM community_designs WHERE id IN (SELECT design_id FROM wardrobe_imports WHERE import_key LIKE 'peach200-%'))").get().n,4);
console.log('PASS Peach originals: private grants, correct geometry, repeat safety, no charge or autoequip, all four equip together, ownership and unequip');
