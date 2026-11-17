// V381: comprobación de tarjeta de color para inscribirse.
// La página de inscripción (enrollment-review.js) llama a /api/enrollment-level
// cuando el formato tiene minimumColor. Sin este archivo, Cloudflare Pages
// devolvía index.html (HTML) y Safari mostraba
// "The string did not match the expected pattern." al leerlo como JSON.
import {COLOR_LEVEL_BY_CODE} from '../../color-level-catalog.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';

// Debe coincidir con minimumColor de enrollment-formats.
export const ENROLLMENT_MINIMUM_COLOR381=Object.freeze({frookies:'yellow',rookies:'yellow',race:'yellow',duel:'orange',survivor:'orange'});
const ALL_TYPES=['casting','frookies','rookies','duel','survivor','race','hunger','stars'];

export async function equippedColorPower381(db,userId){
 const rows=(await db.prepare("SELECT s.theme_code FROM user_inventory i JOIN shop_items s ON s.code=i.item_code WHERE i.user_id=? AND i.is_equipped=1 AND s.category='Tarjetas de color'").bind(userId).all()).results||[];
 return Math.max(1,...rows.map(r=>COLOR_LEVEL_BY_CODE[r.theme_code]?.power||1));
}

export function eligibility381(power){
 const eligible={};
 for(const type of ALL_TYPES){const code=ENROLLMENT_MINIMUM_COLOR381[type];eligible[type]=!code||power>=(COLOR_LEVEL_BY_CODE[code]?.power||1);}
 return eligible;
}

async function handle({request,env}){
 try{
  if(request.method!=='GET')return jsonError('Método no permitido.',405);
  const user=await getSessionUser(request,env.DB);
  if(!user)return jsonError('Inicia sesión.',401);
  const power=await equippedColorPower381(env.DB,user.id);
  return Response.json({ok:true,power,eligible:eligibility381(power)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('Enrollment level',e);
  return jsonError('No se pudo comprobar tu tarjeta de color.',500);
 }
}
export async function onRequest(ctx){return withStorageGuard(ctx,handle);}
