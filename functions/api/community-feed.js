import {recentPublicEvents166} from '../_shared/public-game-events166.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,ok,fail} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 if(request.method!=='GET')return fail('Método no permitido.',405);
 const {db,url,me}=await context(request,env.DB),q=(url.searchParams.get('q')||'').trim().slice(0,32);
 const online=Number((await db.prepare("SELECT COUNT(*) AS n FROM users WHERE is_banned=0 AND is_system=0 AND is_test_bot=0 AND last_seen_at>=datetime('now','-5 minutes')").first()).n);
 if(url.searchParams.get('summary')==='1'){const unread=me?Number((await db.prepare('SELECT COUNT(*) AS n FROM private_messages WHERE recipient=? AND read_at IS NULL').bind(me.id).first()).n):0;return ok({online,unread});}
 const users=(await db.prepare(`SELECT username,karma,last_seen_at FROM users WHERE is_banned=0 AND is_system=0 AND is_test_bot=0 AND (?='' OR instr(lower(username),lower(?))>0) ORDER BY CASE WHEN last_seen_at>=datetime('now','-5 minutes') THEN 0 ELSE 1 END,last_seen_at DESC,username LIMIT 40`).bind(q,q).all()).results;

 let messages=(await db.prepare(`SELECT c.room,c.body,c.created_at,u.username FROM game_chat c JOIN users u ON u.id=c.user_id WHERE u.is_banned=0 AND c.room NOT LIKE 'survivor:%:%' ORDER BY c.id DESC LIMIT 25`).all()).results;
 let events=[];try{events=await recentPublicEvents166(db);}catch(error){console.error('Public game notices',error);}messages=[...messages,...events].sort((a,b)=>Date.parse(b.created_at.includes('T')?b.created_at:b.created_at.replace(' ','T')+'Z')-Date.parse(a.created_at.includes('T')?a.created_at:a.created_at.replace(' ','T')+'Z')).slice(0,25);
 const unread=me?Number((await db.prepare('SELECT COUNT(*) AS n FROM private_messages WHERE recipient=? AND read_at IS NULL').bind(me.id).first()).n):0;
 return ok({users,online,messages,unread});
 }catch(e){console.error('Feed',e);return fail('No se pudo cargar la comunidad.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
