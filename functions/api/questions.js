import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,mutation,fail,ok,text,number,userByName,blocked} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 const {db,me,url}=await context(request,env.DB),target=await userByName(db,url.searchParams.get('user')||me?.username);if(!target)return fail('Usuario no encontrado.',404);
 const system=await db.prepare('SELECT is_system FROM users WHERE id=?').bind(target.id).first();if(system?.is_system)return fail('Tengaged es una cuenta de avisos y no responde preguntas.',403);
 if(request.method==='GET'){
 const questions=(await db.prepare(`SELECT q.id,q.question,q.answer,q.created_at,q.answered_at,u.username AS asker FROM profile_questions q JOIN users u ON u.id=q.asker
 WHERE q.target=? AND (q.answer IS NOT NULL OR q.target=? OR q.asker=?) AND u.is_banned=0 ORDER BY q.id DESC LIMIT 100`).bind(target.id,me?.id||-1,me?.id||-1).all()).results;
 return ok({target:target.username,is_owner:me?.id===target.id,questions});}
 if(request.method!=='POST')return fail('Método no permitido.',405);const denied=mutation(request,me);if(denied)return denied;const b=await request.json();
 if(b.action==='ask'){
  if(target.id===me.id)return fail('Elige el perfil de otro jugador.');if(await blocked(db,me.id,target.id))return fail('No puedes preguntar a este usuario.',403);
  const result=await db.prepare(`INSERT INTO profile_questions(asker,target,question) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM profile_questions WHERE asker=? AND created_at>=datetime('now','-10 seconds'))`).bind(me.id,target.id,text(b.question,3,500),me.id).run();if(!result.meta.changes)return fail('Espera diez segundos entre preguntas.',429);return ok({message:'Pregunta enviada. Se hará pública cuando la respondan.'});
 }
 if(target.id!==me.id)return fail('Solo el propietario puede responder o retirar preguntas.',403);
 const id=number(b.id);if(b.action==='answer'){
 const result=await db.prepare('UPDATE profile_questions SET answer=?,answered_at=CURRENT_TIMESTAMP WHERE id=? AND target=?').bind(text(b.answer,1,2000),id,me.id).run();if(!result.meta.changes)return fail('Pregunta no encontrada.',404);return ok({message:'Respuesta publicada.'});
 }
 if(b.action==='remove'){await db.prepare('DELETE FROM profile_questions WHERE id=? AND target=?').bind(id,me.id).run();return ok({message:'Pregunta retirada.'});}
 return fail('Acción no válida.');
 }catch(e){console.error('Questions',e);return fail(e.message||'No se pudieron cargar las preguntas.');}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
