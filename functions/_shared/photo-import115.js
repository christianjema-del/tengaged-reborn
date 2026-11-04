import {PHOTO_AVATAR_DATA} from './photo-assets115.js';
export async function ensurePhotoAvatar(db){
 const users=(await db.prepare("SELECT id,username FROM users WHERE LOWER(username) IN ('admin1','paucubarsi','mdma') ORDER BY CASE WHEN LOWER(username)='admin1' THEN 0 ELSE 1 END").all()).results;if(!users.length)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const ready=await db.prepare("SELECT COUNT(*) AS n FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id JOIN users u ON u.id=w.user_id WHERE w.import_key LIKE 'photo115-owner-%' AND LOWER(u.username) IN ('admin1','paucubarsi','mdma')").first();if(Number(ready?.n)===users.length)return;
 const owner=users[0],batch=[];
 batch.push(db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(owner.id,owner.username,'Avatar fotográfico · Pau','Avatar completo: sustituye visualmente todas las piezas al equiparlo.','sky',0,'skin',PHOTO_AVATAR_DATA,'photo115-source'));
 batch.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) VALUES(?,?,last_insert_rowid())').bind('photo115-source',owner.id));
 for(const u of users){batch.push(db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key='photo115-source'").bind(u.id));batch.push(db.prepare("INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,design_id FROM wardrobe_imports WHERE import_key='photo115-source'").bind('photo115-owner-'+u.id,u.id));}
 batch.push(db.prepare("INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key='photo115-source'"));await db.batch(batch);
}
