// V336: funciones nuevas del panel de administración (admin1) y de moderación.
import {playedCount148} from './played-count148.js';
import {ensureSystemAccount,SYSTEM_NAME} from './system-account.js';
export const KICK_GAMES336={CASTING:'Casting',HUNGER:'Hunger Games',ROOKIES:'Rookies',DUEL:'El Duelo'};
const ready=new WeakMap();
export async function ensurePlayedAdjust336(db){
 if(!ready.has(db))ready.set(db,db.prepare('ALTER TABLE users ADD COLUMN games_played_adjust336 INTEGER NOT NULL DEFAULT 0').run().catch(e=>{if(!/duplicate column/i.test(String(e?.message||e))){ready.delete(db);throw e;}}));
 return ready.get(db);
}
export async function playedAdjust336(db,userId){await ensurePlayedAdjust336(db);return Number((await db.prepare('SELECT games_played_adjust336 AS n FROM users WHERE id=?').bind(userId).first())?.n)||0;}
// «Jugado» del perfil: las partidas reales más el ajuste de admin1 (nunca menos de 0).
export async function shownPlayed336(db,user){const real=await playedCount148(db,user.username),adjust=await playedAdjust336(db,user.id);return {real,adjust,shown:Math.max(0,real+adjust)};}
export async function activeGames336(db,username){
 try{return (await db.prepare("SELECT upper(game_type) AS game_type,CAST(game_id AS TEXT) AS game_id,joined_at FROM user_game_history WHERE lower(username)=lower(?) AND status='active' ORDER BY joined_at DESC LIMIT 20").bind(username).all()).results.map(g=>({...g,kickable:Object.hasOwn(KICK_GAMES336,g.game_type),name:(KICK_GAMES336[g.game_type]||g.game_type)}));}
 catch{return [];}
}
export async function systemSender336(db){await ensureSystemAccount(db);return db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE AND is_system=1').bind(SYSTEM_NAME).first();}
