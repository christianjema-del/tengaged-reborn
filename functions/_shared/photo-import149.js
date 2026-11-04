import {PHOTO_GIFTS149} from './photo-assets149.js';
export async function ensurePhotoGifts149(db){
 const users=(await db.prepare("SELECT id,username FROM users WHERE lower(username) IN ('lamine','admin1','fentanilo') ORDER BY id").all()).results;if(!users.length)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 for(const gift of PHOTO_GIFTS149){
  const missing=[];for(const u of users){const key='photo149-'+gift.key+'-'+u.id;if(!await db.prepare("SELECT w.design_id FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key=?").bind(key).first())missing.push(u);}
  if(!missing.length)continue;
  const owner=users[0],source='photo149-source-'+gift.key,batch=[
   db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(owner.id,owner.username,gift.title,'Avatar completo. Se muestra únicamente la imagen original al equiparlo.','sky',0,'skin',gift.data,source),
   db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,id FROM community_designs WHERE user_id=? AND title=? AND image_data=? ORDER BY id DESC LIMIT 1').bind(source,owner.id,owner.id,gift.title,gift.data)
  ];
  for(const u of missing){batch.push(db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key=?").bind(u.id,source));batch.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,design_id FROM wardrobe_imports WHERE import_key=?').bind('photo149-'+gift.key+'-'+u.id,u.id,source));}
  batch.push(db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=?').bind(source));await db.batch(batch);
 }
}
