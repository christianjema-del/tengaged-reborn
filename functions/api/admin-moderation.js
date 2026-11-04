import {withStorageGuard} from '../_shared/storage-guard141.js';
import {expireModeration} from '../_shared/moderation.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {ensureStaffSchema,isOwner,isStaff,removableSanctions} from '../_shared/staff.js';
async function handle141_onRequest({request,env}){try{
 const db=env.DB;await ensureStaffSchema(db);await expireModeration(db);const actor=await getSessionUser(request,db);if(!isStaff(actor))return jsonError('No tienes permisos de moderación.',403);
 const owner=isOwner(actor),url=new URL(request.url);if(!['GET','POST'].includes(request.method))return jsonError('Método no permitido.',405);if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);
 const input=request.method==='POST'?await request.json().catch(()=>null):null;if(request.method==='POST'&&!input)return jsonError('Solicitud no válida.',400);
 const name=String(input?.username||url.searchParams.get('username')||'').trim();const target=await db.prepare('SELECT id,username,is_admin,is_moderator,is_system,is_banned,ban_reason,ban_until,red_nose_until,red_nose_reason,karma,t_money FROM users WHERE LOWER(username)=LOWER(?)').bind(name).first();if(!target)return jsonError('Usuario no encontrado.',404);
 const protectedTarget=!!target.is_system||(!owner&&(target.is_admin||target.is_moderator||target.id===actor.id));
 const remove=await removableSanctions(db,actor,target);
 if(request.method==='GET'){
  const audit=(await db.prepare('SELECT l.id,l.actor_user_id,a.username AS actor,l.action,l.amount,l.reason,l.created_at FROM admin_audit_log l LEFT JOIN users a ON a.id=l.actor_user_id WHERE l.target_user_id=? ORDER BY l.id DESC LIMIT 50').bind(target.id).all()).results;
  if(!owner){target.t_money=null;}
  return Response.json({ok:true,user:target,audit:owner?audit:audit.filter(e=>!['give_t_money','take_t_money','give_karma','take_karma'].includes(e.action)),capabilities:{owner,moderate:!protectedTarget&&target.id!==actor.id,economy:owner&&!target.is_system,roles:owner&&!target.is_system&&!target.is_admin,removeBan:!protectedTarget&&remove.ban,removeNose:!protectedTarget&&remove.nose,maxHours:owner?8760:168}},{headers:{'Cache-Control':'no-store'}});
 }
 if(target.is_system)return jsonError('La cuenta de avisos está protegida.',403);
 const action=String(input.action||''),reason=String(input.reason||'').trim();if(!reason||reason.length>180)return jsonError('Escribe un motivo de entre 1 y 180 caracteres.',400);
 const economy=['give_karma','take_karma','give_t_money','take_t_money'].includes(action),role=['make_moderator','remove_moderator'].includes(action);
 if((economy||role||['set_card','logout','ban'].includes(action))&&!owner)return jsonError('Esta acción está reservada a admin1.',403);
 if(!owner&&protectedTarget)return jsonError('Los moderadores no pueden actuar sobre cuentas del equipo.',403);
 if(target.id===actor.id&&['suspend','red_nose','red_nose_suspend','logout','ban','make_moderator','remove_moderator'].includes(action))return jsonError('No puedes aplicar esta acción a tu propia cuenta.',400);
 if(role&&target.is_admin)return jsonError('El rol de administrador está protegido.',403);
 const requestKey=input.requestId==null?crypto.randomUUID():String(input.requestId);if(!/^[A-Za-z0-9_-]{8,80}$/.test(requestKey))return jsonError('Identificador de operación no válido.',400);
 const fingerprint=JSON.stringify([actor.id,target.id,action,reason,input.amount??null,input.hours??null,input.color??null]);
 const receipt=await db.prepare('SELECT actor_id,fingerprint FROM admin_operations WHERE request_key=?').bind(requestKey).first();if(receipt){if(receipt.actor_id!==actor.id||receipt.fingerprint!==fingerprint)return jsonError('Este identificador ya pertenece a otra operación.',409);return Response.json({ok:true,replayed:true,message:'La acción ya estaba guardada; no se ha repetido.'});}
 const token=crypto.randomUUID(),guard='EXISTS(SELECT 1 FROM admin_operations WHERE request_key=? AND run_token=?)',args=[requestKey,token];
 const statements=[db.prepare('INSERT OR IGNORE INTO admin_operations(request_key,actor_id,target_id,fingerprint,run_token) VALUES(?,?,?,?,?)').bind(requestKey,actor.id,target.id,fingerprint,token)];let amount=null;
 const update=(sql,values=[])=>statements.push(db.prepare(sql+' AND '+guard).bind(...values,...args));
 if(economy){const value=Number(input.amount);if(!Number.isSafeInteger(value)||value<1||value>1000000)return jsonError('La cantidad debe estar entre 1 y 1.000.000, sin decimales.',400);amount=action.startsWith('take_')?-value:value;const field=action.endsWith('karma')?'karma':'t_money';statements.push(db.prepare(`INSERT INTO admin_balance_changes(request_key,actor_id,target_id,field,delta) SELECT ?,?,?,?,? WHERE ${guard}`).bind(requestKey,actor.id,target.id,field,amount,...args));}
 else if(role)update('UPDATE users SET is_moderator=? WHERE id=?',[action==='make_moderator'?1:0,target.id]);
 else if(['suspend','red_nose','red_nose_suspend','ban'].includes(action)){
  if(!owner&&((target.is_banned&&!remove.ban)||(target.red_nose_until&&!remove.nose)))return jsonError('Solo admin1 o el responsable de esta sanción puede modificarla.',403);
  const hours=Number(input.hours);if(action!=='ban'&&(!Number.isInteger(hours)||hours<1||hours>(owner?8760:168)))return jsonError('Duración válida: de 1 a '+(owner?8760:168)+' horas.',400);amount=action==='ban'?null:hours;const until=action==='ban'?null:new Date(Date.now()+hours*3600000).toISOString();
  if(action!=='red_nose'){update('UPDATE users SET is_banned=1,ban_reason=?,banned_at=?,ban_until=? WHERE id=?',[reason,new Date().toISOString(),until,target.id]);update('DELETE FROM sessions WHERE user_id=?',[target.id]);}
  if(action!=='suspend'&&action!=='ban')update('UPDATE users SET red_nose_until=?,red_nose_reason=? WHERE id=?',[until,reason,target.id]);
 }
 else if(action==='remove_red_nose'){if(!remove.nose)return jsonError('Solo puedes retirar una sanción aplicada por ti.',403);update('UPDATE users SET red_nose_until=NULL,red_nose_reason=NULL WHERE id=?',[target.id]);}
 else if(action==='unsuspend'){if(!remove.ban)return jsonError('Solo puedes retirar una sanción aplicada por ti.',403);update('UPDATE users SET is_banned=0,ban_reason=NULL,banned_at=NULL,ban_until=NULL WHERE id=?',[target.id]);}
 else if(action==='logout')update('DELETE FROM sessions WHERE user_id=?',[target.id]);
 else if(action==='clear_bio')update("UPDATE users SET bio='' WHERE id=?",[target.id]);
 else if(action==='set_card'){
  await ensureCommunitySchema(db);const card=await db.prepare("SELECT code FROM shop_items WHERE category='Tarjetas de color' AND theme_code=?").bind(String(input.color||'')).first();if(!card)return jsonError('Tarjeta no válida.',400);
  update("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT code FROM shop_items WHERE category='Tarjetas de color')",[target.id]);statements.push(db.prepare(`INSERT INTO user_inventory(user_id,item_code,is_equipped) SELECT ?,?,1 WHERE ${guard} ON CONFLICT(user_id,item_code) DO UPDATE SET is_equipped=1`).bind(target.id,card.code,...args));
 }else return jsonError('Acción no válida.',400);
 statements.push(db.prepare(`INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) SELECT ?,?,?,?,? WHERE ${guard}`).bind(actor.id,target.id,action,amount,action==='set_card'?reason+' · '+String(input.color):reason,...args));
 await db.batch(statements);const saved=await db.prepare('SELECT actor_id,fingerprint FROM admin_operations WHERE request_key=?').bind(requestKey).first();if(saved?.actor_id!==actor.id||saved?.fingerprint!==fingerprint)return jsonError('Identificador utilizado para otra operación.',409);
 return Response.json({ok:true,message:'Acción guardada y registrada.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(/ADMIN_BALANCE_LIMIT/.test(String(e.message)))return jsonError('No puedes retirar más de lo disponible ni superar el límite de saldo.',409);console.error('Admin moderation',e);return jsonError('No se pudo completar la moderación.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
