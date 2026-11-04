import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
async function handle141_onRequestGet({request,env}){try{const user=await getSessionUser(request,env.DB);if(!user)return jsonError('Inicia sesión.',401);let row;try{row=await env.DB.prepare('SELECT COUNT(*) AS n FROM private_messages WHERE recipient=? AND read_at IS NULL').bind(user.id).first();}catch(e){if(!/no such table.*private_messages/i.test(String(e.message)))throw e;row={n:0};}return Response.json({ok:true,unread:Number(row.n)||0,username:user.username},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Unread mail',e);return jsonError('No se pudo comprobar el correo.',503);}}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
