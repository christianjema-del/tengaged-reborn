import {repairCastingEight227} from './casting-ranking227.js';
import {repairCastingSeven192} from './casting-ranking192.js';
import {hydrateApples188} from './casting-ranking188.js';
import {settleCasting186} from './elimination-prizes186.js';
import {requireStart172} from './manual-start172.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {recoverCompletedCastings166} from './casting-recovery166.js';
import {recoverCompletedCastings161} from './casting-recovery161.js';
import {gamePrize} from '../../prize-catalog.js';
import {ensureSocial} from './social.js';
import {syncCastingSocial} from './casting-social.js';
import {ensureCastingSchema} from './casting.js';
import {ensureGameHistorySchema} from './games.js';
import {fresh,advance,act,view,freshLegacy,PHASE_MS} from './casting-engine.js';
const schemas=new WeakMap();
async function legacy(db){const s=freshLegacy(1);let state=null,room=null,players=[];try{players=await db.prepare('SELECT p.username,p.joined_at,r.health,r.apples,r.keys FROM casting_players p LEFT JOIN casting_resources r ON r.casting_id=p.casting_id AND LOWER(r.username)=LOWER(p.username) WHERE p.casting_id=1 ORDER BY p.id').all();players=players.results;room=await db.prepare('SELECT status FROM casting_rooms WHERE casting_id=1').first();state=await db.prepare('SELECT * FROM game_state WHERE casting_id=1').first();}catch(e){if(!/no such (table|column)/i.test(String(e.message||e)))throw e;}
 if(players.length){const dates=players.map(p=>Date.parse(String(p.joined_at||'').replace(' ','T')+'Z')).filter(Number.isFinite);if(dates.length)s.createdAt=Math.min(...dates);}
 s.players=players.map(p=>({username:p.username,status:'active',health:Number(p.health??100),apples:Number(p.apples??3),keys:Number(p.keys??0),lastRest:0,placement:null}));
 if(room?.status==='started'&&s.players.length>=2){s.phase=['immunity','nominations','elimination'].includes(state?.phase)?state.phase:'immunity';s.deadline=Date.now()+PHASE_MS;
 try{const old=await db.prepare('SELECT username,status FROM game_players WHERE casting_id=1').all();for(const p of old.results){const imported=s.players.find(x=>x.username.toLowerCase()===p.username.toLowerCase());if(imported&&p.status==='eliminated'){imported.status='eliminated';imported.placement=s.players.length;}}
 const actions=await db.prepare('SELECT * FROM game_actions WHERE casting_id=1').all();for(const a of actions.results){if(a.action_type==='immunity'&&a.reaction_ms!=null)s.reactions[a.username.toLowerCase()]=a.reaction_ms;if(a.action_type==='vote')s.nominations[a.username.toLowerCase()]={target:a.vote_target,weight:a.vote_weight||1};}
 s.immune=state?.winner_username||null;
 if(s.phase==='elimination'){const counts={};for(const vote of Object.values(s.nominations))counts[vote.target]=(counts[vote.target]||0)+vote.weight;s.nominees=s.players.filter(p=>p.status==='active'&&p.username!==s.immune).sort((a,b)=>(counts[b.username]||0)-(counts[a.username]||0)).slice(0,2).map(p=>p.username);const ballots=await db.prepare('SELECT voter_username,target_username FROM game_elimination_votes WHERE casting_id=1').all();for(const b of ballots.results)s.ballots[b.voter_username.toLowerCase()]=b.target_username;}
 
 }catch(e){if(!/no such (table|column)/i.test(String(e.message||e)))throw e;}
 if(state?.status==='finished'&&s.players.filter(p=>p.status==='active').length>1){s.phase='immunity';s.round=2;s.reactions={};s.nominations={};s.ballots={};s.nominees=[];s.immune=null;}
 }else if(s.players.length>=2)s.startAt=Date.now()+300000;
 s.events=[{at:Date.now(),text:'Partida recuperada. El progreso previo se conserva; las fases tienen ahora un plazo.'}];return s;}
