import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensurePasswordReset,hashPassword} from '../_shared/password-reset.js';
// V346: cualquier usuario puede cambiar su contraseña escribiendo la actual.
// Si administración le dio una temporal (must_change_password), no hace falta la actual: la acaba de usar para entrar.
// Al cambiarla se cierran las demás sesiones de la cuenta; la de este navegador sigue abierta.
const tokenOf=request=>(request.headers.get('Cookie')||'').split(';').map(p=>p.trim()).find(p=>p.startsWith('session='))?.slice(8)||'';
async function handle({request,env}){try{
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 const db=env.DB;await ensurePasswordReset(db);const user=await getSessionUser(request,db);if(!user)return jsonError('Inicia sesión para continuar.',401);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 const account=await db.prepare('SELECT password_hash,must_change_password FROM users WHERE id=?').bind(user.id).first();
 const input=await request.json().catch(()=>null),current=String(input?.current||''),password=String(input?.password||''),confirm=String(input?.confirm||'');
 const pending=!!account?.must_change_password;
 if(!pending){if(!current)return jsonError('Escribe tu contraseña actual.',400);if(await hashPassword(current)!==account?.password_hash)return jsonError('La contraseña actual no es correcta.',400);}
 if(password.length<8)return jsonError('La contraseña debe tener al menos 8 caracteres.',400);
 if(password.length>200)return jsonError('La contraseña no puede superar 200 caracteres.',400);
 if(password!==confirm)return jsonError('Las dos contraseñas no coinciden.',400);
 const hash=await hashPassword(password);if(hash===account.password_hash)return jsonError(pending?'Elige una contraseña distinta de la temporal.':'La contraseña nueva debe ser distinta de la actual.',400);
 const keep=await hashPassword(tokenOf(request));
 await db.batch([
  db.prepare('UPDATE users SET password_hash=?,must_change_password=0,temporary_password_until=NULL WHERE id=?').bind(hash,user.id),
  db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(user.id,keep)
 ]);
 return Response.json({ok:true,message:'Contraseña actualizada. Se han cerrado las demás sesiones de tu cuenta.'},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error('Change password',e?.message);return jsonError('No se pudo cambiar la contraseña.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
