import {ensurePeachDesigns200} from '../_shared/peach-import200.js';
import {isPhotoAvatar} from '../../full-avatar115.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensurePeachWardrobe} from '../_shared/peach-wardrobe108.js';
import {avatarLayerImage} from '../_shared/avatar-media.js';
import {hairOrnamentCostume} from '../../avatar-costumes.js';
import {ensureCristiDesigns} from '../_shared/cristi-import100.js';
import {noseActive,addRedNose} from '../_shared/moderation.js';
import {ADMIN1_OUTFIT_ID,ADMIN1_OUTFIT_DATA,ADMIN1_OUTFIT,ownsAdmin1Outfit} from '../_shared/admin1-outfit.js';
import {cleanDesignLayer} from '../_shared/clean-design-layers.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {ensureAvatar,getAvatar} from '../_shared/avatar-settings.js';
import {normalizeAvatar,renderAvatar} from '../../avatar-art.js';
async function handle141_onRequest({request,env}){try{const db=env.DB,url=new URL(request.url),publicImage=request.method==='GET'&&url.searchParams.has('username')&&url.searchParams.get('format')!=='json';await ensureProfileSchema(db);await ensureAvatar(db);if(!publicImage)await ensureCommunitySchema(db);const viewer=publicImage?null:await getSessionUser(request,db);if(request.method==='GET'&&url.searchParams.get('format')==='json'){await ensureCristiDesigns(db,viewer);if(viewer?.username?.toLowerCase()==='peach'){await ensurePeachWardrobe(db);await ensurePeachDesigns200(db,viewer);}}
if(request.method==='POST'){if(!viewer)return jsonError('Inicia sesión para editar tu avatar.',401);if(request.headers.get('Origin')!==url.origin)return jsonError('Origen no permitido.',403);const raw=await request.json().catch(()=>null);if(!raw)return jsonError('Avatar no válido.',400);
if(raw.action==='unequip'){if(!['skin','shirt','eyes','mouth','hair','hair_ornament','glasses','background'].includes(raw.layer_type))return jsonError('Capa no válida.',400);await db.batch([db.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT 'userdesign-' || design_id FROM user_avatar_layers WHERE user_id=? AND layer_type=?)").bind(viewer.id,viewer.id,raw.layer_type),db.prepare('DELETE FROM user_avatar_layers WHERE user_id=? AND layer_type=?').bind(viewer.id,raw.layer_type)]);return Response.json({ok:true,message:'Pieza retirada.'});}
let settings;try{settings=normalizeAvatar(raw.settings||raw);}catch(e){return jsonError(e.message,400);}
const statements=[db.prepare('INSERT INTO user_avatar_settings(user_id,settings) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings,updated_at=CURRENT_TIMESTAMP').bind(viewer.id,JSON.stringify(settings))];
if(Object.hasOwn(raw,'layers')){
 const allowed=['skin','shirt','eyes','mouth','hair','hair_ornament','glasses','background'];
 if(!raw.layers||typeof raw.layers!=='object'||Array.isArray(raw.layers)||Object.keys(raw.layers).some(k=>!allowed.includes(k)))return jsonError('Selección de diseños no válida.',400);
 const chosen=[];
 for(const [layer,id] of Object.entries(raw.layers)){
  if(!Number.isSafeInteger(id)||id<1)return jsonError('Diseño no válido.',400);
  const owned=(layer==='skin'&&id===ADMIN1_OUTFIT_ID&&ownsAdmin1Outfit(viewer.username))?{id,layer_type:'skin'}:await db.prepare(`SELECT d.id,d.layer_type FROM community_designs d JOIN user_inventory i
    ON i.item_code='userdesign-'||d.id AND i.user_id=? WHERE d.id=? AND d.image_data IS NOT NULL`).bind(viewer.id,id).first();
  if(!owned||owned.layer_type!==layer)return jsonError('Solo puedes equipar diseños de tu inventario y en su categoría.',403);
  chosen.push([layer,id]);
 }
 statements.push(db.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT 'userdesign-'||design_id FROM user_avatar_layers WHERE user_id=?)").bind(viewer.id,viewer.id));
 statements.push(db.prepare('DELETE FROM user_avatar_layers WHERE user_id=?').bind(viewer.id));
 for(const [layer,id] of chosen){
  statements.push(db.prepare('INSERT INTO user_avatar_layers(user_id,layer_type,design_id) VALUES(?,?,?)').bind(viewer.id,layer,id));
  if(id!==ADMIN1_OUTFIT_ID)statements.push(db.prepare("UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?").bind(viewer.id,'userdesign-'+id));
 }
}
await db.batch(statements);
return Response.json({ok:true,settings,message:'Avatar y diseños guardados.'},{headers:{'Cache-Control':'no-store'}});}
if(request.method!=='GET')return jsonError('Método no permitido.',405);const username=url.searchParams.get('username')||viewer?.username;const user=username?await db.prepare('SELECT id,username,red_nose_until FROM users WHERE LOWER(username)=LOWER(?)').bind(username).first():null;if(!user)return jsonError('No existe ese usuario.',404);const {settings,layers}=await displayRecord(db,user);const overlays=Object.fromEntries(layers.map(d=>[d.layer_type,avatarLayerImage(d.image_data)]).filter(([,image])=>image));{const costume=hairOrnamentCostume(layers.find(l=>l.layer_type==='hair_ornament')?.design_id);if(costume)overlays._hairOrnamentCostume=costume;}const adminOutfitEquipped=ownsAdmin1Outfit(user.username)&&layers.some(l=>l.layer_type==='skin'&&l.design_id===ADMIN1_OUTFIT_ID);if(adminOutfitEquipped){overlays.skin=ADMIN1_OUTFIT_DATA;overlays._fullBody=true;}
if(url.searchParams.get('format')==='json'){if(viewer?.id!==user.id)return jsonError('Solo puedes editar tu propio avatar.',403);const wardrobe=(await db.prepare(`SELECT d.id,d.title,d.description,d.layer_type,i.purchased_at AS acquired_at,
 CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image
 FROM user_inventory i JOIN community_designs d ON i.item_code='userdesign-'||d.id
 WHERE i.user_id=? ORDER BY i.purchased_at DESC,d.id DESC`).bind(viewer.id).all()).results;
 if(ownsAdmin1Outfit(user.username))wardrobe.push(ADMIN1_OUTFIT);
 return Response.json({ok:true,settings,layers:layers.map(({image_data,...l})=>l),wardrobe},{headers:{'Cache-Control':'no-store'}});}
if(isPhotoAvatar(overlays.skin)&&!noseActive(user)){const [meta,data]=overlays.skin.split(',');const type=meta.slice(5).split(';')[0];return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{'Content-Type':type,'X-Avatar-Mode':'photo','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}
if(adminOutfitEquipped&&!noseActive(user)){const data=ADMIN1_OUTFIT_DATA.split(',')[1].replace(/\\n|\s/g,'');return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/png','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}
return new Response(noseActive(user)?addRedNose(renderAvatar(settings,overlays)):renderAvatar(settings,overlays),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});
}catch(e){console.error('Avatar',e);return jsonError('No se pudo cargar el avatar.',500);}}

async function displayRecord(db,user,retry=true){try{const settings=await getAvatar(db,user);const layers=(await db.prepare('SELECT l.layer_type,l.design_id,d.image_data,d.title FROM user_avatar_layers l LEFT JOIN community_designs d ON d.id=l.design_id WHERE l.user_id=?').bind(user.id).all()).results;return {settings,layers};}catch(error){if(!retry||!/no such (table|column)/i.test(String(error.message)))throw error;await ensureCommunitySchema(db);return displayRecord(db,user,false);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
