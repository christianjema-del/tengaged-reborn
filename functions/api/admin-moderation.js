import {withStorageGuard} from '../_shared/storage-guard141.js';
import {expireModeration} from '../_shared/moderation.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {ensureStaffSchema,isOwner,isStaff,removableSanctions} from '../_shared/staff.js';
import {accountDetails} from '../_shared/user-ips.js';
import {shownPlayed336,activeGames336,ensurePlayedAdjust336,systemSender336,KICK_GAMES336} from '../_shared/admin-extra336.js';
import {checkNewName,existingTables,nameTaken,renameStatements,ensureUsernameChanges} from '../_shared/username-change296.js';
const RENAME_LOCKED=new Set(['admin1','mod','tengaged']);
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
  const played=await shownPlayed336(db,target),games=await activeGames336(db,target.username);
  return Response.json({ok:true,user:target,played,games,account:await accountDetails(db,target,{email:owner}),audit:owner?audit:audit.filter(e=>!['give_t_money','take_t_money','give_karma','take_karma'].includes(e.action)),capabilities:{owner,blockIp:owner,rename:owner&&!target.is_system&&!RENAME_LOCKED.has(String(target.username).toLowerCase()),logout:!protectedTarget&&target.id!==actor.id,moderate:!protectedTarget&&target.id!==actor.id,economy:owner&&!target.is_system,roles:owner&&!target.is_system&&!target.is_admin,removeBan:!protectedTarget&&remove.ban,removeNose:!protectedTarget&&remove.nose,maxHours:owner?8760:168,played:owner&&!target.is_system,kick:owner&&!target.is_system,warn:!protectedTarget&&target.id!==actor.id}},{headers:{'Cache-Control':'no-store'}});
 }
 if(target.is_system)return jsonError('La cuenta de avisos está protegida.',403);
 const action=String(input.action||''),reason=String(input.reason||'').trim();if(!reason||reason.length>180)return jsonError('Escribe un motivo de entre 1 y 180 caracteres.',400);
 const economy=['give_karma','take_karma','give_t_money','take_t_money'].includes(action),role=['make_moderator','remove_moderator'].includes(action);
 if((economy||role||['set_card','ban','rename','set_played','kick_game'].includes(action))&&!owner)return jsonError('Esta acción está reservada a admin1.',403);
 if(!owner&&protectedTarget)return jsonError('Los moderadores no pueden actuar sobre cuentas del equipo.',403);
 if(target.id===actor.id&&['suspend','red_nose','red_nose_suspend','logout','ban','make_moderator','remove_moderator'].includes(action))return jsonError('No puedes aplicar esta acción a tu propia cuenta.',400);
 if(role&&target.is_admin)return jsonError('El rol de administrador está protegido.',403);
 if(action==='rename'){
  if(target.is_test_bot||RENAME_LOCKED.has(String(target.username).toLowerCase()))return jsonError('Esta cuenta no puede cambiar de nombre.',403);
  const newName=checkNewName(input.newName);if(newName===target.username)return jsonError('Ese ya es su nombre de usuario.',400);
  await ensureUsernameChanges(db);const tables=await existingTables(db);if(await nameTaken(db,tables,target.id,target.username,newName))return jsonError('Ese nombre ya está en uso. Elige otro.',409);
  const list=renameStatements(db,tables,{userId:target.id,oldName:target.username,newName,price:0});
  list.push(db.prepare('INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND username=?)').bind(actor.id,target.id,'rename_user',null,target.username+' → '+newName+' · '+reason,target.id,newName));
  const r=await db.batch(list);if(!Number(r[0]?.meta?.changes))return jsonError('No se pudo cambiar el nombre. Actualiza la ficha y vuelve a intentarlo.',409);
  return Response.json({ok:true,message:'Nombre cambiado: '+target.username+' → '+newName+'.',username:newName},{headers:{'Cache-Control':'no-store'}});
 }
 const requestKey=input.requestId==null?crypto.randomUUID():String(input.requestId);if(!/^[A-Za-z0-9_-]{8,80}$/.test(requestKey))return jsonError('Identificador de operación no válido.',400);
 const fingerprint=JSON.stringify([actor.id,target.id,action,reason,input.amount??null,input.hours??null,input.color??null,input.played??null,input.message??null,input.game??null]);
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
 // V336: «Jugado» del perfil. Se guarda la diferencia con las partidas reales.
 else if(action==='set_played'){const value=Number(input.played);if(!Number.isSafeInteger(value)||value<0||value>100000)return jsonError('Indica un número de partidas entre 0 y 100.000.',400);await ensurePlayedAdjust336(db);const {real}=await shownPlayed336(db,target);amount=value;update('UPDATE users SET games_played_adjust336=? WHERE id=?',[value-real,target.id]);}
 // V336: aviso privado de moderación (lo pueden enviar admin1 y los moderadores).
 else if(action==='warn'){const text=String(input.message||'').trim();if(text.length<3||text.length>1000)return jsonError('El aviso debe tener entre 3 y 1000 caracteres.',400);const sender=await systemSender336(db);if(!sender)return jsonError('No existe la cuenta de avisos.',500);statements.push(db.prepare(`INSERT INTO private_messages(sender,recipient,subject,body,system_event) SELECT ?,?,?,?,? WHERE ${guard}`).bind(sender.id,target.id,'Aviso de moderación',text+'\n\nEste aviso lo envía el equipo de moderación de Tengaged y no admite respuesta.','moderation-warning:'+requestKey,...args));}
 // V336: la expulsión se hace en la propia partida; aquí queda anotada en el registro.
 else if(action==='kick_game'){const game=String(input.game||''),[type,id]=game.split(':');if(!Object.hasOwn(KICK_GAMES336,type)||!/^\d{1,9}$/.test(id||''))return jsonError('Partida no válida.',400);}
 else if(action==='clear_bio')update("UPDATE users SET bio='' WHERE id=?",[target.id]);
 else if(action==='set_card'){
  await ensureCommunitySchema(db);const card=await db.prepare("SELECT code FROM shop_items WHERE category='Tarjetas de color' AND theme_code=?").bind(String(input.color||'')).first();if(!card)return jsonError('Tarjeta no válida.',400);
  update("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT code FROM shop_items WHERE category='Tarjetas de color')",[target.id]);statements.push(db.prepare(`INSERT INTO user_inventory(user_id,item_code,is_equipped) SELECT ?,?,1 WHERE ${guard} ON CONFLICT(user_id,item_code) DO UPDATE SET is_equipped=1`).bind(target.id,card.code,...args));
 }else return jsonError('Acción no válida.',400);
 statements.push(db.prepare(`INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) SELECT ?,?,?,?,? WHERE ${guard}`).bind(actor.id,target.id,action,amount,action==='set_card'?reason+' · '+String(input.color):action==='kick_game'?reason+' · '+KICK_GAMES336[String(input.game).split(':')[0]]+' #'+String(input.game).split(':')[1]:action==='warn'?reason+' · '+String(input.message||'').trim().slice(0,120):reason,...args));
 await db.batch(statements);const saved=await db.prepare('SELECT actor_id,fingerprint FROM admin_operations WHERE request_key=?').bind(requestKey).first();if(saved?.actor_id!==actor.id||saved?.fingerprint!==fingerprint)return jsonError('Identificador utilizado para otra operación.',409);
 return Response.json({ok:true,message:'Acción guardada y registrada.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(/reservado|entre 3 y 24/.test(String(e.message)))return jsonError(e.message,400);if(/ADMIN_BALANCE_LIMIT/.test(String(e.message)))return jsonError('No puedes retirar más de lo disponible ni superar el límite de saldo.',409);console.error('Admin moderation',e);return jsonError('No se pudo completar la moderación.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
