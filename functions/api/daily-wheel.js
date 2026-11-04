import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureWheel,WHEEL_PRIZES,wheelDay,wheelReset} from '../_shared/daily-wheel116.js';
async function handle141_onRequest({request,env}){try{
 if(!['GET','POST'].includes(request.method))return jsonError('Método no permitido.',405);
 const db=env.DB;await ensureProfileSchema(db);const user=await getSessionUser(request,db);if(!user||user.is_system)return jsonError('Inicia sesión para jugar a la ruleta diaria.',401);
 await ensureWheel(db);const now=Date.now(),day=wheelDay(now);let previous=await db.prepare('SELECT segment,prize,created_at FROM daily_wheel_spins WHERE user_id=? AND day=?').bind(user.id,day).first(),alreadySpun=!!previous;
 if(request.method==='POST'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
  const data=await request.json().catch(()=>null);if(data?.action!=='spin')return jsonError('Acción no válida.',400);
  if(!previous){const segment=crypto.getRandomValues(new Uint32Array(1))[0]%WHEEL_PRIZES.length;const result=await db.prepare('INSERT OR IGNORE INTO daily_wheel_spins(user_id,day,segment,prize) VALUES(?,?,?,?)').bind(user.id,day,segment,WHEEL_PRIZES[segment]).run();alreadySpun=!result.meta.changes;previous=await db.prepare('SELECT segment,prize,created_at FROM daily_wheel_spins WHERE user_id=? AND day=?').bind(user.id,day).first();}
 }
 const account=await db.prepare('SELECT t_money FROM users WHERE id=?').bind(user.id).first();return Response.json({ok:true,day,timezone:'Europe/Madrid',next_reset:wheelReset(now),server_now:now,can_spin:!previous,spin:previous||null,already_spun:alreadySpun,balance:account.t_money,segments:WHEEL_PRIZES},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error('Daily wheel',e);return jsonError('No se pudo completar la tirada. Puedes reintentar sin perder tu premio.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
