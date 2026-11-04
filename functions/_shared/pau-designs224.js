import {ensureAvatar} from './avatar-settings.js';
export const PAU_DESIGNS224=[{id:101,title:'Moñitos',layer:'hair'},{id:100,title:'Pelo Chico',layer:'hair'},{id:99,title:'Hunger Games Chico',layer:'shirt'},{id:98,title:'Hunger Games Chica',layer:'shirt'}];
export async function repairPauDesigns224(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS pau_design_categories224(design_id INTEGER PRIMARY KEY,previous_layer TEXT,corrected_layer TEXT NOT NULL,at TEXT DEFAULT CURRENT_TIMESTAMP)').run();
 const done=await db.prepare('SELECT COUNT(*) AS n FROM pau_design_categories224').first();if(Number(done?.n)===PAU_DESIGNS224.length)return;
 const matches=[];for(const item of PAU_DESIGNS224){const d=await db.prepare('SELECT id,title,author,layer_type FROM community_designs WHERE id=? AND image_data IS NOT NULL').bind(item.id).first();if(d&&d.author.toLowerCase()==='paucubarsi'&&d.title.toLowerCase()===item.title.toLowerCase())matches.push({...item,previous:d.layer_type});}
 if(!matches.length)return;await ensureAvatar(db);
 const tasks=[];
 for(const d of matches){
  tasks.push(db.prepare('INSERT OR IGNORE INTO pau_design_categories224(design_id,previous_layer,corrected_layer) VALUES(?,?,?)').bind(d.id,d.previous,d.layer));
  tasks.push(db.prepare('UPDATE community_designs SET layer_type=? WHERE id=?').bind(d.layer,d.id));
  // Move an equipped copy only into a free category; never replace another equipped item.
  tasks.push(db.prepare(`INSERT OR IGNORE INTO user_avatar_layers(user_id,layer_type,design_id) SELECT user_id,?,? FROM user_inventory WHERE item_code=? AND is_equipped=1`).bind(d.layer,d.id,'userdesign-'+d.id));
  tasks.push(db.prepare('DELETE FROM user_avatar_layers WHERE design_id=? AND layer_type<>?').bind(d.id,d.layer));
  tasks.push(db.prepare(`UPDATE user_inventory SET is_equipped=0 WHERE item_code=? AND is_equipped=1 AND NOT EXISTS(SELECT 1 FROM user_avatar_layers a WHERE a.user_id=user_inventory.user_id AND a.layer_type=? AND a.design_id=?)`).bind('userdesign-'+d.id,d.layer,d.id));
 }
 await db.batch(tasks);
}
