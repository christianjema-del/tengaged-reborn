export function decodeDesignImage(value){
 if(!value)return null;
 if(typeof value!=='string'||value.length>360000)throw Error('La imagen es demasiado grande.');
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);if(!match)throw Error('Usa una imagen PNG, JPG o WebP.');
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));if(bytes.length>262144)throw Error('La imagen debe ocupar menos de 256 KB.');
 const png=bytes.length>24&&bytes[0]===137&&String.fromCharCode(...bytes.slice(1,4))==='PNG'&&bytes[4]===13&&bytes[5]===10;
 const jpeg=bytes.length>4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>16&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!({png,jpeg,webp}[match[1]]))throw Error('El archivo no corresponde a una imagen válida.');
 return {bytes,type:'image/'+match[1]};
}
