import {CRISTI_DESIGNS} from './cristi-assets100.js';
export async function ensureCristiDesigns(db,user){
 if(user?.username?.toLowerCase()!=='cristi')return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const ready=await db.prepare("SELECT COUNT(*) AS n FROM wardrobe_imports WHERE user_id=? AND import_key IN ('cristi100-green','cristi100-corset','cristi100-white','cristi100-hair')").bind(user.id).first();if(ready.n===4)return;
 const batch=[];
 for(const d of CRISTI_DESIGNS){
 batch.push(db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(user.id,user.username,d.title,d.description,d.theme_code,d.price,d.layer_type,d.image_data,d.key));
 batch.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) VALUES(?,?,last_insert_rowid())').bind(d.key,user.id));
 batch.push(db.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,\'userdesign-\'||design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?').bind(user.id,d.key,user.id));
 // These are wardrobe grants, not unsolicited public shop listings.
 batch.push(db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?').bind(d.key,user.id));
 }
 await db.batch(batch);
}
