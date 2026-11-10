import {isPhotoAvatar} from '../../full-avatar115.js';
export function decodeDesignImage(value){
 if(!value)return null;
 // V341: los avatares de foto aprobados (lista fija por huella) pueden superar el límite; el resto no.
 if(typeof value!=='string'||(value.length>360000&&!isPhotoAvatar(value)))throw Error('La imagen es demasiado grande.');
 // V337: los GIF solo se aceptan si son avatares de foto aprobados (lista fija por huella), como el de Bowsy.
 const gif=/^data:image\/gif;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(gif){if(!isPhotoAvatar(value))throw Error('Usa una imagen PNG, JPG o WebP.');const bytes=Uint8Array.from(atob(gif[1]),c=>c.charCodeAt(0));if(String.fromCharCode(...bytes.slice(0,6))!=='GIF89a'&&String.fromCharCode(...bytes.slice(0,6))!=='GIF87a')throw Error('El archivo no corresponde a una imagen válida.');return {bytes,type:'image/gif'};}
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);if(!match)throw Error('Usa una imagen PNG, JPG o WebP.');
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));if(bytes.length>262144)throw Error('La imagen debe ocupar menos de 256 KB.');
 const png=bytes.length>24&&bytes[0]===137&&String.fromCharCode(...bytes.slice(1,4))==='PNG'&&bytes[4]===13&&bytes[5]===10;
 const jpeg=bytes.length>4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>16&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!({png,jpeg,webp}[match[1]]))throw Error('El archivo no corresponde a una imagen válida.');
 return {bytes,type:'image/'+match[1]};
}
