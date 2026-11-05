import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureStaffSchema,isOwner} from '../_shared/staff.js';
import {ensurePasswordReset,temporaryPassword,hashPassword,TEMPORARY_PASSWORD_MS} from '../_shared/password-reset.js';
async function handle({request,env}){try{
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 const db=env.DB;await ensureStaffSchema(db);await ensurePasswordReset(db);
 const actor=await getSessionUser(request,db);if(!isOwner(actor))return jsonError('Esta acción está reservada a admin1.',403);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 const input=await request.json().catch(()=>null),name=String(input?.username||'').trim();
 const target=await db.prepare('SELECT id,username,is_system FROM users WHERE LOWER(username)=LOWER(?)').bind(name).first();if(!target)return jsonError('Usuario no encontrado.',404);
 if(target.is_system)return jsonError('La cuenta de avisos está protegida.',403);
 if(target.id===actor.id)return jsonError('No puedes restablecer tu propia contraseña.',400);
 const password=temporaryPassword(),until=new Date(Date.now()+TEMPORARY_PASSWORD_MS).toISOString();
 await db.batch([
  db.prepare('UPDATE users SET password_hash=?,must_change_password=1,temporary_password_until=? WHERE id=?').bind(await hashPassword(password),until,target.id),
  db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id),
  db.prepare("INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,reason) VALUES(?,?,'reset_password',?)").bind(actor.id,target.id,'Contraseña temporal generada; caduca en 24 horas.')
 ]);
 return Response.json({ok:true,username:target.username,temporaryPassword:password,message:'Contraseña temporal generada.'},{headers:{'Cache-Control':'no-store'}});
}catch(e){console.error('Password reset',e?.message);return jsonError('No se pudo restablecer la contraseña.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
