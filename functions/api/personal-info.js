// V345: «Información personal» (réplica de la pantalla Personal Info del Tengaged original).
// Solo la ve y la edita el dueño de la cuenta. La biografía se guarda en users.bio como siempre.
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
export const LANGUAGES345=['Español','English','Català','Euskara','Galego','Português','Français','Italiano','Deutsch'];
export const GENDERS345=['Hombre','Mujer'];
const ready=new WeakMap();
export function ensurePersonalInfo345(db){if(!ready.has(db))ready.set(db,db.prepare('CREATE TABLE IF NOT EXISTS user_personal_info345(user_id INTEGER PRIMARY KEY,full_name TEXT NOT NULL DEFAULT \'\',birth_day INTEGER,birth_month INTEGER,birth_year INTEGER,language TEXT NOT NULL DEFAULT \'\',gender TEXT NOT NULL DEFAULT \'\',blog TEXT NOT NULL DEFAULT \'\',news INTEGER NOT NULL DEFAULT 1,notify INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run().catch(e=>{ready.delete(db);throw e;}));return ready.get(db);}
// Comprueba y limpia lo que llega del formulario. Lanza un Error con el mensaje para el usuario.
export function cleanPersonalInfo345(body,now=new Date()){
 const text=(v,max,label)=>{const s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(s.length>max)throw Error(label+' no puede superar '+max+' caracteres.');return s;};
 const full_name=text(body.full_name,60,'El nombre completo');
 const bio=String(body.bio??'').trim();if(bio.length>1000)throw Error('La descripción no puede superar 1.000 caracteres.');
 const num=v=>v===''||v==null?null:Number(v);
 const d=num(body.birth_day),m=num(body.birth_month),y=num(body.birth_year),parts=[d,m,y].filter(x=>x!=null).length;
 if(parts&&parts<3)throw Error('Elige el día, el mes y el año de tu fecha de nacimiento, o deja los tres vacíos.');
 if(parts===3){const year=now.getUTCFullYear();if(![d,m,y].every(Number.isInteger)||y<1900||y>year||m<1||m>12||d<1||d>31)throw Error('La fecha de nacimiento no es válida.');const date=new Date(Date.UTC(y,m-1,d));if(date.getUTCDate()!==d||date>now)throw Error('La fecha de nacimiento no es válida.');}
 const language=String(body.language??'');if(language&&!LANGUAGES345.includes(language))throw Error('Ese idioma no está disponible.');
 const gender=String(body.gender??'');if(gender&&!GENDERS345.includes(gender))throw Error('Elige Hombre o Mujer.');
 let blog=text(body.blog,200,'La dirección del blog').replace(/^https?:\/\//i,'');
 if(blog&&!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?(\/[^\s<>"']*)?$/i.test(blog))throw Error('La dirección del blog no es válida. Escríbela sin http://, por ejemplo miblog.blogspot.com');
 return {full_name,bio,birth_day:parts?d:null,birth_month:parts?m:null,birth_year:parts?y:null,language,gender,blog,news:body.news?1:0,notify:body.notify?1:0};
}
async function handle({request,env}){
 const db=env.DB;if(!db)return jsonError('La base de datos no está disponible.',503);
 await ensureProfileSchema(db);await ensurePersonalInfo345(db);
 const viewer=await getSessionUser(request,db);if(!viewer)return jsonError('Inicia sesión para editar tu información personal.',401);
 if(request.method==='GET'){
  const row=await db.prepare('SELECT u.username,u.bio,p.full_name,p.birth_day,p.birth_month,p.birth_year,p.language,p.gender,p.blog,p.news,p.notify FROM users u LEFT JOIN user_personal_info345 p ON p.user_id=u.id WHERE u.id=?').bind(viewer.id).first();
  return Response.json({ok:true,info:{username:row.username,bio:row.bio||'',full_name:row.full_name||'',birth_day:row.birth_day??null,birth_month:row.birth_month??null,birth_year:row.birth_year??null,language:row.language||'',gender:row.gender||'',blog:row.blog||'',news:row.news==null?true:!!row.news,notify:row.notify==null?true:!!row.notify},languages:LANGUAGES345,genders:GENDERS345},{headers:{'Cache-Control':'no-store'}});
 }
 if(request.method!=='PUT')return jsonError('Método no permitido.',405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 let info;try{info=cleanPersonalInfo345(await request.json().catch(()=>({})));}catch(e){return jsonError(e.message,400);}
 await db.batch([
  db.prepare('UPDATE users SET bio=? WHERE id=?').bind(info.bio,viewer.id),
  db.prepare('INSERT INTO user_personal_info345(user_id,full_name,birth_day,birth_month,birth_year,language,gender,blog,news,notify) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name,birth_day=excluded.birth_day,birth_month=excluded.birth_month,birth_year=excluded.birth_year,language=excluded.language,gender=excluded.gender,blog=excluded.blog,news=excluded.news,notify=excluded.notify,updated_at=CURRENT_TIMESTAMP').bind(viewer.id,info.full_name,info.birth_day,info.birth_month,info.birth_year,info.language,info.gender,info.blog,info.news,info.notify)
 ]);
 return Response.json({ok:true,message:'Información personal guardada.'});
}
export async function onRequest(context){return withStorageGuard(context,handle);}
