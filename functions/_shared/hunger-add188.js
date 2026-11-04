import {player187} from './hunger.js';
export async function addHungerFive188(db,now=Date.now()){
 const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first();if(!row)return;
 const s=JSON.parse(row.state);if(s.edition!==5||s.phase!=='waiting'||s.additions188)return;
 const users=(await db.prepare("SELECT id,username FROM users WHERE lower(username) IN ('oscar','paucubarsi') AND COALESCE(is_system,0)=0 AND COALESCE(is_banned,0)=0").all()).results;if(users.length!==2)return;
 const missing=users.filter(u=>!s.players.some(p=>p.id===u.id||p.username.toLowerCase()===u.username.toLowerCase()));
 if(s.players.length+missing.length>30)throw Error('No hay plazas suficientes para añadir los usuarios solicitados.');
 s.players.push(...missing.map(u=>player187(u.id,u.username)));s.additions188={at:now,users:users.map(u=>u.username)};
 if(missing.length)s.events.unshift({at:now,kind:'lobby-system',text:'Oscar y PauCubarsi incorporados a Hunger Games #5. Inscripciones abiertas; solo admin1 puede iniciar.'});
 const payload=JSON.stringify(s);await db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS hunger_add188(id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied_state TEXT NOT NULL,at INTEGER NOT NULL)'),
  db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=? AND state=?').bind(payload,row.revision,row.state),
  db.prepare('INSERT OR IGNORE INTO hunger_add188 SELECT 1,?,?,? WHERE EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND state=?)').bind(row.state,payload,now,payload)
 ]);
}
