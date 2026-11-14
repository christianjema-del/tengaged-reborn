import {gamePrize} from '../../prize-catalog.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
import {ensureGameHistorySchema} from './games.js';
import {freshSurvivor,advanceSurvivor,actSurvivor,survivorView,joinCarriedSurvivors,CAPACITY} from './survivor-engine.js';

export async function ensureSurvivor(db){
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 if(await schemaReady170(db,'survivor303'))return;
 for(const sql of [
  'CREATE TABLE IF NOT EXISTS survivor_matches(id INTEGER PRIMARY KEY AUTOINCREMENT,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)',
  "CREATE UNIQUE INDEX IF NOT EXISTS survivor_one_waiting ON survivor_matches(json_extract(state,'$.phase')) WHERE json_extract(state,'$.phase')='waiting'",
  // Salud con la que alguien fue expulsado: la siguiente partida empieza con ella.
  'CREATE TABLE IF NOT EXISTS survivor_health(user_id INTEGER PRIMARY KEY,food INTEGER NOT NULL,water INTEGER NOT NULL,match_id INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS survivor_results(match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,placement INTEGER NOT NULL,karma INTEGER NOT NULL,money INTEGER NOT NULL,pending INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(match_id,user_id))',
  'CREATE TABLE IF NOT EXISTS user_stats(username TEXT PRIMARY KEY,games_played INTEGER DEFAULT 0,wins INTEGER DEFAULT 0,points INTEGER DEFAULT 0,created_at TEXT)'
 ])await db.prepare(sql).run();
 await markSchema170(db,'survivor303');
}

