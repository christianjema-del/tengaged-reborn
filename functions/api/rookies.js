import {canFillBots} from '../_shared/game-bots.js';
import {ensureEnrollmentNotifications} from '../_shared/enrollment.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {rookiesListing,rookiesMatch,rookiesBets,placeBet,waitingRookies,ensureRookies} from '../_shared/rookies-service.js';
async function handle({request,env}){try{
 await ensureRookies(env.DB);const user=await getSessionUser(request,env.DB),url=new URL(request.url),id=Number(url.searchParams.get('id')),noStore={headers:{'Cache-Control':'no-store'}};
 if(request.method==='GET'){if(url.searchParams.has('bets')&&id)return Response.json({ok:true,...await rookiesBets(env.DB,id,user)},noStore);return Response.json({ok:true,...(id?await rookiesMatch(env.DB,id,user):{matches:await rookiesListing(env.DB,user)})},noStore);}
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 if(!user)return jsonError('Inicia sesión.',401);
 if(request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);
 if(!Number.isSafeInteger(id)||id<1)return jsonError('Partida no válida.',400);
 const body=await request.json();
 if(body?.action==='bet')return Response.json({ok:true,...await placeBet(env.DB,id,user,body.target)},noStore);
 if(!['join','start','fill_bots','nominate','vote','save','whisper','admin_kick'].includes(body?.action))return jsonError('Acción no permitida.',400);
 if(['start','fill_bots','admin_kick'].includes(body.action)&&!canFillBots(user))return jsonError('Solo admin1 puede iniciar o completar con bots.',403);
 if(body.action==='join'&&body.notifyOnStart)await ensureEnrollmentNotifications(env.DB,'rookies');
 const result=await rookiesMatch(env.DB,id,user,body);await waitingRookies(env.DB);return Response.json({ok:true,...result},noStore);
}catch(e){return jsonError(e.message||'No se pudo cargar Rookies.',400);}}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
