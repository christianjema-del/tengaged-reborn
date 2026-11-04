import {PHOTO_ADMIN127} from './photo-assets127.js';
export async function ensurePhotoAdmin127(db){
 const user=await db.prepare("SELECT id,username FROM users WHERE lower(username)='admin1' LIMIT 1").first();if(!user)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const key='photo127-admin-'+user.id;
 const ready=await db.prepare("SELECT w.design_id FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key=?").bind(key).first();if(ready)return;
 await db.batch([
 db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(user.id,user.username,'Avatar fotográfico · Dúo','Avatar completo. Se muestra únicamente la fotografía al equiparlo.','sky',0,'skin',PHOTO_ADMIN127,'photo127-source'),
 db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) VALUES(?,?,last_insert_rowid())').bind('photo127-source',user.id),
 db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key='photo127-source'").bind(user.id),
 db.prepare("INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,design_id FROM wardrobe_imports WHERE import_key='photo127-source'").bind(key,user.id),
 db.prepare("INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key='photo127-source'")]);
}
