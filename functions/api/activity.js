import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema} from '../_shared/auth.js';
async function handle141_onRequest({request,env}){
 if(request.method!=='GET') return Response.json({ok:false,message:'Método no permitido.'},{status:405});
 try{
  await ensureProfileSchema(env.DB);
  const params=new URL(request.url).searchParams;
  const names=[...new Set((params.get('users')||'').split(',').map(s=>s.trim()).filter(s=>/^[A-Za-z0-9_.-]{1,32}$/.test(s)).slice(0,40).map(s=>s.toLowerCase()))];
  if(!names.length)return Response.json({ok:true,activity:{}},{headers:{'Cache-Control':'no-store'}});
  const qs=names.map(()=>'?').join(',');
  const rows=await env.DB.prepare(`SELECT LOWER(username) AS username,last_seen_at,MAX(0,CAST((julianday('now')-julianday(last_seen_at))*1440 AS INTEGER)) AS minutes FROM users WHERE LOWER(username) IN (${qs})`).bind(...names).all();
  const activity={};
  for(const row of rows.results) activity[row.username]=row.last_seen_at?Math.max(0,Number(row.minutes)||0):null;
  return Response.json({ok:true,activity},{headers:{'Cache-Control':'no-store'}});
 }catch(err){console.error('Activity',err);return Response.json({ok:false,message:'No se pudo consultar la conexión.'},{status:500});}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
