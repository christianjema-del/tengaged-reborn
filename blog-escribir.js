import {syncAvatarPreview} from '/avatar-preview290.js?v=337';
// Página propia para escribir o editar un blog, con fotos del dispositivo.
import {$,el,api,post,buttonTask,loginLink} from '/market-ui.js?v=170';
import {link,avatar} from '/community-ui.js?v=337';
import {blogHref162,authorHref162} from '/blog-routing162.js?v=165';
const MAX_PHOTOS=8,MAX_SIDE=1400,MAX_CHARS=1100000,editId=Number(new URLSearchParams(location.search).get('editar'))||0,form=$('blogWriteForm');
let photos=[],author='';
const photoToken=id=>'[foto:'+id+']';
function renderPhotos(){$('blogPhotos').replaceChildren(...photos.map(id=>{const box=el('figure'),img=el('img'),remove=el('button','Quitar');img.src='/api/blog-image?id='+id;img.alt='Foto adjunta';remove.type='button';remove.onclick=()=>{photos=photos.filter(x=>x!==id);renderPhotos();};box.append(img,remove);return box;}));$('blogPhotoPick').hidden=photos.length>=MAX_PHOTOS;}
// Reduce la foto en el navegador para que quepa en la base de datos.
async function shrink(file){
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('No se pudo leer '+file.name+'. Usa una foto JPG, PNG o WebP.'));i.src=url;});
  const scale=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [.85,.7,.55,.4]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=MAX_CHARS)return data;}
  throw Error(file.name+' es demasiado grande.');
 }finally{URL.revokeObjectURL(url);}
}
$('blogPhotoInput').onchange=async event=>{
 const input=event.target,files=[...input.files].slice(0,MAX_PHOTOS-photos.length);input.disabled=true;$('blogNotice').textContent=files.length?'Subiendo fotos…':'';
 try{for(const file of files){const {id}=await post('/api/blog-image',{image:await shrink(file)});photos.push(id);renderPhotos();}$('blogNotice').textContent='';}
 catch(e){$('blogNotice').textContent=e.message;}
 finally{input.disabled=false;input.value='';}
};
form.onsubmit=e=>{
 e.preventDefault();
 buttonTask($('blogPublish'),async()=>{
  const data=new FormData(form),text=String(data.get('body')||'').trim(),body=[text,photos.map(photoToken).join('\n')].filter(Boolean).join('\n\n');
  if(!body){$('blogNotice').textContent='Escribe el texto o adjunta una foto.';return;}
  const title=String(data.get('title')).trim(),result=await post('/api/blog',editId?{action:'edit',post_id:editId,title,body}:{title,body});
  await syncAvatarPreview(author,{force:true}).catch(()=>{});
  location.assign(blogHref162({author,title,id:editId||result.id}));
 },$('blogNotice'));
};
async function sidePanel(name){
 const root=$('authorBlog'),banner=el('div',undefined,'author-blog-banner'),picture=link('','/profile.html?username='+encodeURIComponent(name),'author-blog-portrait'),img=avatar(name),h=el('h3'),list=el('ol',undefined,'author-blog-list');
 img.width=140;img.height=161;picture.append(img);banner.append(link('mi blog',authorHref162(name),'author-blog-mark'),picture);
 h.append(document.createTextNode('El blog de '+name),link('Blog',authorHref162(name),'author-blog-all'));root.replaceChildren(banner,h,list);
 try{const d=await api('/api/blog?author='+encodeURIComponent(name)+'&page_size=40');for(const p of d.posts){const li=el('li'),a=link(p.title,blogHref162(p),'author-blog-entry');a.title=p.title;li.append(a);list.append(li);}}catch{}
}
async function loadEdit(user){
 const d=await api('/api/blog?id='+editId),p=d.posts[0];
 if(!p)throw Error('Este blog no existe o ha sido eliminado.');
 if(p.author.toLowerCase()!==user.username.toLowerCase()&&!user.is_admin)throw Error('Solo puedes editar tus propios blogs.');
 author=p.author;form.elements.title.value=p.title;photos=[...p.body.matchAll(/\[foto:(\d+)\]/g)].map(m=>Number(m[1]));form.elements.body.value=p.body.replace(/\s*\[foto:\d+\]/g,'').trim();renderPhotos();
 $('blogWriteTitle').textContent='Editar blog';$('blogPublish').textContent='Guardar cambios';document.title='Editar blog · Tengaged Reborn';
}
Promise.resolve(window.TengagedSession).catch(()=>null).then(async user=>{
 if(!user){$('blogLogin').replaceChildren(loginLink('Entrar para publicar'));return;}
 author=user.username;
 try{if(editId)await loadEdit(user);form.hidden=false;form.elements.title.focus();sidePanel(author);}
 catch(e){$('blogNotice').textContent=e.message;}
});
