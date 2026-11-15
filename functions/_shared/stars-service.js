// V373: Stars. Mientras exista una partida sin terminar (la de pruebas de admin1 incluida), no se
// crea ninguna otra: nadie puede unirse a un Stars distinto hasta que esa partida termine.
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
import {ensureGameHistorySchema} from './games.js';
import {freshStars,advanceStars,actStars,starsView,STARS_CAPACITY} from './stars-engine.js';
export async function ensureStars(db){
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 if(!await schemaReady170(db,'stars373')){
  await db.prepare('CREATE TABLE IF NOT EXISTS stars_matches(id INTEGER PRIMARY KEY AUTOINCREMENT,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)').run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS stars_one_open373 ON stars_matches(json_extract(state,'$.phase')!='finished') WHERE json_extract(state,'$.phase')!='finished'").run();
  // V373: la primera partida es de pruebas y solo admin1 puede unirse; mientras esté sin terminar,
  // nadie puede abrir ni unirse a otra Stars (el índice único solo permite una partida sin terminar).
  const seed=freshStars(0);seed.testOnly373=true;
  await db.prepare('INSERT INTO stars_matches(state) VALUES(?)').bind(JSON.stringify(seed)).run();
  await markSchema170(db,'stars373');
 }
}
export async function waitingStars(db){
 await ensureStars(db);
 await db.prepare("INSERT OR IGNORE INTO stars_matches(state) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM stars_matches WHERE json_extract(state,'$.phase')!='finished')").bind(JSON.stringify(freshStars(0))).run();
}
export async function starsListing(db,user){await waitingStars(db);return (await db.prepare('SELECT id,state FROM stars_matches ORDER BY id DESC LIMIT 50').all()).results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,phase:s.phase,round:s.round,createdAt:s.createdAt,finishedAt:s.finishedAt,players:s.players.length,capacity:STARS_CAPACITY,testOnly:!!s.testOnly373,mine:!!s.players.find(p=>p.id===user?.id)};});}
export async function starsMatch(db,id,user,input=null,now=Date.now()){
 await ensureStars(db);
 for(let n=0;n<32;n++){
  const row=await db.prepare('SELECT id,revision,state FROM stars_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe esa partida de Stars.');
  const s=JSON.parse(row.state);s.id=id;advanceStars(s,now);
  if(input)actStars(s,user,input,now);
  const payload=JSON.stringify(s);
  if(payload!==row.state){
   const writes=[db.prepare('UPDATE stars_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,id,row.revision)];
   if(s.phase==='finished'&&JSON.parse(row.state).phase!=='finished')for(const p of s.players.filter(p=>!p.bot))writes.push(db.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'STARS',?,?,?,?,? WHERE EXISTS(SELECT 1 FROM stars_matches WHERE id=? AND state=?) ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at").bind(p.username,String(id),'finished','Puesto '+p.placement,new Date(p.joinedAt).toISOString(),new Date(s.finishedAt).toISOString(),id,payload));
   const result=await db.batch(writes);if(!result[0].meta.changes)continue;
  }
  return {match:starsView(s,user,now)};
 }throw Error('Hay actividad simultánea. Reintenta.');
}
