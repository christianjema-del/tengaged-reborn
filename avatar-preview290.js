// Guarda una imagen JPEG del propio avatar para las miniaturas de los enlaces: las redes no muestran SVG.
import {avatarImageSource} from '/avatar-display.js?v=337';
const KEY='tengaged_avatar_preview',DAY=86400000,WIDTH=400,HEIGHT=460;
const stored=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}};
function picture(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Avatar no disponible.'));image.src=src;});}
export async function syncAvatarPreview(username,{force=false}={}){
 const seen=stored();if(!force&&seen.username===username&&Date.now()-seen.at<DAY)return;
 const response=await fetch('/api/avatar?username='+encodeURIComponent(username),{credentials:'same-origin',cache:'no-store'}),image=await picture(await avatarImageSource(response));
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d');ctx.fillStyle='#d6e7f4';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,WIDTH,HEIGHT);
 const saved=await fetch('/api/avatar-preview',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:canvas.toDataURL('image/jpeg',.85)})});
 if(!saved.ok)throw Error('No se pudo guardar la miniatura.');try{localStorage.setItem(KEY,JSON.stringify({username,at:Date.now()}));}catch{}
}
export function watchAvatarPreview(username){syncAvatarPreview(username).catch(()=>{});addEventListener('tengaged:avatar-updated',event=>{if(!event.detail?.username||event.detail.username.toLowerCase()===username.toLowerCase())syncAvatarPreview(username,{force:true}).catch(()=>{});});}
