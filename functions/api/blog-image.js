import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,mutation,fail,ok,number} from '../_shared/community-plus.js';
// Fotos de los blogs: el navegador las reduce antes de enviarlas y aquí se guardan en base64.
const MAX_IMAGE_CHARS=1200000,DAILY_LIMIT=30;
const ensure=db=>db.prepare('CREATE TABLE IF NOT EXISTS blog_images(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,mime TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
async function handle({request,env}){try{
 const db=env.DB;await ensure(db);
 if(request.method==='GET'){
  const row=await db.prepare('SELECT mime,data FROM blog_images WHERE id=?').bind(number(new URL(request.url).searchParams.get('id'))).first();
  if(!row)return new Response('No existe esa foto.',{status:404});
  const bytes=Uint8Array.from(atob(row.data),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{'Content-Type':row.mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 }
 if(request.method!=='POST')return fail('Método no permitido.',405);
 const {me}=await context(request,db);
 const denied=mutation(request,me);if(denied)return denied;
 const b=await request.json(),match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image||''));
 if(!match||match[2].length>MAX_IMAGE_CHARS)return fail('La foto no es válida o es demasiado grande.',400);
 const today=await db.prepare("SELECT COUNT(*) n FROM blog_images WHERE user_id=? AND created_at>=datetime('now','-1 day')").bind(me.id).first();
 if(Number(today.n)>=DAILY_LIMIT)return fail('Has alcanzado el límite de fotos por hoy.',429);
 const result=await db.prepare('INSERT INTO blog_images(user_id,mime,data) VALUES(?,?,?)').bind(me.id,match[1],match[2]).run();
 return ok({id:result.meta.last_row_id});
}catch(e){return fail(e.message||'No se pudo guardar la foto.');}}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
