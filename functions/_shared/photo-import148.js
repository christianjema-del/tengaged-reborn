import {PHOTO_GIFTS148} from './photo-assets148.js';
export async function ensurePhotoGifts148(db){
 const users=(await db.prepare("SELECT id,username FROM users WHERE lower(username) IN ('peach','cristi','daisyjane')").all()).results;if(!users.length)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 for(const gift of PHOTO_GIFTS148){const u=users.find(u=>u.username.toLowerCase()===gift.username.toLowerCase());if(!u)continue;const key='photo148-'+u.username.toLowerCase()+'-'+u.id;
 if(await db.prepare("SELECT w.design_id FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key=?").bind(key).first())continue;
 await db.batch([
 db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(u.id,u.username,gift.title,'Avatar completo: al equiparlo se muestra únicamente esta imagen.','sky',0,'skin',gift.data,key),
 db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,id FROM community_designs WHERE user_id=? AND title=? AND image_data=? ORDER BY id DESC LIMIT 1').bind(key,u.id,u.id,gift.title,gift.data),
 db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key=?").bind(u.id,key),
 db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=?').bind(key)
 ]);}
}
