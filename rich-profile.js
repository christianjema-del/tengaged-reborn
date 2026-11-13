// V355: en la biografía, los enlaces a vídeos (YouTube, Vimeo o archivos .mp4/.webm) se ven como el vídeo,
// las imágenes y GIF como la imagen, y el resto de enlaces (https o http) se pueden pulsar.
const YT_ID=/^[A-Za-z0-9_-]{11}$/;
export function youtubeId(url){
 let u;try{u=new URL(url);}catch{return null;}
 const host=u.hostname.replace(/^(www\.|m\.|music\.)/,'');let id=null;
 if(host==='youtu.be')id=u.pathname.slice(1).split('/')[0];
 else if(host==='youtube.com'||host==='youtube-nocookie.com'){
  if(u.pathname==='/watch')id=u.searchParams.get('v');
  else{const m=u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);if(m)id=m[1];}
 }
 return id&&YT_ID.test(id)?id:null;
}
function youtubeStart(url){try{const u=new URL(url),t=u.searchParams.get('t')||u.searchParams.get('start')||'';const m=String(t).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);if(!m)return 0;return (Number(m[1]||0)*3600)+(Number(m[2]||0)*60)+Number(m[3]||0);}catch{return 0;}}
export function vimeoId(url){try{const u=new URL(url);if(!/^(www\.|player\.)?vimeo\.com$/.test(u.hostname))return null;const m=u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);return m?m[1]:null;}catch{return null;}}
const ext=(url,re)=>{try{return re.test(new URL(url).pathname);}catch{return false;}};
function frame(src,title){
 const box=document.createElement('div');box.className='bio-video';
 const f=document.createElement('iframe');f.src=src;f.title=title;f.loading='lazy';f.referrerPolicy='strict-origin-when-cross-origin';
 f.allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
 box.append(f);return box;
}
export function mediaFor(url){
 const yt=youtubeId(url);if(yt){const start=youtubeStart(url);return frame('https://www.youtube-nocookie.com/embed/'+yt+(start?'?start='+start:''),'Vídeo de YouTube');}
 const vm=vimeoId(url);if(vm)return frame('https://player.vimeo.com/video/'+vm,'Vídeo de Vimeo');
 if(url.startsWith('https://')&&ext(url,/\.(?:mp4|webm|mov|m4v)$/i)){const v=document.createElement('video');v.src=url;v.controls=true;v.preload='metadata';v.playsInline=true;v.className='bio-video-file';return v;}
 if(url.startsWith('https://')&&ext(url,/\.(?:png|jpe?g|gif|webp|avif)$/i)){const img=document.createElement('img');img.src=url;img.alt='Imagen de la biografía';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='bio-image';return img;}
 return null;
}
export function richText(root,text){
 root.replaceChildren();const pattern=/(https?:\/\/[^\s<>"]+|@[A-Za-z0-9_.-]{1,32})/g;let previous=0;
 for(const m of String(text||'').matchAll(pattern)){
  root.append(document.createTextNode(text.slice(previous,m.index)));let token=m[0];
  if(token.startsWith('@')){const a=document.createElement('a');const name=token.slice(1).replace(/[.-]+$/,'');a.href='/profile.html?username='+encodeURIComponent(name);a.textContent='@'+name;root.append(a,document.createTextNode(token.slice(name.length+1)));}
  else{
   // Signos de puntuación pegados al final del enlace se quedan como texto.
   const tail=(token.match(/[),.!?;:]+$/)||[''])[0];if(tail)token=token.slice(0,-tail.length);
   let valid=false;try{valid=['https:','http:'].includes(new URL(token).protocol);}catch{}
   const media=valid?mediaFor(token):null;
   if(media)root.append(media);
   else if(valid){const a=document.createElement('a');a.href=token;a.textContent=token;a.target='_blank';a.rel='noopener noreferrer nofollow';root.append(a);}
   else root.append(document.createTextNode(token));
   if(tail)root.append(document.createTextNode(tail));
  }
  previous=m.index+m[0].length;
 }
 root.append(document.createTextNode(String(text||'').slice(previous)));
}