// Siempre hay una partida en inscripción. Si la última terminó con supervivientes humanos, la nueva
// empieza con ellos sentados como tribu A.
export async function waitingSurvivor(db){
 await ensureSurvivor(db);
 const last=await db.prepare("SELECT id,state FROM survivor_matches WHERE json_extract(state,'$.phase')='finished' AND json_extract(state,'$.carry') IS NOT NULL AND json_extract(state,'$.nextId') IS NULL ORDER BY id DESC LIMIT 1").first();
 const carry=last?JSON.parse(last.state).carry:null;
 const waiting=await db.prepare("SELECT id,revision,state FROM survivor_matches WHERE json_extract(state,'$.phase')='waiting'").first();
 if(waiting){
  // V363: la partida de inscripción ya existe (se crea en cuanto empieza la anterior), así que los
  // supervivientes de una partida recién terminada se suman a ella en vez de perderse.
  if(carry){
   const s=JSON.parse(waiting.state);
   if(joinCarriedSurvivors(s,carry,Date.now())){
    const done=await db.prepare('UPDATE survivor_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(s),waiting.id,waiting.revision).run();
    if(done.meta.changes)await db.prepare("UPDATE survivor_matches SET state=json_set(state,'$.nextId',?),revision=revision+1 WHERE id=? AND json_extract(state,'$.nextId') IS NULL").bind(waiting.id,last.id).run();
   }
  }
  return;
 }
 const created=await db.prepare("INSERT OR IGNORE INTO survivor_matches(state) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM survivor_matches WHERE json_extract(state,'$.phase')='waiting') RETURNING id").bind(JSON.stringify(freshSurvivor(0,Date.now(),carry))).first();
 if(created?.id){
  await db.prepare("UPDATE survivor_matches SET state=json_set(state,'$.id',?) WHERE id=?").bind(created.id,created.id).run();
  if(last)await db.prepare("UPDATE survivor_matches SET state=json_set(state,'$.nextId',?),revision=revision+1 WHERE id=? AND json_extract(state,'$.nextId') IS NULL").bind(created.id,last.id).run();
 }
}
export async function survivorListing(db,user){
 await waitingSurvivor(db);
 return (await db.prepare('SELECT id,state FROM survivor_matches ORDER BY id DESC LIMIT 50').all()).results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,phase:s.phase,round:s.day,createdAt:s.createdAt,startedAt:s.startedAt,finishedAt:s.finishedAt,players:s.players.length,capacity:CAPACITY,mine:!!user&&s.players.some(p=>Number(p.id)===Number(user.id))};});
}
function prizeWrites(db,s,id,payload){
 if(s.phase!=='finished')return [];
 const writes=[],same='EXISTS(SELECT 1 FROM survivor_matches WHERE id=? AND state=?)',pending='EXISTS(SELECT 1 FROM survivor_results WHERE match_id=? AND user_id=? AND pending=1) AND '+same;
 for(const p of s.players){
  if(p.bot||!(p.id>0)||p.placement!==1)continue;
  const prize=gamePrize('survivor',1);
  writes.push(db.prepare('INSERT OR IGNORE INTO survivor_results(match_id,user_id,username,placement,karma,money) SELECT ?,?,?,?,?,? WHERE '+same).bind(id,p.id,p.username,1,prize.karma,prize.money,id,payload));
  writes.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE id=? AND '+pending).bind(prize.karma,prize.money,p.id,id,p.id,id,payload));
  writes.push(db.prepare('INSERT INTO user_stats(username,games_played,wins,points,created_at) SELECT ?,1,1,?,CURRENT_TIMESTAMP WHERE '+pending+' ON CONFLICT(username) DO UPDATE SET games_played=COALESCE(games_played,0)+1,wins=COALESCE(wins,0)+1,points=COALESCE(points,0)+excluded.points').bind(p.username,prize.karma,id,p.id,id,payload));
  writes.push(db.prepare('UPDATE survivor_results SET pending=0 WHERE match_id=? AND user_id=? AND '+same).bind(id,p.id,id,payload));
 }
 return writes;
}
const iso=v=>v?new Date(v).toISOString():null;
export async function survivorMatch(db,id,user,input=null,trusted=false,viewTribe=null,now=Date.now()){
 await ensureSurvivor(db);
 for(let n=0;n<32;n++){
  const row=await db.prepare('SELECT id,revision,state FROM survivor_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe esa partida de Survivor.');
  const s=JSON.parse(row.state);s.id=id;
  advanceSurvivor(s,now);
  let result=null;
  if(input){
   let act=input;
   if(input.action==='join'&&user){const h=await db.prepare('SELECT food,water FROM survivor_health WHERE user_id=?').bind(user.id).first();act={...input,health:h?{food:h.food,water:h.water}:null};}
   result=actSurvivor(s,user,act,now,trusted||input.action==='join');
  }
  const payload=JSON.stringify(s);
  if(payload!==row.state){
   const same='EXISTS(SELECT 1 FROM survivor_matches WHERE id=? AND state=?)';
   const writes=[db.prepare('UPDATE survivor_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,id,row.revision)];
   for(const p of s.players.filter(p=>!p.bot&&p.id>0)){
    const status=p.status==='merged'?'finished':p.status==='eliminated'?'eliminated':'active';
    writes.push(db.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'SURVIVOR',?,?,?,?,? WHERE "+same+" ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at").bind(p.username,String(id),status,p.placement===1?'Unificación':p.placement?'Puesto '+p.placement:'',iso(p.joinedAt),iso(p.eliminatedAt||p.mergedAt),id,payload));
    if(p.status==='eliminated'&&p.final)writes.push(db.prepare('INSERT INTO survivor_health(user_id,food,water,match_id) SELECT ?,?,?,? WHERE '+same+' ON CONFLICT(user_id) DO UPDATE SET food=excluded.food,water=excluded.water,match_id=excluded.match_id,updated_at=CURRENT_TIMESTAMP WHERE excluded.match_id>=survivor_health.match_id').bind(p.id,p.final.food,p.final.water,id,id,payload));
   }
   writes.push(...prizeWrites(db,s,id,payload));
   const done=await db.batch(writes);if(!done[0].meta.changes)continue;
   if(s.phase==='finished'&&JSON.parse(row.state).phase!=='finished')await waitingSurvivor(db);
  }
  const view=survivorView(s,user,now,viewTribe);
  return trusted?{match:view,attempt:result?.attempt||null}:{match:view,result};
 }
 throw Error('Hay mucha actividad en la partida. Vuelve a intentarlo.');
}
