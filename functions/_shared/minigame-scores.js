export async function ensureMinigameTables(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS minigame_scores (user_id INTEGER NOT NULL, kind TEXT NOT NULL, best_score INTEGER NOT NULL DEFAULT 0, plays INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,kind))`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS minigame_attempts (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, kind TEXT NOT NULL, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)`).run();
}
const sharedReady=new WeakMap();
export async function ensureSharedScores(db){if(sharedReady.has(db))return sharedReady.get(db);const task=(async()=>{await ensureMinigameTables(db);await db.prepare('CREATE TABLE IF NOT EXISTS minigame_result_ledger(result_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,kind TEXT NOT NULL,score INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();await db.prepare(`CREATE TRIGGER IF NOT EXISTS minigame_result_apply AFTER INSERT ON minigame_result_ledger BEGIN INSERT INTO minigame_scores(user_id,kind,best_score,plays) VALUES(NEW.user_id,NEW.kind,NEW.score,1) ON CONFLICT(user_id,kind) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),plays=plays+1,updated_at=CASE WHEN excluded.best_score>best_score THEN CURRENT_TIMESTAMP ELSE updated_at END;END`).run();})();sharedReady.set(db,task);try{await task;}catch(e){sharedReady.delete(db);throw e;}}
export async function recordMinigameResult(db,userId,kind,score,resultKey){if(!['wheel','numbers','deal','match','guitar','endurance','maze','snow','words','line'].includes(kind)||!Number.isFinite(score)||score<0||score>1e9)throw Error('Resultado no válido para el ranking.');await ensureSharedScores(db);await db.prepare('INSERT OR IGNORE INTO minigame_result_ledger(result_key,user_id,kind,score) VALUES(?,?,?,?)').bind(resultKey,userId,kind,Math.round(score)).run();}
// Las pruebas de Frookies son privadas durante la partida: entran en el ranking al terminarla.
export function frookiesResultRows(s){
 const run=s.runId&&s.runId!=='initial'?':run:'+s.runId:'',rows=[],rounds=[...(s.history||[]),{round:s.round,challenge:s.challenge,scores:s.scores}];
 for(const {round,challenge,scores} of rounds)for(const p of s.players){
  const score=scores?.[p.username.toLowerCase()];
  if(!challenge||p.bot||!(p.id>0)||score?.simulated||!(score?.points>0))continue;
  rows.push({key:'frookies:'+s.id+run+':'+round+':'+p.id+':'+challenge,userId:p.id,kind:challenge,score:Math.round(score.points)});
 }
 return rows;
}
