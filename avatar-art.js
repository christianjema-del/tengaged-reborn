import {isPhotoAvatar} from './full-avatar115.js';
import {placementForDesign} from './avatar-fit.js';
import {originalLayer147} from './original-avatar147.js';
export const avatarOptions={body:4,eyes:11,mouth:15,hair:22,shirt:18,glasses:8};
// Original set 1 is the default editable base; owned designs retain overlay priority.
export const defaultAvatar={originalSet:'f1',body:0,eyes:1,mouth:1,hair:8,shirt:0,glasses:0,skin:'#e6bf6c',eyeColor:'#285a8e',hairColor:'#000000',shirtColor:'#fb8c00',mouthColor:'#ba253c',glassesColor:'#fb8c00',background:'#d7e7f4'};
export const skinPalette=['#fff0dc','#f8dec4','#f1c9a5','#f1c27d','#e6bf6c','#e0ac69','#d6a078','#c68642','#b87b55','#a66b46','#8d5524','#784b35','#613d2c','#4c3026','#35231c'];
export const featurePalette=['#111111','#2b1b0e','#6d4c41','#b71c1c','#e53935','#fb8c00','#fdd835','#43a047','#1e88e5','#2e7dff','#8e24aa','#00acc1','#ffffff','#bdbdbd','#616161','#000000'];
export function normalizeAvatar(raw={}){
  const s={...defaultAvatar,...(raw.originalSet==='f2'?{body:1,shirt:2,eyes:5,mouth:0,hair:21}:{})};
  for(const [key,count] of Object.entries(avatarOptions)){
    if(raw[key]!==undefined){
      const n=Number(raw[key]);
      if(!Number.isInteger(n)||n<0||n>=count)throw Error('Opción de avatar no válida.');
      s[key]=n;
    }
  }
  for(const key of ['skin','eyeColor','hairColor','shirtColor','mouthColor','glassesColor','background']){
    if(raw[key]!==undefined){
      if(!/^#[0-9a-fA-F]{6}$/.test(raw[key]))throw Error('Color de avatar no válido.');
      s[key]=raw[key].toLowerCase();
    }
  }
  if(raw.originalSet!=null){if(!['f1','f2'].includes(raw.originalSet))throw Error('Conjunto de avatar no válido.');s.originalSet=raw.originalSet;}
  return s;
}
export function legacyAvatar(code){
  const presets={
    'classic-blue':{shirtColor:'#2d7fd6',hair:5},
    'classic-rose':{shirtColor:'#ef5350',mouthColor:'#ba253c',hair:11},
    'classic-gold':{shirtColor:'#f6d23e',hair:2},
    'classic-mint':{skin:'#b87d54',shirtColor:'#43a047',hair:14},
    'classic-lilac':{hairColor:'#5b3b7a',shirtColor:'#8e24aa',hair:6},
    'classic-sunset':{skin:'#d4a277',shirtColor:'#fb8c00',hair:10},
    'classic-ocean':{shirtColor:'#2f6aa7',hair:9},
    'classic-coral':{shirtColor:'#ef5350',hair:13}
  };
  return normalizeAvatar(presets[code]||{});
}
function baseLayer(s,slot){
 const src=originalLayer147(s,slot);if(!src)return '';
 const color=s[{body:'skin',shirt:'shirtColor',mouth:'mouthColor',eyes:'eyeColor',hair:'hairColor',glasses:'glassesColor'}[slot]];
 const id=`original-${slot}-${color.slice(1)}`;
 const rgb=[0,2,4].map(i=>parseInt(color.slice(1+i,3+i),16)/255);
 return `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feComponentTransfer>${['R','G','B'].map((c,i)=>`<feFunc${c} type="linear" slope="1" intercept="${rgb[i]}"/>`).join('')}</feComponentTransfer></filter></defs><image data-original-layer="${slot}" data-tint="${color}" href="${src}" xlink:href="${src}" width="200" height="230" preserveAspectRatio="none" filter="url(#${id})"/>`;
}
export function renderAvatar(raw={},overlays={}){
 const s=normalizeAvatar(raw);
 const root=content=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 230" width="200" height="230" role="img" aria-label="Avatar personalizado">${content}</svg>`;
 if(isPhotoAvatar(overlays.skin))return root(`<image href="${overlays.skin}" xlink:href="${overlays.skin}" width="200" height="230" preserveAspectRatio="xMidYMid slice"/>`).replace('<svg ','<svg data-avatar-mode="photo" ');
 const image=slot=>{if(!overlays[slot])return '';const fit=placementForDesign(overlays[slot]);return `<image data-owned-layer="${slot}" href="${overlays[slot]}" xlink:href="${overlays[slot]}" x="${fit.x}" y="${fit.y}" width="${fit.width}" height="${fit.height}" preserveAspectRatio="none"/>`;};
 let content=`<rect width="200" height="230" fill="${s.background}"/>${image('background')}`;
 if(overlays.skin){content+=image('skin');if(overlays._fullBody)return root(content);content+=image('shirt');}
 else content+=baseLayer(s,'body')+(overlays.shirt?image('shirt'):baseLayer(s,'shirt'));
 for(const slot of ['mouth','eyes','glasses','hair'])content+=overlays[slot]?image(slot):baseLayer(s,slot);
 return root(content);
}
