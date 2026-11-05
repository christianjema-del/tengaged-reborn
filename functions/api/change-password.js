import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensurePasswordReset,hashPassword} from '../_shared/password-reset.js';
async function handle({request,env}){try{
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 const db=env.DB;await ensurePasswordReset(db);const user=await getSessionUser(request,db);if(!user)return jsonError('Inicia sesión para continuar.',401);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 const account=await db.prepare('SELECT password_hash,must_change_password FROM users WHERE id=?').bind(user.id).first();
 if(!account?.must_change_password)return jsonError('Tu cuenta no tiene un cambio de contraseña pendiente.',403);
 const input=await request.json().catch(()=>null),password=String(input?.password||''),confirm=String(input?.confirm||'');
 if(password.length<8)return jsonError('La contraseña debe tener al menos 8 caracteres.',400);
 if(password!==confirm)return jsonError('Las dos contraseñas no coinciden.',400);
 const hash=await hashPassword(password);if(hash===account.password_hash)return jsonError('Elige una contraseña distinta de la temporal.',400);
 await db.prepare('UPDATE users SET password_hash=?,must_change_password=0,temporary_password_until=NULL WHERE id=?').bind(hash,user.id).run();
 return Response.json({ok:true,message:'Contraseña actualizada.'},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error('Change password',e?.message);return jsonError('No se pudo cambiar la contraseña.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
