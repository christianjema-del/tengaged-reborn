import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,mutation,fail,ok,text,number} from '../_shared/community-plus.js';
import {decodeDesignImage} from '../_shared/design-images.js';
async function handle141_onRequest({request,env}){try{
 const {db,me,url}=await context(request,env.DB),id=Number(url.searchParams.get('id'))||0;
 if(request.method==='GET'&&!id){
 const q=(url.searchParams.get('q')||'').trim().slice(0,80),mine=url.searchParams.get('tab')==='mine';
 const groups=(await db.prepare(`SELECT g.id,g.name,g.description,g.admission,g.created_at,u.username AS owner,
 (SELECT COUNT(*) FROM group_members WHERE group_id=g.id AND status='accepted') AS members,
 (SELECT status FROM group_members WHERE group_id=g.id AND user_id=?) AS membership
 FROM community_groups g JOIN users u ON u.id=g.owner_id WHERE u.is_banned=0 AND (?='' OR instr(lower(g.name),lower(?))>0)
 AND (?=0 OR EXISTS(SELECT 1 FROM group_members m WHERE m.group_id=g.id AND m.user_id=?)) ORDER BY g.id DESC LIMIT 100`).bind(me?.id||-1,q,q,mine?1:0,me?.id||-1).all()).results;
 return ok({groups,signed_in:!!me});}
 if(request.method==='POST'){
 const denied=mutation(request,me);if(denied)return denied;const b=await request.json();
 if(b.action==='create'){
 const name=text(b.name,3,60),description=text(b.description,1,2000),admission=b.admission==='private'?'private':'open';
 if(Number((await db.prepare('SELECT COUNT(*) AS n FROM community_groups WHERE owner_id=?').bind(me.id).first()).n)>=5)return fail('Puedes administrar hasta cinco grupos.');
 const result=await db.prepare('INSERT INTO community_groups(owner_id,name,description,admission) VALUES(?,?,?,?)').bind(me.id,name,description,admission).run();
 const gid=result.meta.last_row_id;await db.prepare("INSERT INTO group_members(group_id,user_id,status) VALUES(?,?,'accepted')").bind(gid,me.id).run();return ok({id:gid,message:'Grupo creado.'});
 }
 // Carry the parsed body into the common group mutation path.
 return await mutate(db,me,id,b);
 }
 if(request.method!=='GET')return fail('Método no permitido.',405);
 const group=await db.prepare('SELECT g.*,u.username AS owner FROM community_groups g JOIN users u ON u.id=g.owner_id WHERE g.id=?').bind(id).first();if(!group)return fail('Grupo no encontrado.',404);
 const member=me?await db.prepare('SELECT status FROM group_members WHERE group_id=? AND user_id=?').bind(id,me.id).first():null;
 const owner=me?.id===group.owner_id,canRead=group.admission==='open'||owner||member?.status==='accepted';
 const members=canRead?(await db.prepare(`SELECT m.user_id,u.username,m.status FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND u.is_banned=0 AND (m.status='accepted' OR ?=1) ORDER BY m.created_at,u.username`).bind(id,owner?1:0).all()).results:[];
 if(!canRead)return ok({group,membership:member?.status||null,is_owner:false,can_read:false,members:[],topics:[],polls:[],images:[]});
 const topics=(await db.prepare(`SELECT t.*,u.username AS author,(SELECT COUNT(*) FROM group_replies r WHERE r.topic_id=t.id) AS replies FROM group_topics t JOIN users u ON u.id=t.user_id WHERE t.group_id=? ORDER BY t.id DESC LIMIT 100`).bind(id).all()).results;
 const topic=Number(url.searchParams.get('topic'))||0;
 const replies=topic?(await db.prepare(`SELECT r.id,r.body,r.created_at,u.username AS author FROM group_replies r JOIN group_topics t ON t.id=r.topic_id JOIN users u ON u.id=r.user_id WHERE r.topic_id=? AND t.group_id=? ORDER BY r.id LIMIT 200`).bind(topic,id).all()).results:[];
 const polls=(await db.prepare(`SELECT p.*, (SELECT choice FROM group_votes v WHERE v.poll_id=p.id AND v.user_id=?) AS mine FROM group_polls p WHERE p.group_id=? ORDER BY p.id DESC LIMIT 50`).bind(me?.id||-1,id).all()).results;
 for(const poll of polls){poll.options=JSON.parse(poll.options);poll.votes=(await db.prepare('SELECT choice,COUNT(*) AS n FROM group_votes WHERE poll_id=? GROUP BY choice').bind(poll.id).all()).results;}
 const images=(await db.prepare('SELECT id,title,image_data FROM group_images WHERE group_id=? ORDER BY id DESC LIMIT 30').bind(id).all()).results;
 return ok({group,membership:member?.status||null,is_owner:owner,can_read:true,members,topics,replies,polls,images});
 }catch(e){console.error('Groups',e);return fail(e.message||'No se pudo cargar el grupo.');}}
