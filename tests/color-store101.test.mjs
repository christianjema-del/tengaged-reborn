import assert from 'node:assert/strict';import {COLOR_LEVELS} from '../color-level-catalog.js';import {readFileSync,existsSync} from 'node:fs';import {onRequest as shop} from '../functions/api/shop.js';
// Reuse the in-memory D1 fixture from the wardrobe integration test.
const source=readFileSync(new URL('./design-management92.test.mjs',import.meta.url),'utf8');const setup=source.slice(source.indexOf('const sql='),source.indexOf('const expected='));
import {DatabaseSync} from 'node:sqlite';import {ensureProfileSchema} from '../functions/_shared/auth.js';import {ensureCommunitySchema} from '../functions/_shared/community.js';
const {db,sql}=await (new Function('DatabaseSync','crypto','ensureProfileSchema','ensureCommunitySchema','return (async()=>{'+setup+';return {db,sql};})()'))(DatabaseSync,crypto,ensureProfileSchema,ensureCommunitySchema);
sql.exec('UPDATE users SET karma=30000,t_money=100000 WHERE id=1');
async function call(body,origin='https://test.local'){const r=await shop({env:{DB:db},request:new Request('https://test.local/api/shop',{method:'POST',headers:{Origin:origin,Cookie:'session='+ '1'.repeat(64),'Content-Type':'application/json'},body:JSON.stringify(body)})});return {status:r.status,...await r.json()};}
assert.equal(COLOR_LEVELS.length,20);assert.equal(COLOR_LEVELS.filter(x=>x.image).length,10);
for(const l of COLOR_LEVELS.filter(x=>x.image)){const file=new URL('..'+l.image,import.meta.url);assert.ok(existsSync(file));assert.ok(readFileSync(file).subarray(0,4).toString().startsWith('<svg')||readFileSync(file).subarray(0,3).toString()==='GIF');}
assert.equal((await call({action:'buy',item_code:'color-card-blue'})).status,409);
assert.equal((await call({action:'buy',item_code:'color-card-yellow'},'https://other.invalid')).status,403);
assert.equal((await call({action:'buy',item_code:'color-card-yellow'})).status,201);assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,99970);assert.equal(sql.prepare("SELECT is_equipped FROM user_inventory WHERE user_id=1 AND item_code='color-card-yellow'").get().is_equipped,1);
assert.equal((await call({action:'buy',item_code:'color-card-yellow'})).status,409);assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,99970);
assert.equal((await call({action:'wear_white',item_code:'color-card-white'})).status,200);assert.equal(sql.prepare('SELECT t_money FROM users WHERE id=1').get().t_money,99970);assert.equal(sql.prepare("SELECT is_equipped FROM user_inventory WHERE user_id=1 AND item_code='color-card-yellow'").get().is_equipped,0);
assert.equal((await call({action:'buy',item_code:'color-card-orange'})).status,201);assert.equal(sql.prepare("SELECT COUNT(*) n FROM user_inventory WHERE user_id=1 AND is_equipped=1 AND item_code LIKE 'color-card-%'").get().n,1);
assert.deepEqual(COLOR_LEVELS.slice(-8).map(x=>x.power),[15,20,30,32,34,36,38,40]);
console.log('PASS original GIF assets, exact level powers, ordered purchases, origin guard, one charge, auto equip and free white');
