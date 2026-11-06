import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureStaffSchema,isOwner} from '../_shared/staff.js';
import {clientIp,ensureUserIps,purgeOldIps} from '../_shared/user-ips.js';
const VALID_IP=/^[0-9a-fA-F:.]{3,45}$/;
async function overview(db){
 await purgeOldIps(db);
 const rows=(await db.prepare(`SELECT i.ip,u.username,u.is_banned,i.last_seen FROM user_ips i JOIN users u ON u.id=i.user_id WHERE COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND i.ip IN (SELECT x.ip FROM user_ips x JOIN users y ON y.id=x.user_id WHERE COALESCE(y.is_system,0)=0 AND COALESCE(y.is_test_bot,0)=0 GROUP BY x.ip HAVING COUNT(*)>1) ORDER BY i.last_seen DESC LIMIT 500`).all()).results;
 const blocked=(await db.prepare('SELECT b.ip,b.reason,b.created_at,u.username AS actor FROM blocked_ips b LEFT JOIN users u ON u.id=b.actor_id ORDER BY b.created_at DESC').all()).results,closed=new Set(blocked.map(row=>row.ip)),groups=new Map();
 for(const row of rows){if(!groups.has(row.ip))groups.set(row.ip,{ip:row.ip,last_seen:row.last_seen,blocked:closed.has(row.ip),users:[]});groups.get(row.ip).users.push({username:row.username,is_banned:!!row.is_banned});}
 return {groups:[...groups.values()],blocked};
}
async function handle({request,env}){try{
 const db=env.DB;await ensureStaffSchema(db);await ensureUserIps(db);const actor=await getSessionUser(request,db);if(!isOwner(actor))return jsonError('Solo admin1 puede consultar las IP.',403);
 if(request.method==='GET')return Response.json({ok:true,...await overview(db)},{headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return jsonError('Método no permitido.',405);if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 const body=await request.json().catch(()=>({})),ip=String(body.ip||'').trim().toLowerCase(),reason=String(body.reason||'').trim().slice(0,180);if(!VALID_IP.test(ip))return jsonError('IP no válida.',400);
 if(body.action==='block'){
  if(!reason)return jsonError('Escribe un motivo para bloquear la IP.',400);if(ip===clientIp(request,env))return jsonError('No puedes bloquear tu propia IP.',400);
  await db.batch([db.prepare('INSERT OR REPLACE INTO blocked_ips(ip,reason,actor_id) VALUES(?,?,?)').bind(ip,reason,actor.id),db.prepare('INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) VALUES(?,?,?,?,?)').bind(actor.id,actor.id,'block_ip',null,ip+' · '+reason)]);
 }else if(body.action==='unblock'){
  await db.batch([db.prepare('DELETE FROM blocked_ips WHERE ip=?').bind(ip),db.prepare('INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) VALUES(?,?,?,?,?)').bind(actor.id,actor.id,'unblock_ip',null,ip+(reason?' · '+reason:''))]);
 }else return jsonError('Acción no válida.',400);
 return Response.json({ok:true,message:body.action==='block'?'IP bloqueada.':'IP desbloqueada.',...await overview(db)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Admin IP',e);return jsonError('No se pudieron gestionar las IP.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