export async function ensure(db){if(schemas.has(db))return schemas.get(db);const setup=(async()=>{if(await schemaReady170(db,'casting-service-171'))return;await ensureCastingSchema(db);await ensureGameHistorySchema(db);
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_matches(id INTEGER PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery142(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,recovered_at INTEGER NOT NULL)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_results(match_id INTEGER NOT NULL,username TEXT NOT NULL,placement INTEGER,reward INTEGER NOT NULL,pending INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(match_id,username))').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery146(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery161(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery166(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)').run();
 try{await db.prepare('ALTER TABLE casting_results ADD COLUMN reward_money INTEGER').run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
 await db.prepare('CREATE TABLE IF NOT EXISTS user_stats(username TEXT PRIMARY KEY,games_played INTEGER DEFAULT 0,wins INTEGER DEFAULT 0,points INTEGER DEFAULT 0,created_at TEXT)').run();
 for(const col of ['games_played INTEGER DEFAULT 0','wins INTEGER DEFAULT 0','points INTEGER DEFAULT 0','created_at TEXT'])try{await db.prepare('ALTER TABLE user_stats ADD COLUMN '+col).run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
 await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS user_stats_username_unique ON user_stats(username)').run();
 if(!await db.prepare('SELECT id FROM casting_matches LIMIT 1').first()){const imported=await legacy(db);await db.prepare('INSERT OR IGNORE INTO casting_matches(id,revision,state) VALUES(1,0,?)').bind(JSON.stringify(imported)).run();}
await markSchema170(db,'casting-service-171'); })();schemas.set(db,setup);try{await setup;}catch(e){schemas.delete(db);throw e;}}
export async function waiting(db){await ensure(db);await db.prepare(`INSERT INTO casting_matches(id,revision,state) SELECT COALESCE(MAX(id),0)+1,0,json_set(?,'$.id',COALESCE(MAX(id),0)+1) FROM casting_matches HAVING NOT EXISTS(SELECT 1 FROM casting_matches WHERE json_extract(state,'$.phase')='waiting')`).bind(JSON.stringify(fresh())).run();}
async function persist(db,row,s){s.commitId=crypto.randomUUID();const payload=JSON.stringify(s),statements=[db.prepare('UPDATE casting_matches SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,row.id,row.revision)];
 if(s.healthRecovery142&&!JSON.parse(row.state).healthRecovery142)statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery142(match_id,previous_state,recovered_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.healthRecovery142.at,s.id,payload));
 for(const p of s.players.filter(p=>!p.bot&&!(s.id===7&&s.positionRecovery192&&['admin1','mod'].includes(p.username.toLowerCase()))&&Number.isInteger(p.placement)&&(s.phase==='finished'||p.status==='eliminated'))){const prize=gamePrize('casting_slow',p.placement),reward=prize.karma,win=p.placement===1?1:0;
 statements.push(db.prepare(`INSERT OR IGNORE INTO casting_results(match_id,username,placement,reward,reward_money) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)`).bind(s.id,p.username,p.placement,reward,prize.money,s.id,payload));
 const condition="EXISTS(SELECT 1 FROM casting_results WHERE match_id=? AND username=? AND pending=1) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=?,reward_money=? WHERE match_id=? AND username=? AND '+condition).bind(p.placement,reward,prize.money,s.id,p.username,s.id,p.username,s.id,payload));
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE LOWER(username)=LOWER(?) AND '+condition).bind(reward,prize.money,p.username,s.id,p.username,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_stats(username,games_played,wins,points,created_at) SELECT ?,1,?,?,CURRENT_TIMESTAMP WHERE ${condition} ON CONFLICT(username) DO UPDATE SET games_played=COALESCE(games_played,0)+1,wins=COALESCE(wins,0)+excluded.wins,points=COALESCE(points,0)+excluded.points`).bind(p.username,win,reward,s.id,p.username,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,?,?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),s.phase==='finished'?'finished':'eliminated',p.username===s.winner?'Ganador':'Puesto '+(p.placement||s.players.length),new Date(s.createdAt).toISOString(),s.finishedAt?new Date(s.finishedAt).toISOString():null,s.id,p.username,s.id,payload));
 statements.push(db.prepare(`UPDATE casting_results SET pending=0 WHERE match_id=? AND username=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)`).bind(s.id,p.username,s.id,payload));}
 if(s.phase==='finished')for(const p of s.players.filter(p=>!p.bot&&Number.isInteger(p.placement)))statements.push(db.prepare("UPDATE user_game_history SET status='finished',placement=?,finished_at=? WHERE game_type='CASTING' AND game_id=? AND lower(username)=lower(?) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)").bind(p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.finishedAt).toISOString(),String(s.id),p.username,s.id,payload));
 if(s.positionRecovery146&&!JSON.parse(row.state).positionRecovery146){
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery146(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery146 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot)){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dk=Math.max(0,prize.karma-old.reward),dm=Math.max(0,prize.money-oldMoney),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dm,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+?,wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=? WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,Math.max(oldMoney,prize.money),s.id,old.username,s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery146 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 } if(s.positionRecovery161&&!JSON.parse(row.state).positionRecovery161){
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery161(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery161 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot)){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old||old.pending!==0)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dk=Math.max(0,prize.karma-old.reward),dm=Math.max(0,prize.money-oldMoney),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dm,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+?,wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=? WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,Math.max(oldMoney,prize.money),s.id,old.username,s.id,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,'finished',?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status='finished',placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.createdAt).toISOString(),new Date(s.finishedAt).toISOString(),s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery161 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 } if(s.positionRecovery166&&!JSON.parse(row.state).positionRecovery166){
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery166(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery166 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot)){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old||old.pending!==0)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dk=Math.max(0,prize.karma-old.reward),dm=Math.max(0,prize.money-oldMoney),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dm,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+?,wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=? WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,Math.max(oldMoney,prize.money),s.id,old.username,s.id,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,'finished',?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status='finished',placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.createdAt).toISOString(),new Date(s.finishedAt).toISOString(),s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery166 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 }
 if(s.positionRecovery188&&!JSON.parse(row.state).positionRecovery188){
 statements.push(db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery188(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)'));
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery188(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery188 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot)){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old||old.pending!==0)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dk=Math.max(0,prize.karma-old.reward),dm=Math.max(0,prize.money-oldMoney),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+?,t_money=COALESCE(t_money,0)+? WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dm,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+?,wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(dk,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=? WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,Math.max(oldMoney,prize.money),s.id,old.username,s.id,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,'finished',?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status='finished',placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.createdAt).toISOString(),new Date(s.finishedAt).toISOString(),s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery188 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 } if(s.positionRecovery192&&!JSON.parse(row.state).positionRecovery192){
 statements.push(db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery192(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)'));
 statements.push(db.prepare('CREATE TABLE IF NOT EXISTS casting_reward_adjustments192(match_id INTEGER NOT NULL,username TEXT NOT NULL,previous_karma INTEGER NOT NULL,previous_money INTEGER NOT NULL,delta_karma INTEGER NOT NULL,delta_money INTEGER NOT NULL,placement INTEGER NOT NULL,PRIMARY KEY(match_id,username))'));
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery192(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery192 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot&&!['admin1','mod'].includes(p.username.toLowerCase()))){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old||old.pending!==0)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 // Read the actual receipt in the transaction: an independently running audit may have paid after oldRows was read.
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_reward_adjustments192(match_id,username,previous_karma,previous_money,delta_karma,delta_money,placement) SELECT r.match_id,r.username,r.reward,COALESCE(r.reward_money,?),MAX(0,?-r.reward),MAX(0,?-COALESCE(r.reward_money,?)),? FROM casting_results r WHERE r.match_id=? AND r.username=? AND r.pending=0 AND '+condition).bind(oldMoney,prize.karma,prize.money,oldMoney,p.placement,s.id,old.username,s.id,s.id,payload));
 const ledger="COALESCE((SELECT delta_karma FROM casting_reward_adjustments192 WHERE match_id=? AND username=?),0)",cash="COALESCE((SELECT delta_money FROM casting_reward_adjustments192 WHERE match_id=? AND username=?),0)";
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+'+ledger+',t_money=COALESCE(t_money,0)+'+cash+' WHERE LOWER(username)=LOWER(?) AND '+condition).bind(s.id,old.username,s.id,old.username,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+'+ledger+',wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(s.id,old.username,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=MAX(COALESCE(reward_money,?),?) WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,oldMoney,prize.money,s.id,old.username,s.id,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,'finished',?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status='finished',placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.createdAt).toISOString(),new Date(s.finishedAt).toISOString(),s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery192 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 } if(s.positionRecovery227&&!JSON.parse(row.state).positionRecovery227){
 statements.push(db.prepare('CREATE TABLE IF NOT EXISTS casting_recovery227(match_id INTEGER PRIMARY KEY,previous_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)'));
 statements.push(db.prepare('CREATE TABLE IF NOT EXISTS casting_reward_adjustments227(match_id INTEGER NOT NULL,username TEXT NOT NULL,previous_karma INTEGER NOT NULL,previous_money INTEGER NOT NULL,delta_karma INTEGER NOT NULL,delta_money INTEGER NOT NULL,placement INTEGER NOT NULL,PRIMARY KEY(match_id,username))'));
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_recovery227(match_id,previous_state) SELECT ?,? WHERE EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,row.state,s.id,payload));
 const oldRows=(await db.prepare('SELECT * FROM casting_results WHERE match_id=?').bind(s.id).all()).results;
 const modern=oldRows.some(x=>x.reward===40),oldWinner=JSON.parse(row.state).winner;
 const condition="EXISTS(SELECT 1 FROM casting_recovery227 WHERE match_id=? AND applied=0) AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)";
 for(const p of s.players.filter(p=>!p.bot&&!['admin1','mod'].includes(p.username.toLowerCase()))){const old=oldRows.find(r=>r.username.toLowerCase()===p.username.toLowerCase());if(!old||old.pending!==0)continue;const prize=gamePrize('casting_slow',p.placement),oldMoney=old.reward_money??(modern?gamePrize('casting_slow',old.placement).money:0),dw=Number(p.username===s.winner)-Number(p.username===oldWinner);
 // Read the actual receipt in the transaction: an independently running audit may have paid after oldRows was read.
 statements.push(db.prepare('INSERT OR IGNORE INTO casting_reward_adjustments227(match_id,username,previous_karma,previous_money,delta_karma,delta_money,placement) SELECT r.match_id,r.username,r.reward,COALESCE(r.reward_money,?),MAX(0,?-r.reward),MAX(0,?-COALESCE(r.reward_money,?)),? FROM casting_results r WHERE r.match_id=? AND r.username=? AND r.pending=0 AND '+condition).bind(oldMoney,prize.karma,prize.money,oldMoney,p.placement,s.id,old.username,s.id,s.id,payload));
 const ledger="COALESCE((SELECT delta_karma FROM casting_reward_adjustments227 WHERE match_id=? AND username=?),0)",cash="COALESCE((SELECT delta_money FROM casting_reward_adjustments227 WHERE match_id=? AND username=?),0)";
 statements.push(db.prepare('UPDATE users SET karma=COALESCE(karma,0)+'+ledger+',t_money=COALESCE(t_money,0)+'+cash+' WHERE LOWER(username)=LOWER(?) AND '+condition).bind(s.id,old.username,s.id,old.username,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE user_stats SET points=COALESCE(points,0)+'+ledger+',wins=MAX(0,COALESCE(wins,0)+?) WHERE LOWER(username)=LOWER(?) AND '+condition).bind(s.id,old.username,dw,p.username,s.id,s.id,payload));
 statements.push(db.prepare('UPDATE casting_results SET placement=?,reward=MAX(reward,?),reward_money=MAX(COALESCE(reward_money,?),?) WHERE match_id=? AND username=? AND '+condition).bind(p.placement,prize.karma,oldMoney,prize.money,s.id,old.username,s.id,s.id,payload));
 statements.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'CASTING',?,'finished',?,?,? WHERE ${condition} ON CONFLICT DO UPDATE SET status='finished',placement=excluded.placement,finished_at=excluded.finished_at`).bind(p.username,String(s.id),p.placement===1?'Ganador':'Puesto '+p.placement,new Date(s.createdAt).toISOString(),new Date(s.finishedAt).toISOString(),s.id,s.id,payload));
 }
 statements.push(db.prepare('UPDATE casting_recovery227 SET applied=1 WHERE match_id=? AND EXISTS(SELECT 1 FROM casting_matches WHERE id=? AND state=?)').bind(s.id,s.id,payload));
 }

 const result=await db.batch(statements);return !!result[0].meta.changes;}
// Un jugador solo puede estar en un Casting: hasta que lo expulsen o ese Casting termine.
async function otherCasting(db,id,username){return (await db.prepare("SELECT c.id FROM casting_matches c WHERE c.id<>? AND json_extract(c.state,'$.phase')<>'finished' AND EXISTS(SELECT 1 FROM json_each(c.state,'$.players') p WHERE lower(json_extract(p.value,'$.username'))=lower(?) AND json_extract(p.value,'$.status')='active') LIMIT 1").bind(id,username).first())?.id||null;}
export async function match(db,id,user,input=null,trustedFlash=false){await ensure(db);if(input?.action==='join'&&user){const other=await otherCasting(db,id,user.username);if(other)throw Error('Ya estás en el Casting #'+other+'. Podrás unirte a otro cuando te expulsen o termine.');}for(let retry=0;retry<6;retry++){const row=await db.prepare('SELECT id,revision,state FROM casting_matches WHERE id=?').bind(id).first();if(!row)throw Error('La partida no existe.');let state=JSON.parse(row.state);hydrateApples188(state);if(state.phase==='waiting'&&!(state.rulesVersion>=78)){const old=state;state=fresh(old.id,old.createdAt);state.players=old.players.map(p=>({...p,health:Math.min(100,p.health??70),checks:0,packages:[],lastCheckAt:null,tie:crypto.getRandomValues(new Uint32Array(1))[0],performanceTotal:0,performanceDays:0}));state.welcomes=old.welcomes||[];state.events=old.events||[];}if(state.rulesVersion>=78){await ensureSocial(db);await syncCastingSocial(db,state);}if(state.positionRecovery146&&!JSON.parse(row.state).positionRecovery146){if(!await persist(db,row,state))continue;continue;}
requireStart172(state);advance(state);if(state.id!==7||state.phase!=='finished'){if(!recoverCompletedCastings161(state))recoverCompletedCastings166(state);}if(input)act(state,user,input,Date.now(),trustedFlash);repairCastingSeven192(state);repairCastingEight227(state);settleCasting186(state);if(JSON.stringify(state)!==row.state&&!await persist(db,row,state))continue;const projected=view(state,user),own=user&&state.players.find(p=>p.username.toLowerCase()===user.username.toLowerCase());if(own?.prize){const receipt=await db.prepare('SELECT pending,reward,reward_money FROM casting_results WHERE match_id=? AND username=?').bind(state.id,own.username).first();projected.myPrize={...own.prize,placement:own.placement,paymentRecorded:receipt?.pending===0&&receipt.reward>=own.prize.karma&&receipt.reward_money>=own.prize.money};}return trustedFlash?{match:projected,attempt:state.flashAttempts?.[user.username.toLowerCase()]}:projected;}throw Error('Hay actividad simultánea. Vuelve a intentarlo.');}
export async function listing(db,user){await waiting(db);const rows=await db.prepare('SELECT id,state FROM casting_matches ORDER BY id DESC LIMIT 60').all();return rows.results.map(row=>{const s=JSON.parse(row.state);return {id:row.id,name:'Casting #'+row.id,phase:s.phase,round:s.round,players:s.players.length,capacity:s.capacity||20,mine:!!user&&s.players.some(p=>p.username.toLowerCase()===user.username.toLowerCase()),createdAt:s.createdAt,finishedAt:s.finishedAt,startAt:s.startAt,deadline:s.deadline,winner:s.winner};});}

export async function reconcilePrevious161(db){
 await ensure(db);
 const rows=await db.prepare("SELECT id FROM casting_matches WHERE json_extract(state,'$.phase')='finished' AND json_type(state,'$.positionRecovery166') IS NULL AND (id<>7 OR json_type(state,'$.positionRecovery192') IS NULL) ORDER BY id").all();
 for(const row of rows.results||[])await match(db,row.id,null);
}
