import {withStorageGuard} from '../_shared/storage-guard141.js';
async function handle141_onRequestPost({request,env}) {
  if(request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Origen no permitido.'},{status:403});
  const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8);
  if(token&&/^[a-f0-9]{64}$/i.test(token)){
    const hash=BufferlessHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();
  }
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}});
}
function BufferlessHex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}

export async function onRequestPost(context){return withStorageGuard(context,handle141_onRequestPost);}
