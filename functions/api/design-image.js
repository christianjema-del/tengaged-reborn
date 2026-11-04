import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ADMIN1_OUTFIT_ID} from '../_shared/admin1-outfit.js';
import {cleanDesignLayer} from '../_shared/clean-design-layers.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {decodeDesignImage} from '../_shared/design-images.js';
async function handle141_onRequestGet({request,env}){
 const id=Number(new URL(request.url).searchParams.get('id'));if(!Number.isSafeInteger(id)||id<1)return new Response('Imagen no encontrada',{status:404});if(id===ADMIN1_OUTFIT_ID){return new Response(null,{status:302,headers:{Location:'/assets/avatar/admin1-checkered.png','Cache-Control':'no-store'}});}
 try{await ensureCommunitySchema(env.DB);const row=await env.DB.prepare('SELECT image_data FROM community_designs WHERE id=?').bind(id).first();const image=decodeDesignImage(cleanDesignLayer(row?.image_data));if(!image)return new Response('Imagen no encontrada',{status:404});return new Response(image.bytes,{headers:{'Content-Type':image.type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}catch{return new Response('No se pudo cargar la imagen',{status:500});}
}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
