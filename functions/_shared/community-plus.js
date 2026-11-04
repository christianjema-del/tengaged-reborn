import {schemaReady170,markSchema170} from './schema-ready170.js';
import {COLOR_LEVELS} from '../../color-level-catalog.js';
import {ensureProfileSchema,getSessionUser} from './auth.js';
import {ensureCommunitySchema} from './community.js';
import {ensureSocial} from './social.js';
const ready=new WeakMap();
export async function ensureCommunityPlus(db){
 if(ready.has(db))return ready.get(db);
 const task=(async()=>{
 if(await schemaReady170(db,'community-plus-170'))return;
 await ensureProfileSchema(db);await ensureCommunitySchema(db);await ensureSocial(db);
 const tables=[
 `CREATE TABLE IF NOT EXISTS blog_comment_votes(comment_id INTEGER NOT NULL,user_id INTEGER NOT NULL,value INTEGER NOT NULL CHECK(value IN(-1,1)),PRIMARY KEY(comment_id,user_id))`,
 `CREATE TABLE IF NOT EXISTS private_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender INTEGER NOT NULL,recipient INTEGER NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE INDEX IF NOT EXISTS private_messages_recipient ON private_messages(recipient,id)`,
 `CREATE TABLE IF NOT EXISTS user_blocks(blocker INTEGER NOT NULL,blocked INTEGER NOT NULL,PRIMARY KEY(blocker,blocked))`,
 `CREATE TABLE IF NOT EXISTS profile_questions(id INTEGER PRIMARY KEY AUTOINCREMENT,asker INTEGER NOT NULL,target INTEGER NOT NULL,question TEXT NOT NULL,answer TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,answered_at TEXT)`,
 `CREATE TABLE IF NOT EXISTS community_groups(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id INTEGER NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL,admission TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS group_members(group_id INTEGER NOT NULL,user_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'accepted',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(group_id,user_id))`,
 `CREATE TABLE IF NOT EXISTS group_topics(id INTEGER PRIMARY KEY AUTOINCREMENT,group_id INTEGER NOT NULL,user_id INTEGER NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,locked INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS group_replies(id INTEGER PRIMARY KEY AUTOINCREMENT,topic_id INTEGER NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS group_polls(id INTEGER PRIMARY KEY AUTOINCREMENT,group_id INTEGER NOT NULL,user_id INTEGER NOT NULL,title TEXT NOT NULL,options TEXT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS group_votes(poll_id INTEGER NOT NULL,user_id INTEGER NOT NULL,choice INTEGER NOT NULL,PRIMARY KEY(poll_id,user_id))`,
 `CREATE TABLE IF NOT EXISTS group_images(id INTEGER PRIMARY KEY AUTOINCREMENT,group_id INTEGER NOT NULL,user_id INTEGER NOT NULL,title TEXT NOT NULL,image_data TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS blog_votes(post_id INTEGER NOT NULL,user_id INTEGER NOT NULL,value INTEGER NOT NULL CHECK(value IN(-1,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(post_id,user_id))`,
 `CREATE TABLE IF NOT EXISTS blog_comments(id INTEGER PRIMARY KEY AUTOINCREMENT,post_id INTEGER NOT NULL,user_id INTEGER NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`];
 const statements=[...tables];
 statements.push(...[
 'CREATE INDEX IF NOT EXISTS private_messages_sender ON private_messages(sender,id)',
 'CREATE INDEX IF NOT EXISTS group_topics_group ON group_topics(group_id,id)',
 'CREATE INDEX IF NOT EXISTS group_replies_topic ON group_replies(topic_id,id)',
 'CREATE INDEX IF NOT EXISTS blog_comments_post ON blog_comments(post_id,id)',
 'CREATE INDEX IF NOT EXISTS questions_target ON profile_questions(target,id)']);
 await db.batch(statements.map(sql=>db.prepare(sql)));
 try{await db.prepare('ALTER TABLE blog_comments ADD COLUMN hidden162 INTEGER NOT NULL DEFAULT 0').run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
 for(const table of ['blog_votes','blog_comment_votes'])try{await db.prepare('ALTER TABLE '+table+' ADD COLUMN weight INTEGER NOT NULL DEFAULT 1').run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}

 await db.prepare('CREATE TABLE IF NOT EXISTS community_migrations(key TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 if(!await db.prepare("SELECT key FROM community_migrations WHERE key='blog-weights109'").first()){
 const expression="CASE (SELECT si.theme_code FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=vote.user_id AND inv.is_equipped=1 AND si.category='Tarjetas de color' LIMIT 1) "+COLOR_LEVELS.map(l=>"WHEN '"+l.code+"' THEN "+l.power).join(' ')+" ELSE 1 END";
 await db.batch([...['blog_votes','blog_comment_votes'].map(table=>db.prepare(`UPDATE ${table} AS vote SET weight=${expression} WHERE NOT EXISTS(SELECT 1 FROM community_migrations WHERE key='blog-weights109')`)),db.prepare("INSERT OR IGNORE INTO community_migrations(key) VALUES('blog-weights109')")]);
 }

 await markSchema170(db,'community-plus-170');

 })();ready.set(db,task);try{await task;}catch(e){ready.delete(db);throw e;}
}
export function fail(message,status=400){return Response.json({ok:false,message},{status});}
export function ok(data={}){return Response.json({ok:true,...data},{headers:{'Cache-Control':'no-store'}});}
export async function context(request,db){await ensureCommunityPlus(db);return {db,url:new URL(request.url),me:await getSessionUser(request,db)};}
export function mutation(request,me){if(!me)return fail('Inicia sesión.',401);if(request.headers.get('Origin')!==new URL(request.url).origin)return fail('Origen no permitido.',403);return null;}
export function text(value,min,max){const v=String(value||'').trim();if(v.length<min||v.length>max)throw Error(`Escribe entre ${min} y ${max} caracteres.`);return v;}
export function number(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw Error('Identificador no válido.');return n;}
export async function userByName(db,name){return db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE AND is_banned=0').bind(String(name||'').trim()).first();}
export async function blocked(db,a,b){return !!await db.prepare('SELECT 1 FROM user_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)').bind(a,b,b,a).first();}
