// V356: Race. Guarda la partida, registra el historial de los jugadores y paga los premios por puesto de pareja
// (los dos miembros cobran el premio de su pareja). La clave de race_results y «pending» impiden pagar dos veces.
import {gamePrize} from '../../prize-catalog.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
import {ensureGameHistorySchema} from './games.js';
import {freshRace,advanceRace,actRace,raceView,raceChallenge,RACE_CAPACITY} from './race356.js';
import {ensureSharedScores} from './minigame-scores.js';
import {gameData} from './flash-data.js';
function racePrizeWrites(db,s,id,payload){
 if(s.phase!=='finished')return [];
 const writes=[],same='EXISTS(SELECT 1 FROM race_matches WHERE id=? AND state=?)',pending='EXISTS(SELECT 1 FROM race_results WHERE match_id=? AND user_id=? AND pending=1) AND '+same;
 for(const p of s.players){
  if(p.bot||!(p.id>0)||!Number.isInteger(p.placement))continue;
  const prize=gamePrize('race',p.placement);if(!prize.karma&&!prize.money)continue;
  writes.push(db.prepare('INSERT OR IGNORE INTO race_results(match_id,user_id,username,placement,karma,money) SELECT ?,?,?,?,?,? WHERE '+same).bind(id,p.id,p.username,p.placement,prize.karma,prize.money,id,payload));
  writes.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE id=? AND '+pending).bind(prize.karma,prize.money,p.id,id,p.id,id,payload));
  writes.push(db.prepare('INSERT INTO user_stats(username,games_played,wins,points,created_at) SELECT ?,0,?,?,CURRENT_TIMESTAMP WHERE '+pending+' ON CONFLICT(username) DO UPDATE SET wins=COALESCE(wins,0)+excluded.wins,points=COALESCE(points,0)+excluded.points').bind(p.username,p.placement===1?1:0,prize.karma,id,p.id,id,payload));
  writes.push(db.prepare('UPDATE race_results SET pending=0 WHERE match_id=? AND user_id=? AND '+same).bind(id,p.id,id,payload));
 }
 return writes;
}
export async function ensureRace(db){
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 if(!await schemaReady170(db,'race356')){
  await db.prepare('CREATE TABLE IF NOT EXISTS race_matches(id INTEGER PRIMARY KEY AUTOINCREMENT,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS race_results(match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,placement INTEGER NOT NULL,karma INTEGER NOT NULL,money INTEGER NOT NULL,pending INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(match_id,user_id))').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS user_stats(username TEXT PRIMARY KEY,games_played INTEGER DEFAULT 0,wins INTEGER DEFAULT 0,points INTEGER DEFAULT 0,created_at TEXT)').run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS race_one_waiting356 ON race_matches(json_extract(state,'$.phase')) WHERE json_extract(state,'$.phase')='waiting'").run();
  await markSchema170(db,'race356');
 }
}
export async function waitingRace(db){
 await ensureRace(db);
 await db.prepare("INSERT OR IGNORE INTO race_matches(state) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM race_matches WHERE json_extract(state,'$.phase')='waiting')").bind(JSON.stringify(freshRace(0))).run();
}
export async function raceListing(db,user){await waitingRace(db);return (await db.prepare('SELECT id,state FROM race_matches ORDER BY id DESC LIMIT 50').all()).results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,phase:s.phase,round:s.leg,leg:s.leg,createdAt:s.createdAt,finishedAt:s.finishedAt,players:s.players.length,capacity:RACE_CAPACITY,mine:!!s.players.find(p=>p.id===user?.id)};});}
export async function raceMatch(db,id,user,input=null,bridge=false,game=null,now=Date.now()){
 await ensureRace(db);
 for(let n=0;n<32;n++){
  const row=await db.prepare('SELECT id,revision,state FROM race_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe esa partida de Race.');
  const s=JSON.parse(row.state);s.id=id;advanceRace(s,now);
  if(input)actRace(s,user,input,now,bridge);
  if(game&&input?.action==='flash_start'&&!s.flashData)s.flashData=gameData(game,s.runs[user.id].duration);
  const payload=JSON.stringify(s);
  if(payload!==row.state){
   const writes=[db.prepare('UPDATE race_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,id,row.revision)];
   // Las puntuaciones pasan al ranking de minijuegos al cerrar cada etapa.
   const closed=s.history.slice(JSON.parse(row.state).history?.length||0).flatMap(h=>h.results.flatMap(r=>r.members.filter(m=>m.id>0&&m.score>0).map(m=>({stage:h.stage,...m}))));
   if(closed.length)await ensureSharedScores(db);
   for(const x of closed){const kind=raceChallenge(id,x.stage);writes.push(db.prepare('INSERT OR IGNORE INTO minigame_result_ledger(result_key,user_id,kind,score) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM race_matches WHERE id=? AND state=?)').bind('race:'+id+':'+x.stage+':'+x.id+':'+kind,x.id,kind,Math.round(x.score),id,payload));}
   for(const p of s.players.filter(p=>!p.bot))writes.push(db.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'RACE',?,?,?,?,? WHERE EXISTS(SELECT 1 FROM race_matches WHERE id=? AND state=?) ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at").bind(p.username,String(id),s.phase==='finished'?'finished':p.status==='eliminated'?'eliminated':'active',p.placement?'Puesto '+p.placement:null,new Date(p.joinedAt).toISOString(),p.eliminatedAt||s.finishedAt?new Date(p.eliminatedAt||s.finishedAt).toISOString():null,id,payload));
   writes.push(...racePrizeWrites(db,s,id,payload));
   const result=await db.batch(writes);if(!result[0].meta.changes)continue;
  }
  return {match:raceView(s,user,now),...(bridge?{attempt:s.runs[user.id],data:s.flashData}:{})};
 }throw Error('Hay actividad simultánea. Reintenta.');
}