async function mutate(db,me,id,b){
 const group=await db.prepare('SELECT * FROM community_groups WHERE id=?').bind(number(id)).first();if(!group)return fail('Grupo no encontrado.',404);
 const owner=group.owner_id===me.id,member=await db.prepare('SELECT status FROM group_members WHERE group_id=? AND user_id=?').bind(id,me.id).first();
 if(b.action==='join'){
 await db.prepare('INSERT OR IGNORE INTO group_members(group_id,user_id,status) VALUES(?,?,?)').bind(id,me.id,group.admission==='open'?'accepted':'pending').run();return ok({message:group.admission==='open'?'Ya eres miembro.':'Solicitud enviada.'});}
 if(b.action==='leave'){
 if(owner)return fail('Cede la administración antes de abandonar el grupo.');await db.prepare('DELETE FROM group_members WHERE group_id=? AND user_id=?').bind(id,me.id).run();return ok({message:'Has salido del grupo.'});}
 if(['edit','accept','remove','transfer','lock','close_poll'].includes(b.action)){
 if(!owner)return fail('Solo el propietario puede administrar este grupo.',403);
 if(b.action==='edit'){await db.prepare('UPDATE community_groups SET name=?,description=?,admission=? WHERE id=?').bind(text(b.name,3,60),text(b.description,1,2000),b.admission==='private'?'private':'open',id).run();return ok({message:'Grupo actualizado.'});}
 if(b.action==='lock'){await db.prepare('UPDATE group_topics SET locked=CASE WHEN locked=1 THEN 0 ELSE 1 END WHERE id=? AND group_id=?').bind(number(b.topic_id),id).run();return ok({message:'Estado del tema actualizado.'});}
 if(b.action==='close_poll'){await db.prepare('UPDATE group_polls SET closed=1 WHERE id=? AND group_id=?').bind(number(b.poll_id),id).run();return ok({message:'Encuesta cerrada.'});}
 const uid=number(b.user_id);if(uid===me.id)return fail('Elige otro miembro.');
 const target=await db.prepare('SELECT status FROM group_members WHERE group_id=? AND user_id=?').bind(id,uid).first();if(!target)return fail('Miembro no encontrado.',404);
 if(b.action==='accept')await db.prepare("UPDATE group_members SET status='accepted' WHERE group_id=? AND user_id=?").bind(id,uid).run();
 if(b.action==='remove')await db.prepare('DELETE FROM group_members WHERE group_id=? AND user_id=?').bind(id,uid).run();
 if(b.action==='transfer'){if(target.status!=='accepted')return fail('Debe ser un miembro aceptado.');await db.prepare('UPDATE community_groups SET owner_id=? WHERE id=?').bind(uid,id).run();}
 return ok({message:'Miembros actualizados.'});
 }
 if(member?.status!=='accepted'&&!owner)return fail('Debes ser miembro del grupo.',403);
 if(b.action==='topic'){
 const result=await db.prepare('INSERT INTO group_topics(group_id,user_id,title,body) VALUES(?,?,?,?)').bind(id,me.id,text(b.title,3,100),text(b.body,1,4000)).run();return ok({topic:result.meta.last_row_id,message:'Tema publicado.'});}
 if(b.action==='reply'){
 const topic=await db.prepare('SELECT id,locked FROM group_topics WHERE id=? AND group_id=?').bind(number(b.topic_id),id).first();if(!topic)return fail('Tema no encontrado.',404);if(topic.locked)return fail('El tema está cerrado.',409);
 await db.prepare('INSERT INTO group_replies(topic_id,user_id,body) VALUES(?,?,?)').bind(topic.id,me.id,text(b.body,1,2000)).run();return ok({message:'Respuesta publicada.'});}
 if(b.action==='poll'){
 const options=Array.isArray(b.options)?b.options.map(x=>text(x,1,80)):[];if(options.length<2||options.length>8||new Set(options.map(x=>x.toLowerCase())).size!==options.length)return fail('Escribe entre dos y ocho opciones distintas.');
 await db.prepare('INSERT INTO group_polls(group_id,user_id,title,options) VALUES(?,?,?,?)').bind(id,me.id,text(b.title,3,150),JSON.stringify(options)).run();return ok({message:'Encuesta publicada.'});}
 if(b.action==='vote'){
 const poll=await db.prepare('SELECT * FROM group_polls WHERE id=? AND group_id=?').bind(number(b.poll_id),id).first();if(!poll)return fail('Encuesta no encontrada.',404);if(poll.closed)return fail('La encuesta ha terminado.',409);
 const choice=Number(b.choice),options=JSON.parse(poll.options);if(!Number.isInteger(choice)||choice<0||choice>=options.length)return fail('Opción no válida.');
 const result=await db.prepare('INSERT OR IGNORE INTO group_votes(poll_id,user_id,choice) VALUES(?,?,?)').bind(poll.id,me.id,choice).run();if(!result.meta.changes)return fail('Ya has votado.',409);return ok({message:'Voto guardado.'});}
 if(b.action==='image'){
 if(!decodeDesignImage(b.image_data))return fail('Selecciona una imagen.');await db.prepare('INSERT INTO group_images(group_id,user_id,title,image_data) VALUES(?,?,?,?)').bind(id,me.id,text(b.title,1,100),b.image_data).run();return ok({message:'Imagen añadida.'});}
 return fail('Acción no válida.');
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
