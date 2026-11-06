import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureMinigameTables} from '../_shared/minigame-scores.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
const KINDS=['wheel','numbers','deal','match','guitar','endurance','maze','snow','words','line'];
async function unusedSetup(db){await db.prepare(`CREATE TABLE IF NOT EXISTS minigame_scores (user_id INTEGER NOT NULL, kind TEXT NOT NULL, best_score INTEGER NOT NULL DEFAULT 0, plays INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,kind))`).run();await db.prepare(`CREATE TABLE IF NOT EXISTS minigame_attempts (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, kind TEXT NOT NULL, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)`).run();}
async function handle141_onRequestGet({request,env}){try{const url=new URL(request.url),kind=url.searchParams.get('kind');if(!KINDS.includes(kind))return jsonError('Prueba no válida.',400);await ensureMinigameTables(env.DB);const user=await getSessionUser(request,env.DB);const result=await env.DB.prepare(`SELECT u.username,s.best_score AS score,s.plays,s.updated_at FROM minigame_scores s JOIN users u ON u.id=s.user_id WHERE s.kind=? ORDER BY s.best_score DESC,s.updated_at ASC LIMIT 10`).bind(kind).all();return Response.json({ok:true,leaders:result.results||[],me:user?.username||null});}catch(e){console.error(e);return jsonError('No se pudo cargar el ranking.',500);}}
async function handle141_onRequestPost({request,env}){try{const user=await getSessionUser(request,env.DB);if(!user)return jsonError('Inicia sesión para guardar puntuaciones.',401);await ensureMinigameTables(env.DB);const data=await request.json();const kind=String(data.kind||'');if(!KINDS.includes(kind))return jsonError('Prueba no válida.',400);
if(data.action==='start'){const token=crypto.randomUUID();await env.DB.prepare('INSERT INTO minigame_attempts(token,user_id,kind) VALUES(?,?,?)').bind(token,user.id,kind).run();return Response.json({ok:true,token});}
if(data.action!=='finish')return jsonError('Acción no válida.',400);
const score=Number(data.score),token=String(data.token||'');if(!Number.isInteger(score)||score<0||score>100||!/^[0-9a-f-]{36}$/i.test(token))return jsonError('Puntuación no válida.',400);
const attempt=await env.DB.prepare(`UPDATE minigame_attempts SET completed_at=CURRENT_TIMESTAMP WHERE token=? AND user_id=? AND kind=? AND completed_at IS NULL AND started_at>=datetime('now','-30 minutes') AND started_at<=datetime('now') RETURNING token`).bind(token,user.id,kind).first();if(!attempt)return jsonError('Intento vencido o ya registrado.',409);
await env.DB.prepare(`INSERT INTO minigame_scores(user_id,kind,best_score,plays) VALUES(?,?,?,1) ON CONFLICT(user_id,kind) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),plays=plays+1,updated_at=CASE WHEN excluded.best_score>best_score THEN CURRENT_TIMESTAMP ELSE updated_at END`).bind(user.id,kind,score).run();return Response.json({ok:true,score});
}catch(e){console.error(e);return jsonError('No se pudo guardar el resultado.',500);}}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}

export async function onRequestPost(context){return withStorageGuard(context,handle141_onRequestPost);}
