import {onRequest as avatar} from '../functions/api/avatar.js';
import {ensureDesignManagement} from '../functions/_shared/design-management.js';
import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {onRequest as designs} from '../functions/api/designs.js';import {ensureProfileSchema} from '../functions/_shared/auth.js';import {ensureCommunitySchema} from '../functions/_shared/community.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0,t_money INTEGER DEFAULT 0);CREATE TABLE sessions(token_hash TEXT,user_id INTEGER,expires_at TEXT)');class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}async all(){return {results:sql.prepare(this.q).all(...this.a)};}async run(){const r=sql.prepare(this.q).run(...this.a);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}}const db={prepare:q=>new Q(q),async batch(items){sql.exec('BEGIN');try{const out=[];for(const q of items)out.push(await q.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const hash=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
for(let id=1;id<=3;id++){sql.prepare('INSERT INTO users(id,username,is_admin) VALUES(?,?,?)').run(id,['admin1','Cristi','Other'][id-1],id===1?1:0);sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await hash(String(id).repeat(64)),id,'2099-01-01');}
await ensureProfileSchema(db);await ensureCommunitySchema(db);

import {CRISTI_DESIGNS} from '../functions/_shared/cristi-assets100.js';
import {placementForDesign} from '../avatar-fit.js';
async function wardrobe(id){return avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?format=json',{headers:{Cookie:'session='+String(id).repeat(64)}})});}
for(let n=0;n<3;n++)assert.equal((await wardrobe(2)).status,200);
const records=sql.prepare("SELECT * FROM wardrobe_imports WHERE user_id=2 AND import_key NOT LIKE 'photo148-%'").all();assert.equal(records.length,4);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM community_designs WHERE user_id=2').get().n,5);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM user_inventory WHERE user_id=2').get().n,5);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM withdrawn_designs WHERE design_id IN (SELECT id FROM community_designs WHERE user_id=2)').get().n,5);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM user_avatar_layers').get().n,0);
assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=2').get().t_money,0);
await wardrobe(1);assert.equal(sql.prepare(`SELECT COUNT(*) n FROM user_inventory WHERE user_id=1 AND item_code IN (SELECT 'userdesign-'||id FROM community_designs WHERE user_id=2)`).get().n,0);
for(const d of CRISTI_DESIGNS){assert.ok(d.image_data.startsWith('data:image/webp;base64,'));assert.ok(Buffer.from(d.image_data.split(',')[1],'base64').length<262144);assert.notEqual(placementForDesign(d.image_data).y,0);}
const id=records[0].design_id;
async function equip(user){return avatar({env:{DB:db},request:new Request('https://test.local/api/avatar',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json',Cookie:'session='+String(user).repeat(64)},body:JSON.stringify({settings:{},layers:{shirt:id}})})});}
assert.equal((await equip(3)).status,403);assert.equal((await equip(2)).status,200);
assert.equal(sql.prepare('SELECT design_id FROM user_avatar_layers WHERE user_id=2').get().design_id,id);
const image=await avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?username=Cristi')});assert.equal(image.status,200);assert.ok((await image.text()).includes('data:image/webp;base64,'));
sql.prepare("UPDATE user_avatar_settings SET settings='broken' WHERE user_id=2").run();
const recovery=await avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?username=Cristi')});assert.equal(recovery.status,200);assert.equal(sql.prepare('SELECT settings FROM user_avatar_settings WHERE user_id=2').get().settings,'broken');
console.log('PASS four Cristi grants, repeat safety, no charge/auto equip/public listing, ownership, fitting and corrupt avatar recovery');
// Reading a public portrait on an existing install must not reseed shop catalogs.
let catalogWrites=0;const freshBinding={...db,prepare(q){if(/INSERT.*shop_items/i.test(q))catalogWrites++;return db.prepare(q);}};
const publicRead=await avatar({env:{DB:freshBinding},request:new Request('https://test.local/api/avatar?username=Cristi')});assert.equal(publicRead.status,200);assert.equal(catalogWrites,0);
sql.prepare("UPDATE community_designs SET image_data='data:image/png;base64,broken' WHERE id=?").run(id);
const isolated=await avatar({env:{DB:db},request:new Request('https://test.local/api/avatar?username=Cristi')});assert.equal(isolated.status,200);assert.equal((await isolated.text()).includes('base64,broken'),false);assert.equal(sql.prepare('SELECT design_id FROM user_avatar_layers WHERE user_id=2').get().design_id,id,'broken artwork does not delete ownership or equipped selection');
console.log('PASS public image reads avoid catalog seeding, corrupt artwork does not break the portrait or erase inventory');
