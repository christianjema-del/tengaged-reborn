import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureSocial,sameOrigin} from '../_shared/social.js';
import {ensureFriendLists} from '../_shared/friend-lists130.js';
async function handle141_onRequest({request,env}){try{
 const db=env.DB;await ensureProfileSchema(db);await ensureSocial(db);await ensureFriendLists(db);const me=await getSessionUser(request,db);
 const name=new URL(request.url).searchParams.get('username')||me?.username;
 const target=await db.prepare('SELECT id,username,is_system,is_banned FROM users WHERE LOWER(username)=LOWER(?)').bind(name||'').first();if(!target)return jsonError('No existe ese usuario.',404);
 if(request.method==='POST'){
 if(!me)return jsonError('Inicia sesión.',401);if(!sameOrigin(request))return jsonError('Origen no permitido.',403);
 const body=await request.json(),action=body.action;
 if(action==='reorder'){
  if(me.id!==target.id)return jsonError('Solo puedes ordenar tus propios amigos.',403);
  const names=Array.isArray(body.usernames)?body.usernames.map(n=>String(n).toLowerCase()):[];
  if(names.length>500||new Set(names).size!==names.length)return jsonError('Lista de amigos no válida.',400);
  const own=(await db.prepare('SELECT u.id,u.username FROM friend_links f JOIN users u ON u.id=f.friend WHERE f.owner=? AND u.is_system=0').bind(me.id).all()).results;
  if(names.length!==own.length||names.some(n=>!own.some(u=>u.username.toLowerCase()===n)))return jsonError('La lista de amigos ha cambiado. Recarga e inténtalo de nuevo.',409);
  await db.batch([db.prepare('DELETE FROM friend_order WHERE owner=?').bind(me.id),...names.map((n,i)=>db.prepare('INSERT INTO friend_order(owner,friend,position) VALUES(?,?,?)').bind(me.id,own.find(u=>u.username.toLowerCase()===n).id,i))]);
 }else{
 if(me.id===target.id)return jsonError('No puedes añadirte a ti mismo.',400);
 if(['add','request','accept'].includes(action)){
 if(target.is_system||target.is_banned)return jsonError('Este usuario no está disponible para añadir a amigos.',403);
 await db.prepare('INSERT OR IGNORE INTO friend_links(owner,friend) VALUES(?,?)').bind(me.id,target.id).run();
 }else if(action==='remove'){
 await db.batch([db.prepare('DELETE FROM friend_links WHERE owner=? AND friend=?').bind(me.id,target.id),db.prepare('DELETE FROM friend_order WHERE owner=? AND friend=?').bind(me.id,target.id)]);
 }else return jsonError('Acción inválida.',400);
 }
 }else if(request.method!=='GET')return jsonError('Método no permitido.',405);
 const friends=(await db.prepare(`SELECT u.username,EXISTS(SELECT 1 FROM friend_links r WHERE r.owner=u.id AND r.friend=?) AS mutual FROM friend_links f JOIN users u ON u.id=f.friend LEFT JOIN friend_order o ON o.owner=f.owner AND o.friend=u.id WHERE f.owner=? AND u.is_system=0 ORDER BY COALESCE(o.position,999999),u.username COLLATE NOCASE`).bind(target.id,target.id).all()).results.map(f=>({...f,mutual:!!f.mutual}));
 const added=!!(me&&me.id!==target.id&&await db.prepare('SELECT 1 FROM friend_links WHERE owner=? AND friend=?').bind(me.id,target.id).first());
 const addedBy=!!(me&&me.id!==target.id&&await db.prepare('SELECT 1 FROM friend_links WHERE owner=? AND friend=?').bind(target.id,me.id).first());
 let activity=[];if(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='blog_posts'").first())activity=(await db.prepare('SELECT b.id,b.title,b.created_at,u.username FROM blog_posts b JOIN users u ON u.id=b.user_id JOIN friend_links f ON f.friend=u.id WHERE f.owner=? AND u.is_banned=0 ORDER BY b.created_at DESC,b.id DESC LIMIT 20').bind(target.id).all()).results;
 return Response.json({ok:true,friends,activity,requests:[],added,addedBy,target_system:!!target.is_system,self:me?.id===target.id,loggedIn:!!me,relation:added?(addedBy?'accepted':'outgoing'):(addedBy?'incoming':'none')},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return jsonError('No se pudieron cargar los amigos.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
