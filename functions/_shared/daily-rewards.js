import {ensureSystemAccount} from './system-account.js';
export const DAY_MS=86400000,DAILY_REWARDS=Object.freeze([15,30,55,85,120,160,210]);
const ready=new WeakMap();
export async function ensureDailyRewards(db){if(ready.has(db))return ready.get(db);const task=(async()=>{await ensureSystemAccount(db);await db.prepare('CREATE TABLE IF NOT EXISTS daily_reward_state(user_id INTEGER PRIMARY KEY,last_claim_at INTEGER,streak_days INTEGER NOT NULL DEFAULT 0,claim_count INTEGER NOT NULL DEFAULT 0)').run();await db.prepare('CREATE TABLE IF NOT EXISTS daily_reward_claims(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,claim_number INTEGER NOT NULL,day INTEGER NOT NULL,streak_days INTEGER NOT NULL,amount INTEGER NOT NULL,claimed_at INTEGER NOT NULL,UNIQUE(user_id,claim_number))').run();await db.prepare(`CREATE TRIGGER IF NOT EXISTS daily_reward_apply AFTER INSERT ON daily_reward_claims BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE username='Tengaged' COLLATE NOCASE AND is_system=1) THEN RAISE(ABORT,'DAILY_SYSTEM_ACCOUNT_MISSING') END;
 UPDATE users SET t_money=COALESCE(t_money,0)+NEW.amount WHERE id=NEW.user_id;
 UPDATE daily_reward_state SET last_claim_at=NEW.claimed_at,streak_days=NEW.streak_days,claim_count=NEW.claim_number WHERE user_id=NEW.user_id;
 INSERT INTO private_messages(sender,recipient,subject,body,system_event)
 SELECT sys.id,NEW.user_id,'Racha diaria · Día '||NEW.day||': +'||NEW.amount||' T$',
 'Hola, '||receiver.username||'.'||char(10)||char(10)||'Has recibido '||NEW.amount||' T$ por acceder a Tengaged en el día '||NEW.day||' de tu ciclo de premios diarios.'||char(10)||'El importe ya está abonado en tu saldo.'||char(10)||char(10)||
 'Premios del ciclo: 15, 30, 55, 85, 120, 160 y 210 T$.'||char(10)||
 CASE WHEN NEW.day=7 THEN '¡Has completado los siete días! Dentro de 24 horas podrás empezar otro ciclo desde 15 T$.' ELSE 'El próximo premio estará disponible dentro de 24 horas. Vuelve antes de que pasen 48 horas desde este abono para conservar la racha.' END||char(10)||char(10)||'Este es un aviso automático de Tengaged y no admite respuesta.',
 'daily-reward:'||NEW.id FROM users sys JOIN users receiver ON receiver.id=NEW.user_id WHERE sys.username='Tengaged' COLLATE NOCASE AND sys.is_system=1;
 END`).run();})();ready.set(db,task);try{await task;}catch(e){ready.delete(db);throw e;}}
export function nextReward(state,now){if(state?.last_claim_at==null)return {day:1,streak:1};const streak=now-state.last_claim_at>=2*DAY_MS?1:state.streak_days+1;return {day:(streak-1)%7+1,streak};}
export async function claimDailyReward(db,user,now=Date.now()){
 await ensureDailyRewards(db);const account=await db.prepare('SELECT id,is_system,is_test_bot,is_banned FROM users WHERE id=?').bind(user.id).first();if(!account||account.is_system||account.is_test_bot||account.is_banned)return {eligible:false,claimed:false};
 await db.prepare('INSERT OR IGNORE INTO daily_reward_state(user_id) VALUES(?)').bind(user.id).run();const prior=await db.prepare('SELECT * FROM daily_reward_state WHERE user_id=?').bind(user.id).first();let claimed=false,award=null;
 if(prior.last_claim_at==null||now-prior.last_claim_at>=DAY_MS){const next=nextReward(prior,now),id=crypto.randomUUID();const r=await db.prepare(`INSERT OR IGNORE INTO daily_reward_claims(id,user_id,claim_number,day,streak_days,amount,claimed_at) SELECT ?,?,?,?,?,?,? FROM daily_reward_state s JOIN users u ON u.id=s.user_id WHERE s.user_id=? AND s.claim_count=? AND (s.last_claim_at IS NULL OR s.last_claim_at<=?) AND COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND COALESCE(u.is_banned,0)=0`).bind(id,user.id,prior.claim_count+1,next.day,next.streak,DAILY_REWARDS[next.day-1],now,user.id,prior.claim_count,now-DAY_MS).run();claimed=!!r.meta.changes;if(claimed)award={day:next.day,amount:DAILY_REWARDS[next.day-1]};}
 const state=await db.prepare('SELECT * FROM daily_reward_state WHERE user_id=?').bind(user.id).first(),balance=await db.prepare('SELECT t_money FROM users WHERE id=?').bind(user.id).first();
 if(state.last_claim_at==null)return {eligible:false,claimed:false};
 return {eligible:true,claimed,award,day:(Math.max(1,state.streak_days)-1)%7+1,streakDays:state.streak_days,nextEligibleAt:state.last_claim_at+DAY_MS,resetAt:state.last_claim_at+2*DAY_MS,balance:Number(balance.t_money)||0,rewards:DAILY_REWARDS};
}
