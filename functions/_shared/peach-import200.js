import {PEACH_DESIGNS200} from './peach-assets200.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
// Owner-only grants. Preserve the original transparent 200x230 canvases.
export async function ensurePeachDesigns200(db,user){
 if(user?.username?.toLowerCase()!=='peach')return;
 const marker='peach-wardrobe200-'+user.id;
 if(await schemaReady170(db,marker))return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const batch=[];
 for(const d of PEACH_DESIGNS200){
  const key=d.key+'-'+user.id;
  batch.push(db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(user.id,user.username,d.title,'Diseño original del armario de Peach.','sky',0,d.layer_type,d.image_data,key));
  batch.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) SELECT ?,?,id FROM community_designs WHERE user_id=? AND title=? AND image_data=? ORDER BY id DESC LIMIT 1').bind(key,user.id,user.id,d.title,d.image_data));
  batch.push(db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?").bind(user.id,key,user.id));
  batch.push(db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?').bind(key,user.id));
 }
 await db.batch(batch);
 await markSchema170(db,marker);
}
