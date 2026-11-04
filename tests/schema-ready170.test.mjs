import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureCommunityPlus} from '../functions/_shared/community-plus.js';
import {ensureProfileSchema} from '../functions/_shared/auth.js';
import {ensureCommunitySchema} from '../functions/_shared/community.js';
import {ensureSocial} from '../functions/_shared/social.js';
import {schemaReady170,markSchema170} from '../functions/_shared/schema-ready170.js';
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password_hash TEXT,is_admin INTEGER,karma INTEGER DEFAULT 0);');
let statements=0;
class S{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new S(this.q,a);}async first(){statements++;return sql.prepare(this.q).get(...this.a)||null;}async all(){statements++;return {results:sql.prepare(this.q).all(...this.a)};}async run(){statements++;return {meta:{changes:Number(sql.prepare(this.q).run(...this.a).changes)}};}}
const wrapper=()=>({prepare:q=>new S(q),batch:async list=>{sql.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}});
await ensureCommunityPlus(wrapper());const cold=statements;assert.ok(cold>100);
statements=0;await ensureCommunityPlus(wrapper());assert.equal(statements,1,'a new D1 wrapper must not repeat DDL, seeding or migrations');
for(const ensure of [ensureProfileSchema,ensureCommunitySchema,ensureSocial]){statements=0;await ensure(wrapper());assert.equal(statements,1);}
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM schema_ready170').get().n,5);
assert.ok(sql.prepare("SELECT name FROM sqlite_master WHERE name='private_messages'").get());
assert.ok(sql.prepare("SELECT name FROM sqlite_master WHERE name='blog_posts'").get());
let fail=true;const broken={prepare(q){if(fail)throw Error('database unavailable');return wrapper().prepare(q);}};
await assert.rejects(ensureProfileSchema(broken),/database unavailable/);fail=false;await ensureProfileSchema(broken);
const separate=new DatabaseSync(':memory:');const other={prepare:q=>({bind(){return this;},async first(){return separate.prepare(q).get()||null;}})};
assert.equal(await schemaReady170(other,'community-plus-170'),false,'completion is never shared with a different database');
console.log('PASS: durable schema completion across new D1 wrappers reduces '+cold+' preparation statements to 1, preserves schemas, retries failed setup and isolates databases.');
