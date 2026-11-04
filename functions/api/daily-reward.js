import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';import {claimDailyReward} from '../_shared/daily-rewards.js';
async function handle141_onRequestPost({request,env}){try{if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);const user=await getSessionUser(request,env.DB);if(!user)return jsonError('Inicia sesión para recibir el premio diario.',401);return Response.json({ok:true,...await claimDailyReward(env.DB,user)},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Daily reward',e);return jsonError('No se pudo comprobar el premio diario. Se comprobará al volver a acceder.',503);}}

export async function onRequestPost(context){return withStorageGuard(context,handle141_onRequestPost);}
