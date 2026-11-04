export const WARDROBE_GRANTS118=Object.freeze([
 {id:38,layer:'shirt',author:'Ricardito',users:['Ricardito','admin1']},
 {id:39,layer:'hair',users:['Ricardito','admin1']},
 {id:40,layer:'eyes',author:'Ricardito',users:['Ricardito','admin1']},
 {id:42,layer:'skin',author:'Peach',users:['Peach','Cristi']},
 {id:43,layer:'eyes',author:'Peach',users:['Peach','Cristi']}
]);
export async function ensureWardrobeGrants118(db){
 const users=(await db.prepare("SELECT id,username FROM users WHERE LOWER(username) IN ('ricardito','admin1','peach','cristi')").all()).results;if(!users.length)return;
 await db.prepare('CREATE TABLE IF NOT EXISTS wardrobe_imports(import_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,design_id INTEGER NOT NULL)').run();
 const expected=users.reduce((n,u)=>n+WARDROBE_GRANTS118.filter(g=>g.users.some(name=>name.toLowerCase()===u.username.toLowerCase())).length,0);
 const ready=await db.prepare("SELECT COUNT(*) AS n FROM wardrobe_imports w JOIN user_inventory i ON i.user_id=w.user_id AND i.item_code='userdesign-'||w.design_id WHERE w.import_key LIKE 'wardrobe118-%'").first();if(Number(ready?.n)===expected)return;
 const tasks=[];
 for(const grant of WARDROBE_GRANTS118){
  const d=await db.prepare('SELECT id,author,layer_type,image_data FROM community_designs WHERE id=?').bind(grant.id).first();if(!d?.image_data||(grant.author&&d.author?.toLowerCase()!==grant.author.toLowerCase()))continue;
  // The withdrawn #39 image is a verified hair layer, still available for this explicit grant.
  if(d.id===39&&d.layer_type==='profile')tasks.push(db.prepare("UPDATE community_designs SET layer_type='hair' WHERE id=39 AND layer_type='profile'"));
  else if(d.layer_type!==grant.layer)continue;
  for(const user of users.filter(u=>grant.users.some(n=>n.toLowerCase()===u.username.toLowerCase()))){
   const key='wardrobe118-'+user.id+'-'+grant.id;
   tasks.push(db.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(?,?)").bind(user.id,'userdesign-'+grant.id));
   tasks.push(db.prepare('INSERT OR IGNORE INTO wardrobe_imports(import_key,user_id,design_id) VALUES(?,?,?)').bind(key,user.id,grant.id));
  }
 }
 if(tasks.length)await db.batch(tasks);
}
