import {assertOneGame348} from '../_shared/one-game348.js';
import {canFillBots} from '../_shared/game-bots.js';
import {ensureEnrollmentNotifications} from '../_shared/enrollment.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureDuel,duelListing,duelMatch,waitingDuel} from '../_shared/duel-service212.js';
async function handle({request,env}){try{
 const user=await getSessionUser(request,env.DB),url=new URL(request.url),id=Number(url.searchParams.get('id'));
 if(request.method==='GET')return Response.json({ok:true,...(id?await duelMatch(env.DB,id,user):{matches:await duelListing(env.DB,user)})},{headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 if(!user)return jsonError('Inicia sesión.',401);
 if(request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);
 if(!Number.isSafeInteger(id)||id<1)return jsonError('Partida no válida.',400);
 const body=await request.json();if(!['join','list','whisper','start','fill_bots','admin_kick'].includes(body?.action))return jsonError('Acción no permitida.',400);
 if(['start','fill_bots','admin_kick'].includes(body.action)&&!canFillBots(user))return jsonError('Solo admin1 puede iniciar o completar con bots.',403);
 if(body.action==='join')await assertOneGame348(env.DB,'duel',user.id,id);
 if(body.action==='join'&&body.notifyOnStart){await ensureDuel(env.DB);await ensureEnrollmentNotifications(env.DB,'duel');}
 const result=await duelMatch(env.DB,id,user,body);await waitingDuel(env.DB);return Response.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}});
}catch(e){return jsonError(e.message||'No se pudo cargar El Duelo.',400);}}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
