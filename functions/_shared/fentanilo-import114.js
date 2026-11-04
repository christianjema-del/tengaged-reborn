import {FENTANILO_DESIGNS} from './fentanilo-assets114.js';
export async function ensureFentaniloDesigns(db){
 const user=await db.prepare("SELECT id,username FROM users WHERE LOWER(username)='fentanilo'").first();if(!user)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const ready=await db.prepare("SELECT COUNT(*) AS n FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.user_id=? AND w.import_key LIKE 'fentanilo114-%'").bind(user.id).first();if(Number(ready?.n)===4)return;
 const batch=[];for(const d of FENTANILO_DESIGNS){
 batch.push(db.prepare('INSERT INTO community_designs(user_id,author,title,description,theme_code,price,layer_type,image_data) SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM wardrobe_imports WHERE import_key=?)').bind(user.id,user.username,d.title,'Diseño del armario de Fentanilo.','sky',0,d.layer_type,d.image_data,d.key));
 batch.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) VALUES(?,?,last_insert_rowid())').bind(d.key,user.id));
 batch.push(db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) SELECT ?,'userdesign-'||design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?").bind(user.id,d.key,user.id));
 batch.push(db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) SELECT design_id FROM wardrobe_imports WHERE import_key=? AND user_id=?').bind(d.key,user.id));
 }await db.batch(batch);
}
