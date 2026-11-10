import {withStorageGuard} from '../_shared/storage-guard141.js';
import {expireModeration} from '../_shared/moderation.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {isOwner,isStaff} from '../_shared/staff.js';
import {ensureUserIps} from '../_shared/user-ips.js';
async function handle141_onRequestGet({request,env}){try{
 const db=env.DB;await ensureProfileSchema(db);const actor=await getSessionUser(request,db);if(!isStaff(actor))return jsonError('No tienes permisos para consultar usuarios.',403);await expireModeration(db);
 const owner=isOwner(actor),url=new URL(request.url),q=String(url.searchParams.get('q')||'').trim().slice(0,60),filter=url.searchParams.get('filter')||'all',page=Math.max(1,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||1))),limit=30;
 const filters={all:'1=1',active:'u.is_banned=0',suspended:'u.is_banned=1',moderators:'u.is_moderator=1',red_nose:'u.red_nose_until IS NOT NULL'};if(!Object.hasOwn(filters,filter))return jsonError('Filtro no válido.',400);
 await ensureUserIps(db);const byIp='EXISTS(SELECT 1 FROM user_ips i WHERE i.user_id=u.id AND i.ip=LOWER(?1))',match=owner?"instr(LOWER(u.username),LOWER(?1))>0 OR instr(LOWER(COALESCE(u.email,'')),LOWER(?1))>0 OR "+byIp:'instr(LOWER(u.username),LOWER(?1))>0 OR '+byIp;
 const where=`(${filters[filter]}) AND (?1='' OR ${match})`,total=(await db.prepare('SELECT COUNT(*) AS n FROM users u WHERE '+where).bind(q).first()).n;
 const users=(await db.prepare(`SELECT u.id,u.username,u.karma,${owner?'u.t_money':'NULL AS t_money'},u.is_admin,u.is_moderator,u.is_system,u.is_banned,u.is_test_bot,u.ban_until,u.red_nose_until,u.last_seen_at,(SELECT i.country FROM user_ips i WHERE i.user_id=u.id AND i.country IS NOT NULL ORDER BY i.last_seen DESC LIMIT 1) AS country FROM users u WHERE ${where} ORDER BY u.id DESC LIMIT ?2 OFFSET ?3`).bind(q,limit,(page-1)*limit).all()).results;
 const stats=await db.prepare('SELECT COUNT(*) AS users,SUM(CASE WHEN is_moderator=1 THEN 1 ELSE 0 END) AS moderators,SUM(CASE WHEN is_banned=1 THEN 1 ELSE 0 END) AS suspended,SUM(CASE WHEN red_nose_until IS NOT NULL THEN 1 ELSE 0 END) AS noses,SUM(CASE WHEN COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0 AND last_seen_at>=datetime(\'now\',\'-5 minutes\') THEN 1 ELSE 0 END) AS online,SUM(CASE WHEN created_at>=datetime(\'now\',\'-1 day\') THEN 1 ELSE 0 END) AS new_today,SUM(CASE WHEN COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0 AND last_seen_at>=datetime(\'now\',\'-1 day\') THEN 1 ELSE 0 END) AS active_today,ROUND(SUM(CASE WHEN COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0 AND lower(username)<>\'admin1\' THEN COALESCE(t_money,0) ELSE 0 END),1) AS money_total FROM users').first();stats.blocked_ips=(await db.prepare('SELECT COUNT(*) AS n FROM blocked_ips').first()).n;if(!owner)stats.money_total=null;
 return Response.json({ok:true,users,total,page,pages:Math.max(1,Math.ceil(total/limit)),stats,actor:{username:actor.username,owner},capabilities:{owner}},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Admin list',e);return jsonError('No se pudieron cargar los usuarios.',500);}}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
