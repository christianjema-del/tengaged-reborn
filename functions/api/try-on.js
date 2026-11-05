import {withStorageGuard} from '../_shared/storage-guard141.js';
import {decodeDesignImage} from '../_shared/design-images.js';
import {cleanDesignLayer} from '../_shared/clean-design-layers.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {ensureAvatar,getAvatar} from '../_shared/avatar-settings.js';
import {renderAvatar} from '../../avatar-art.js';
async function handle141_onRequest({request,env}) {
 try {
  if(request.method!=='GET') return jsonError('Método no permitido.',405);
  const db=env.DB; await ensureProfileSchema(db);await ensureCommunitySchema(db);await ensureAvatar(db);
  const user=await getSessionUser(request,db);
  if(!user)return jsonError('Inicia sesión para probarte este diseño.',401);
  const id=Number(new URL(request.url).searchParams.get('design_id'));
  if(!Number.isSafeInteger(id)||id<1)return jsonError('Diseño no válido.',400);
  const item=await db.prepare('SELECT image_data,layer_type FROM community_designs WHERE id=?').bind(id).first();
  if(!item||!item.image_data)return jsonError('Este diseño no tiene imagen para probar.',404);
  const settings=await getAvatar(db,user);
  const layers=(await db.prepare('SELECT l.layer_type,d.image_data FROM user_avatar_layers l JOIN community_designs d ON d.id=l.design_id WHERE l.user_id=?').bind(user.id).all()).results;
  const overlays=Object.fromEntries(layers.filter(x=>x.image_data).map(x=>[x.layer_type,cleanDesignLayer(x.image_data)]));
  // No database writes: temporarily swap the chosen layer only for this rendering.
  if(item.layer_type==='profile'){
    // Full-image designs are displayed as a complete look instead of a garment overlay.
    const full=decodeDesignImage(cleanDesignLayer(item.image_data));if(!full)return jsonError('Este diseño no tiene imagen.',404);
    return new Response(full.bytes,{headers:{'Content-Type':full.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(!['skin','shirt','eyes','mouth','hair','hair_ornament','glasses','background'].includes(item.layer_type))return jsonError('Capa no compatible.',400);
  overlays[item.layer_type]=cleanDesignLayer(item.image_data);
  // A skin selection replaces the entire original base avatar. Other purchased
  // overlays remain, but default features must not be drawn over the selected body.

  return new Response(renderAvatar(settings,overlays),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('Try-on',e);return jsonError('No se pudo generar la prueba.',500);}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
