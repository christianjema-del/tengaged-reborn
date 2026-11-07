import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureSystemAccount} from '../_shared/system-account.js';
import {context,mutation,fail,ok,text,number,userByName,blocked} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 const {db,me,url}=await context(request,env.DB);await ensureSystemAccount(db);if(!me)return fail('Inicia sesión para abrir tu correo.',401);
 if(request.method==='GET'){
  const peer=url.searchParams.get('with'),folder=url.searchParams.get('folder')==='sent'?'sent':'inbox';
  const page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get('page'))||1)));
  let other=null;if(peer){other=await userByName(db,peer);if(!other)return fail('Usuario no encontrado.',404);}
  const where=other?'((m.sender=? AND m.recipient=?) OR (m.sender=? AND m.recipient=?))':folder==='sent'?'m.sender=?':'m.recipient=?';
  const args=other?[me.id,other.id,other.id,me.id]:[me.id];
  const total=Number((await db.prepare('SELECT COUNT(*) AS n FROM private_messages m WHERE '+where).bind(...args).first()).n);
  const messages=(await db.prepare(`SELECT m.id,m.subject,m.body,m.read_at,m.created_at,m.system_event,s.username AS sender,s.is_system AS system_sender,r.username AS recipient
   FROM private_messages m JOIN users s ON s.id=m.sender JOIN users r ON r.id=m.recipient WHERE ${where} ORDER BY m.id DESC LIMIT 20 OFFSET ?`).bind(...args,(page-1)*20).all()).results;
  const unread=Number((await db.prepare('SELECT COUNT(*) AS n FROM private_messages WHERE recipient=? AND read_at IS NULL').bind(me.id).first()).n);
  const blocks=(await db.prepare('SELECT u.username FROM user_blocks b JOIN users u ON u.id=b.blocked WHERE b.blocker=?').bind(me.id).all()).results;
  const peer_system=other?!!(await db.prepare('SELECT is_system FROM users WHERE id=?').bind(other.id).first())?.is_system:false;
  return ok({messages,total,page,unread,blocks,peer:other?.username,peer_system,blocked:other?await blocked(db,me.id,other.id):false});
 }
 if(request.method!=='POST')return fail('Método no permitido.',405);const denied=mutation(request,me);if(denied)return denied;
 const b=await request.json();
 if(b.action==='read_all'){
  const r=await db.prepare('UPDATE private_messages SET read_at=CURRENT_TIMESTAMP WHERE recipient=? AND read_at IS NULL').bind(me.id).run();const marked=Number(r.meta?.changes)||0;
  return ok({unread:0,marked,message:marked?(marked===1?'1 correo marcado como leído.':marked+' correos marcados como leídos.'):'No tenías correos sin leer.'});
 }
 if(b.action==='read'){
  const id=number(b.id),message=await db.prepare('SELECT id FROM private_messages WHERE id=? AND recipient=?').bind(id,me.id).first();if(!message)return fail('Correo no encontrado.',404);await db.prepare('UPDATE private_messages SET read_at=CURRENT_TIMESTAMP WHERE id=? AND recipient=? AND read_at IS NULL').bind(id,me.id).run();const count=await db.prepare('SELECT COUNT(*) AS n FROM private_messages WHERE recipient=? AND read_at IS NULL').bind(me.id).first();return ok({unread:Number(count.n)||0});
 }
 const target=await userByName(db,b.recipient);if(!target)return fail('No existe ese destinatario.',404);if(target.id===me.id)return fail('Elige otro usuario.');
 const isSystem=await db.prepare('SELECT is_system FROM users WHERE id=?').bind(target.id).first();if(isSystem?.is_system)return fail('Tengaged solo envía avisos automáticos y no recibe mensajes ni bloqueos.',403);
 if(b.action==='block'||b.action==='unblock'){
  if(b.action==='block')await db.prepare('INSERT OR IGNORE INTO user_blocks(blocker,blocked) VALUES(?,?)').bind(me.id,target.id).run();
  else await db.prepare('DELETE FROM user_blocks WHERE blocker=? AND blocked=?').bind(me.id,target.id).run();
  return ok({message:b.action==='block'?'Usuario bloqueado.':'Usuario desbloqueado.'});
 }
 if(b.action!=='send')return fail('Acción no válida.');if(await blocked(db,me.id,target.id))return fail('No puedes enviar mensajes a este usuario.',403);
 const subject=text(b.subject||'Sin asunto',1,100),body=text(b.body,1,4000);
 const result=await db.prepare(`INSERT INTO private_messages(sender,recipient,subject,body) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM private_messages WHERE sender=? AND created_at>=datetime('now','-5 seconds'))`).bind(me.id,target.id,subject,body,me.id).run();
 if(!result.meta.changes)return fail('Espera cinco segundos antes de enviar otro mensaje.',429);
 return ok({message:'Mensaje enviado.'});
 }catch(e){console.error('Mail',e);return fail(e.message||'No se pudo abrir el correo.');}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
