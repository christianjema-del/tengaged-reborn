import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureReferrals} from '../_shared/referrals.js';
async function handle141_onRequest({request,env}){try{if(request.method!=='GET')return jsonError('Método no permitido.',405);await ensureProfileSchema(env.DB);const me=await getSessionUser(request,env.DB);if(!me)return jsonError('Inicia sesión.',401);await ensureReferrals(env.DB);const count=Number((await env.DB.prepare('SELECT COUNT(*) AS n FROM user_referrals WHERE inviter_id=?').bind(me.id).first()).n);const url=new URL('/',request.url);url.searchParams.set('ref',me.username);url.hash='register';return Response.json({ok:true,username:me.username,total:count,url:url.href},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Invitations',e);return jsonError('No se pudieron cargar tus invitaciones.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
