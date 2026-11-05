import {gamePrize} from '../../prize-catalog.js';
import {COLOR_LEVELS,COLOR_LEVEL_BY_CODE} from '../../color-level-catalog.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensureProfileSchema} from './auth.js';
import {ensureGameHistorySchema} from './games.js';
import {blogVotePower} from './blog-vote-power.js';
import {freshRookies,advanceRookies,actRookies,rookiesView,setActivity,CAPACITY,BET_MULTIPLIERS,DAY_MS} from './rookies-engine.js';
const BET_DAYS=2,MINIMUM_COLOR=COLOR_LEVEL_BY_CODE.yellow.power;
// Cada tarjeta suma 2 T$ a lo que se puede apostar por partida: amarilla 2, naranja 4, verde claro 6...
export const betLimit=power=>2*Math.max(0,COLOR_LEVELS.findIndex(level=>level.power===power));
export async function ensureRookies(db){
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 if(await schemaReady170(db,'rookies249'))return;
 for(const sql of [
  'CREATE TABLE IF NOT EXISTS rookies_matches(id INTEGER PRIMARY KEY AUTOINCREMENT,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)',
  "CREATE UNIQUE INDEX IF NOT EXISTS rookies_one_waiting ON rookies_matches(json_extract(state,'$.phase')) WHERE json_extract(state,'$.phase')='waiting'",
  'CREATE TABLE IF NOT EXISTS rookies_results(match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,placement INTEGER NOT NULL,karma INTEGER NOT NULL,money INTEGER NOT NULL,pending INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(match_id,user_id))',
  'CREATE TABLE IF NOT EXISTS rookies_bets(id INTEGER PRIMARY KEY AUTOINCREMENT,match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,target_id INTEGER NOT NULL,amount INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  'CREATE INDEX IF NOT EXISTS rookies_bets_match ON rookies_bets(match_id,target_id)',
  'CREATE TABLE IF NOT EXISTS rookies_bet_payouts(match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,target_id INTEGER NOT NULL,amount INTEGER NOT NULL,payout REAL NOT NULL,pending INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(match_id,user_id,target_id))',
  "CREATE TRIGGER IF NOT EXISTS rookies_bet_balance BEFORE INSERT ON rookies_bets BEGIN SELECT CASE WHEN COALESCE((SELECT t_money FROM users WHERE id=NEW.user_id),0)<NEW.amount THEN RAISE(ABORT,'ROOKIES_BALANCE') END; END",
  'CREATE TRIGGER IF NOT EXISTS rookies_bet_charge AFTER INSERT ON rookies_bets BEGIN UPDATE users SET t_money=t_money-NEW.amount WHERE id=NEW.user_id; END',
  'CREATE TABLE IF NOT EXISTS user_stats(username TEXT PRIMARY KEY,games_played INTEGER DEFAULT 0,wins INTEGER DEFAULT 0,points INTEGER DEFAULT 0,created_at TEXT)'
 ])await db.prepare(sql).run();
 await markSchema170(db,'rookies249');
 if(!await schemaReady170(db,'rookies253')){await db.prepare('CREATE INDEX IF NOT EXISTS rookies_bets_user ON rookies_bets(user_id,match_id,target_id)').run();await markSchema170(db,'rookies253');}
}
export async function waitingRookies(db){await ensureRookies(db);await db.prepare("INSERT OR IGNORE INTO rookies_matches(state) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM rookies_matches WHERE json_extract(state,'$.phase')='waiting')").bind(JSON.stringify(freshRookies(0))).run();}
export async function rookiesListing(db,user){await waitingRookies(db);return (await db.prepare('SELECT id,state FROM rookies_matches ORDER BY id DESC LIMIT 50').all()).results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,phase:s.phase,round:s.day,createdAt:s.createdAt,finishedAt:s.finishedAt,players:s.players.length,capacity:CAPACITY,mine:!!s.players.find(p=>p.id===user?.id)};});}
function prizeWrites(db,s,id,payload){
 if(s.phase!=='finished')return [];
 const writes=[],same='EXISTS(SELECT 1 FROM rookies_matches WHERE id=? AND state=?)',pending='EXISTS(SELECT 1 FROM rookies_results WHERE match_id=? AND user_id=? AND pending=1) AND '+same;
 for(const p of s.players){
  if(p.bot||!(p.id>0)||!Number.isInteger(p.placement))continue;
  const prize=gamePrize('rookies_slow',p.placement);if(!prize.karma&&!prize.money)continue;
  writes.push(db.prepare('INSERT OR IGNORE INTO rookies_results(match_id,user_id,username,placement,karma,money) SELECT ?,?,?,?,?,? WHERE '+same).bind(id,p.id,p.username,p.placement,prize.karma,prize.money,id,payload));
  writes.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE id=? AND '+pending).bind(prize.karma,prize.money,p.id,id,p.id,id,payload));
  writes.push(db.prepare('INSERT INTO user_stats(username,games_played,wins,points,created_at) SELECT ?,0,?,?,CURRENT_TIMESTAMP WHERE '+pending+' ON CONFLICT(username) DO UPDATE SET wins=COALESCE(wins,0)+excluded.wins,points=COALESCE(points,0)+excluded.points').bind(p.username,p.placement===1?1:0,prize.karma,id,p.id,id,payload));
  writes.push(db.prepare('UPDATE rookies_results SET pending=0 WHERE match_id=? AND user_id=? AND '+same).bind(id,p.id,id,payload));
 }
 return writes;
}
async function betWrites(db,s,id,payload){
 if(s.phase!=='finished')return [];
 const rows=(await db.prepare('SELECT user_id,target_id,SUM(amount) AS amount FROM rookies_bets WHERE match_id=? GROUP BY user_id,target_id').bind(id).all()).results,writes=[],same='EXISTS(SELECT 1 FROM rookies_matches WHERE id=? AND state=?)';
 for(const b of rows){
  const place=s.players.find(p=>p.id===b.target_id)?.placement,payout=Math.round(Number(b.amount)*(BET_MULTIPLIERS[place-1]||0)*100)/100;
  writes.push(db.prepare('INSERT OR IGNORE INTO rookies_bet_payouts(match_id,user_id,target_id,amount,payout) SELECT ?,?,?,?,? WHERE '+same).bind(id,b.user_id,b.target_id,b.amount,payout,id,payload));
  writes.push(db.prepare('UPDATE users SET t_money=COALESCE(t_money,0)+? WHERE id=? AND EXISTS(SELECT 1 FROM rookies_bet_payouts WHERE match_id=? AND user_id=? AND target_id=? AND pending=1) AND '+same).bind(payout,b.user_id,id,b.user_id,b.target_id,id,payload));
  writes.push(db.prepare('UPDATE rookies_bet_payouts SET pending=0 WHERE match_id=? AND user_id=? AND target_id=? AND '+same).bind(id,b.user_id,b.target_id,id,payload));
 }
 return writes;
}
async function loadActivity(db,s,id){const rows=(await db.prepare('SELECT user_id,COUNT(*) AS n FROM game_chat WHERE room=? GROUP BY user_id').bind('rookies:'+id).all()).results;setActivity(s,Object.fromEntries(rows.map(r=>[r.user_id,r.n])));}
export async function rookiesMatch(db,id,user,input=null,now=Date.now()){
 await ensureRookies(db);
 for(let n=0;n<32;n++){
  const row=await db.prepare('SELECT id,revision,state FROM rookies_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe esa partida de Rookies.');
  const s=JSON.parse(row.state);s.id=id;
  // Los votos del chat solo hacen falta al cerrar un día: así no se consulta en cada carga.
  if(s.phase!=='waiting'&&s.phase!=='finished'&&now>=s.deadline)await loadActivity(db,s,id);
  advanceRookies(s,now);if(input)actRookies(s,user,input,now);
  const payload=JSON.stringify(s);
  if(payload!==row.state){
   const writes=[db.prepare('UPDATE rookies_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,id,row.revision)];
   for(const p of s.players.filter(p=>!p.bot))writes.push(db.prepare("INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'ROOKIES',?,?,?,?,? WHERE EXISTS(SELECT 1 FROM rookies_matches WHERE id=? AND state=?) ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at").bind(p.username,String(id),p.status,p.placement===1?'Ganador':p.placement?'Puesto '+p.placement:'',new Date(p.joinedAt).toISOString(),s.finishedAt?new Date(p.eliminatedAt||s.finishedAt).toISOString():null,id,payload));
   writes.push(...prizeWrites(db,s,id,payload),...await betWrites(db,s,id,payload));
   const result=await db.batch(writes);if(!result[0].meta.changes)continue;
  }
  return {match:rookiesView(s,user,now)};
 }
 throw Error('Hay mucha actividad en la partida. Vuelve a intentarlo.');
}
export async function rookiesBets(db,id,user){
 await ensureRookies(db);const row=await db.prepare('SELECT state FROM rookies_matches WHERE id=?').bind(id).first();if(!row)throw Error('No existe esa partida de Rookies.');const s=JSON.parse(row.state);
 const totals=(await db.prepare('SELECT target_id,username,SUM(amount) AS amount FROM rookies_bets WHERE match_id=? GROUP BY target_id,username ORDER BY amount DESC').bind(id).all()).results;
 const blocked=!user?'Inicia sesión para apostar.':s.players.some(p=>p.id===user.id)?'No puedes apostar en una partida en la que juegas.':null;
 const open=s.phase==='day'&&s.day<=BET_DAYS,color=user?await blogVotePower(db,user.id):1,limit=betLimit(color);
 const spent=user?Number((await db.prepare('SELECT COALESCE(SUM(amount),0) AS n FROM rookies_bets WHERE match_id=? AND user_id=?').bind(id,user.id).first())?.n||0):0;
 const reason=!open?'Las apuestas solo están abiertas durante el día 1 y el día 2.':blocked||(color<MINIMUM_COLOR?'Necesitas nivel de color amarillo o superior.':spent>=limit?'Ya has apostado todo lo que permite tu tarjeta en esta partida ('+limit+' T$).':null);
 return {id,phase:s.phase,day:s.day,open,canBet:!reason,reason,limit,spent,players:s.players.map(p=>({id:p.id,username:p.username,bot:!!p.bot,placement:p.placement,status:p.status,hoh:p.id===s.hoh,nominated:s.nominees.includes(p.id),total:totals.filter(t=>t.target_id===p.id).reduce((n,t)=>n+Number(t.amount),0),bets:totals.filter(t=>t.target_id===p.id).map(t=>({username:t.username,amount:Number(t.amount)}))}))};
}
export async function placeBet(db,id,user,target){
 const info=await rookiesBets(db,id,user);if(!info.canBet)throw Error(info.reason||'Ahora no puedes apostar.');
 const housemate=info.players.find(p=>p.id===Number(target));if(!housemate||housemate.status!=='active')throw Error('Concursante no válido.');
 // El tope va en la propia inserción para que varias pulsaciones a la vez no lo superen.
 try{const done=await db.prepare('INSERT INTO rookies_bets(match_id,user_id,username,target_id,amount) SELECT ?,?,?,?,1 WHERE (SELECT COALESCE(SUM(amount),0) FROM rookies_bets WHERE match_id=? AND user_id=?)<?').bind(id,user.id,user.username,housemate.id,id,user.id,info.limit).run();if(!done.meta.changes)throw Error('Ya has apostado todo lo que permite tu tarjeta en esta partida ('+info.limit+' T$).');}
 catch(e){if(String(e.message).includes('ROOKIES_BALANCE'))throw Error('No tienes T$ suficientes.');throw e;}
 return rookiesBets(db,id,user);
}
const PROFILE_BETS=8;
// Apuestas de un usuario para su perfil: una fila por concursante y partida.
export async function profileBets(db,userId,page=1,now=Date.now()){
 await ensureRookies(db);
 const count=Number((await db.prepare('SELECT COUNT(*) AS n FROM (SELECT 1 FROM rookies_bets WHERE user_id=? GROUP BY match_id,target_id)').bind(userId).first())?.n||0),pages=Math.max(1,Math.ceil(count/PROFILE_BETS)),current=Math.min(pages,Math.max(1,Math.floor(Number(page)||1)));
 // El estado guardado puede ir retrasado: un día 1 caducado sigue abierto si aún estaría en el día 2.
 const open=(await db.prepare("SELECT id FROM rookies_matches WHERE json_extract(state,'$.phase')='day' AND ((json_extract(state,'$.day')=1 AND json_extract(state,'$.deadline')+?>?) OR (json_extract(state,'$.day')=2 AND json_extract(state,'$.deadline')>?)) ORDER BY id LIMIT 20").bind(DAY_MS,now,now).all()).results.map(r=>r.id);
 const rows=(await db.prepare('SELECT match_id,target_id,SUM(amount) AS amount,MAX(id) AS last FROM rookies_bets WHERE user_id=? GROUP BY match_id,target_id ORDER BY last DESC LIMIT ? OFFSET ?').bind(userId,PROFILE_BETS,(current-1)*PROFILE_BETS).all()).results;
 const ids=[...new Set(rows.map(r=>r.match_id))],marks=ids.map(()=>'?').join(',');
 const states=new Map(ids.length?(await db.prepare('SELECT id,state FROM rookies_matches WHERE id IN ('+marks+')').bind(...ids).all()).results.map(r=>[r.id,JSON.parse(r.state)]):[]);
 const payouts=new Map(ids.length?(await db.prepare('SELECT match_id,target_id,payout FROM rookies_bet_payouts WHERE user_id=? AND match_id IN ('+marks+')').bind(userId,...ids).all()).results.map(r=>[r.match_id+':'+r.target_id,Number(r.payout)]):[]);
 const items=rows.map(r=>{const s=states.get(r.match_id),target=s?.players.find(p=>p.id===r.target_id),payout=payouts.get(r.match_id+':'+r.target_id)||0,finished=s?.phase==='finished';return {matchId:r.match_id,amount:Number(r.amount),target:target?.username||'—',bot:!!target?.bot,status:!finished?'playing':payout>0?'won':'lost',payout};});
 return {open,page:current,pages,items};
}
