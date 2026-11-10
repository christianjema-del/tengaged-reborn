// V337: añade el GIF animado al armario de Bowsy (cuenta id 11) como avatar completo de foto.
// Igual que los demás avatares de foto: capa «piel», no está a la venta y al equiparlo solo se ve la imagen.
import {PHOTO_GIFTS337} from './photo-assets337.js';
export const PHOTO_USER337=11;
export async function ensurePhotoGifts337(db){
 const owner=await db.prepare('SELECT id,username FROM users WHERE id=?').bind(PHOTO_USER337).first();if(!owner)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 for(const gift of PHOTO_GIFTS337){
  const key='photo337-'+gift.key+'-'+owner.id,source='photo337-source-'+gift.key;
  if(await db.prepare("SELECT 1 FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key=?").bind(key).first())continue;
  await db.batch([
   db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(owner.id,owner.username,gift.title,'Avatar completo. Se muestra únicamente la imagen original al equiparlo.','sky',0,'skin',gift.data,source),
   db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,id FROM community_designs WHERE user_id=? AND title=? AND layer_type=? ORDER BY id DESC LIMIT 1').bind(source,owner.id,owner.id,gift.title,'skin'),
   db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key=?").bind(owner.id,source),
   db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,design_id FROM wardrobe_imports WHERE import_key=?').bind(key,owner.id,source),
   db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=?').bind(source)
  ]);
 }
}
