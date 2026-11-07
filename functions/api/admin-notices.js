// V298: admin1 envía avisos de Tengaged al correo de un jugador o de toda la comunidad.
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureStaffSchema,isOwner} from '../_shared/staff.js';
import {ensureSystemAccount,SYSTEM_NAME} from '../_shared/system-account.js';
const json=data=>Response.json({ok:true,...data},{headers:{'Cache-Control':'no-store'}});
async function history(db){return (await db.prepare("SELECT l.id,l.amount,l.reason,l.created_at,t.username AS target FROM admin_audit_log l LEFT JOIN users t ON t.id=l.target_user_id WHERE l.action='send_notice' ORDER BY l.id DESC LIMIT 20").all()).results;}
async function handle({request,env}){try{
 const db=env.DB;await ensureStaffSchema(db);await ensureSystemAccount(db);const actor=await getSessionUser(request,db);if(!isOwner(actor))return jsonError('Solo admin1 puede enviar avisos.',403);
 if(request.method==='GET')return json({notices:await history(db)});
 if(request.method!=='POST')return jsonError('Método no permitido.',405);if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 const body=await request.json().catch(()=>({}));const subject=String(body.subject||'').trim(),text=String(body.body||'').trim(),to=String(body.to||'all').trim();
 if(subject.length<3||subject.length>100)return jsonError('El asunto debe tener entre 3 y 100 caracteres.',400);if(text.length<3||text.length>4000)return jsonError('El mensaje debe tener entre 3 y 4000 caracteres.',400);
 const system=await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE AND is_system=1').bind(SYSTEM_NAME).first();if(!system)return jsonError('No existe la cuenta de avisos.',500);
 const key='admin-notice:'+crypto.randomUUID()+':';
 let target=null,where="COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND COALESCE(u.is_banned,0)=0";
 if(to!=='all'){target=await db.prepare('SELECT id,username,is_system FROM users WHERE username=? COLLATE NOCASE').bind(to).first();if(!target||target.is_system)return jsonError('No existe ese usuario.',404);where='u.id='+Number(target.id);}
 const full=text+'\n\nEste es un aviso de la administración de Tengaged y no admite respuesta.';
 const [sent]=await db.batch([
  db.prepare(`INSERT OR IGNORE INTO private_messages(sender,recipient,subject,body,system_event) SELECT ?,u.id,?,?,?||u.id FROM users u WHERE ${where}`).bind(system.id,subject,full,key),
  db.prepare("INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) SELECT ?,?,'send_notice',(SELECT COUNT(*) FROM private_messages WHERE system_event LIKE ?||'%'),?").bind(actor.id,target?.id??actor.id,key,(target?'Para '+target.username:'Para todos')+' · '+subject)
 ]);
 const n=Number(sent.meta?.changes)||0;
 return json({message:n===1?'Aviso enviado a '+(target?.username||'1 usuario')+'.':'Aviso enviado a '+n+' usuarios.',sent:n,notices:await history(db)});
 }catch(e){console.error('Admin notices',e);return jsonError('No se pudo enviar el aviso.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
