import {canFillBots} from '../_shared/game-bots.js';
import {ensureEnrollmentNotifications} from '../_shared/enrollment.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureSurvivor,survivorListing,survivorMatch,waitingSurvivor} from '../_shared/survivor-service.js';
const ACTIONS=['join','start','fill_bots','hunt','bucket','eat','fan','sitout','vote','whisper'];
async function handle({request,env}){try{
 const user=await getSessionUser(request,env.DB),url=new URL(request.url),id=Number(url.searchParams.get('id')),tribe=url.searchParams.get('tribe'),noStore={headers:{'Cache-Control':'no-store'}};
 if(request.method==='GET')return Response.json({ok:true,...(id?await survivorMatch(env.DB,id,user,null,false,tribe):{matches:await survivorListing(env.DB,user)})},noStore);
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 if(!user)return jsonError('Inicia sesión.',401);
 if(request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);
 if(!Number.isSafeInteger(id)||id<1)return jsonError('Partida no válida.',400);
 const body=await request.json().catch(()=>null);if(!ACTIONS.includes(body?.action))return jsonError('Acción no permitida.',400);
 if(['start','fill_bots'].includes(body.action)&&!canFillBots(user))return jsonError('Solo admin1 puede iniciar o completar con bots.',403);
 if(body.action==='join'){const account=await env.DB.prepare('SELECT is_test_bot,is_system FROM users WHERE id=?').bind(user.id).first();if(account?.is_test_bot||account?.is_system)return jsonError('Usa una cuenta real para inscribirte.',403);if(body.notifyOnStart){await ensureSurvivor(env.DB);await ensureEnrollmentNotifications(env.DB,'survivor');}}
 const result=await survivorMatch(env.DB,id,user,body,false,tribe);await waitingSurvivor(env.DB);
 return Response.json({ok:true,...result},noStore);
}catch(e){return jsonError(e.message||'No se pudo cargar Survivor.',400);}}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
