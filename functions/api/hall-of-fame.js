import {withStorageGuard} from '../_shared/storage-guard141.js';
import {hofDetails} from '../_shared/hof-details109.js';
import {ensureProfileSchema,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
async function handle141_onRequestGet({env}){
 try{await ensureProfileSchema(env.DB);await ensureCommunitySchema(env.DB);
 const info=await env.DB.prepare('PRAGMA table_info(user_stats)').all();const columns=new Set((info.results||[]).map(c=>c.name));const has=columns.has('username');
 const metric=c=>has&&columns.has(c)?`COALESCE(s.${c},0)`:'0';
 const rows=await env.DB.prepare(`SELECT u.username,COALESCE(u.karma,0) AS karma,${metric('games_played')} AS games_played,${metric('wins')} AS wins,${metric('points')} AS points,
 (SELECT si.theme_code FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=u.id AND inv.is_equipped=1 AND si.category='Tarjetas de color' LIMIT 1) AS color_code,
 COALESCE((SELECT i.theme_code FROM user_inventory v JOIN shop_items i ON i.code=v.item_code WHERE v.user_id=u.id AND v.is_equipped=1 AND i.category='Avatares' LIMIT 1),'classic-blue') AS avatar_code
 FROM users u ${has?'LEFT JOIN user_stats s ON LOWER(s.username)=LOWER(u.username)':''}
 WHERE COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND COALESCE(u.is_banned,0)=0
 ORDER BY COALESCE(u.karma,0) DESC,LOWER(u.username) ASC,u.id ASC LIMIT 50`).all();
 const details=await hofDetails(env.DB,rows.results);
 return Response.json({ok:true,...details,leaders:rows.results.map((u,i)=>({...u,rank:i+1})),order:'karma'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Ranking',e);return jsonError('No se pudo cargar el Hall of Fame.',500);}
}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
