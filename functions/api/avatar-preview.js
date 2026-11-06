import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {decodeDesignImage} from '../_shared/design-images.js';
import {ensureAvatarPreviews} from '../_shared/link-preview.js';
async function handle({request,env}){try{
 const db=env.DB;await ensureAvatarPreviews(db);const url=new URL(request.url);
 if(request.method==='GET'){
  const row=await db.prepare('SELECT a.image FROM avatar_previews a JOIN users u ON u.id=a.user_id WHERE lower(u.username)=lower(?) AND u.is_banned=0').bind(String(url.searchParams.get('username')||'').slice(0,32)).first(),image=decodeDesignImage(row?.image);
  if(!image)return Response.redirect(url.origin+'/assets/preview/randomize.png',302);
  return new Response(image.bytes,{headers:{'Content-Type':image.type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }
 if(request.method!=='POST')return jsonError('Método no permitido.',405);if(request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);
 const user=await getSessionUser(request,db);if(!user)return jsonError('Inicia sesión.',401);
 const body=await request.json().catch(()=>({}));if(!String(body.image||'').startsWith('data:image/jpeg;base64,'))return jsonError('Imagen no válida.',400);try{decodeDesignImage(body.image);}catch{return jsonError('Imagen no válida.',400);}
 await db.prepare("INSERT INTO avatar_previews(user_id,image) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET image=excluded.image,updated_at=CURRENT_TIMESTAMP").bind(user.id,body.image).run();
 return Response.json({ok:true});
 }catch(e){console.error('Miniatura de avatar',e);return jsonError('No se pudo procesar la miniatura.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
