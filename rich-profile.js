export function richText(root,text){
 root.replaceChildren();const pattern=/(https:\/\/[^\s<>]+|@[A-Za-z0-9_.-]{1,32})/g;let previous=0;
 for(const m of text.matchAll(pattern)){
  root.append(document.createTextNode(text.slice(previous,m.index)));const token=m[0];
  if(token.startsWith('@')){const a=document.createElement('a');const name=token.slice(1).replace(/[.-]+$/,'');a.href='/profile.html?username='+encodeURIComponent(name);a.textContent='@'+name;root.append(a,document.createTextNode(token.slice(name.length+1)));}
  else{
   let image=false;try{image=/\.(?:png|jpe?g|gif|webp)$/i.test(new URL(token).pathname);}catch{}
   if(image){const img=document.createElement('img');img.src=token;img.alt='Imagen de la biografía';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='bio-image';root.append(img);}
   else{const a=document.createElement('a');a.href=token;a.textContent=token;a.target='_blank';a.rel='noopener noreferrer';root.append(a);}
  }
  previous=m.index+token.length;
 }
 root.append(document.createTextNode(text.slice(previous)));
}
