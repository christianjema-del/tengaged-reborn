import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,ok,fail,userByName} from '../_shared/community-plus.js';
import {profileBets} from '../_shared/rookies-service.js';
async function handle({request,env}){try{
 if(request.method!=='GET')return fail('Método no permitido.',405);
 const {db,me,url}=await context(request,env.DB),target=await userByName(db,url.searchParams.get('username')||me?.username);if(!target)return fail('Usuario no encontrado.',404);
 return ok({self:target.id===me?.id,...await profileBets(db,target.id,url.searchParams.get('page'))});
}catch(e){console.error('Profile bets',e);return fail('No se pudieron cargar las apuestas.',500);}}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
