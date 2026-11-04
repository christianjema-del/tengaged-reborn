import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
import {ensureGameHistorySchema} from './games.js';
import {freshDuel,advanceDuel,actDuel,duelView} from './duel212.js';
import {gameData} from './flash-data.js';
export async function ensureDuel(db){
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 if(!await schemaReady170(db,'duel212')){
  await db.prepare('CREATE TABLE IF NOT EXISTS duel_matches(id INTEGER PRIMARY KEY AUTOINCREMENT,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)').run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS duel_one_waiting212 ON duel_matches(json_extract(state,'$.phase')) WHERE json_extract(state,'$.phase')='waiting'").run();
  await markSchema170(db,'duel212');
 }
}
export async function waitingDuel(db){
 await ensureDuel(db);
 // BEGIN/COMMIT is managed by D1 batch; the unique waiting index prevents races.
 await db.prepare("INSERT OR IGNORE INTO duel_matches(state) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM duel_matches WHERE json_extract(state,'$.phase')='waiting')").bind(JSON.stringify(freshDuel(0))).run();
}
export async function duelListing(db,user){await waitingDuel(db);return (await db.prepare('SELECT id,state FROM duel_matches ORDER BY id DESC LIMIT 50').all()).results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,phase:s.phase,round:s.round,createdAt:s.createdAt,finishedAt:s.finishedAt,players:s.players.length,capacity:12,mine:!!s.players.find(p=>p.id===user?.id)};});}
export async function duelMatch(db,id,user,input=null,bridge=false,game=null,now=Date.now()){
 await ensureDuel(db);
 for(let n=0;n<32;n++){
  const row=await db.prepare('SELECT id,revision,state FROM duel_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe El Duelo.');
  const s=JSON.parse(row.state);s.id=id;advanceDuel(s,now);
  if(input)actDuel(s,user,input,now,bridge);
  if(game&&input?.action==='flash_start'&&!s.flashData)s.flashData=gameData(game,s.runs[user.id].duration);
  const payload=JSON.stringify(s);
  if(payload!==row.state){
   const writes=[db.prepare('UPDATE duel_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,id,row.revision)];
   for(const p of s.players.filter(p=>!p.bot))writes.push(db.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'DUEL',?,?,?,?,? WHERE EXISTS(SELECT 1 FROM duel_matches WHERE id=? AND state=?) ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at").bind(p.username,String(id),s.phase==='finished'?'finished':p.status==='eliminated'?'eliminated':'active',p.placement?'Puesto '+p.placement:null,new Date(p.joinedAt).toISOString(),p.eliminatedAt||s.finishedAt?new Date(p.eliminatedAt||s.finishedAt).toISOString():null,id,payload));
   const result=await db.batch(writes);if(!result[0].meta.changes)continue;
  }
  return {match:duelView(s,user,now),...(bridge?{attempt:s.runs[user.id],data:s.flashData}:{} )};
 }throw Error('Hay actividad simultánea. Reintenta.');
}
