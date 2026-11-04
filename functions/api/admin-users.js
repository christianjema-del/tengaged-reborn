import {withStorageGuard} from '../_shared/storage-guard141.js';
import {expireModeration} from '../_shared/moderation.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {isOwner,isStaff} from '../_shared/staff.js';
async function handle141_onRequestGet({request,env}){try{
 const db=env.DB;await ensureProfileSchema(db);const actor=await getSessionUser(request,db);if(!isStaff(actor))return jsonError('No tienes permisos para consultar usuarios.',403);await expireModeration(db);
 const owner=isOwner(actor),url=new URL(request.url),q=String(url.searchParams.get('q')||'').trim().slice(0,24),filter=url.searchParams.get('filter')||'all',page=Math.max(1,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||1))),limit=30;
 const filters={all:'1=1',active:'u.is_banned=0',suspended:'u.is_banned=1',moderators:'u.is_moderator=1',red_nose:'u.red_nose_until IS NOT NULL'};if(!Object.hasOwn(filters,filter))return jsonError('Filtro no válido.',400);
 const where=`(${filters[filter]}) AND (?='' OR instr(LOWER(u.username),LOWER(?))>0)`,total=(await db.prepare('SELECT COUNT(*) AS n FROM users u WHERE '+where).bind(q,q).first()).n;
 const users=(await db.prepare(`SELECT u.id,u.username,u.karma,${owner?'u.t_money':'NULL AS t_money'},u.is_admin,u.is_moderator,u.is_system,u.is_banned,u.is_test_bot,u.ban_until,u.red_nose_until,u.last_seen_at FROM users u WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`).bind(q,q,limit,(page-1)*limit).all()).results;
 const stats=await db.prepare('SELECT COUNT(*) AS users,SUM(CASE WHEN is_moderator=1 THEN 1 ELSE 0 END) AS moderators,SUM(CASE WHEN is_banned=1 THEN 1 ELSE 0 END) AS suspended,SUM(CASE WHEN red_nose_until IS NOT NULL THEN 1 ELSE 0 END) AS noses FROM users').first();
 return Response.json({ok:true,users,total,page,pages:Math.max(1,Math.ceil(total/limit)),stats,actor:{username:actor.username,owner},capabilities:{owner}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Admin list',e);return jsonError('No se pudieron cargar los usuarios.',500);}}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
