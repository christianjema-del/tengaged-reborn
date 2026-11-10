import {setAvatar} from '/avatar-display.js?v=337';
import {$,el,api,form,link,title,date} from '/community-ui.js?v=337';
import {richText} from '/rich-profile.js?v=159';
async function load(){try{
 const me=await window.TengagedSession;if(!me)throw Error('Inicia sesión para editar tu perfil.');
 const [profile,extra]=await Promise.all([api('/api/profile?username='+encodeURIComponent(me.username)),api('/api/profile-extras?username='+encodeURIComponent(me.username))]),root=$('content');
 root.replaceChildren(title('Editar mi perfil'),link('← Volver al perfil','/profile.html?username='+encodeURIComponent(me.username)));
 const image=el('img');setAvatar(image,me.username);image.alt='Tu avatar actual';image.className='profile-edit-avatar';
 const avatarLink=link('','/avatar.html');avatarLink.append(image,el('span','Personalizar avatar →'));root.append(avatarLink);
 root.append(el('p','Usuario: '+me.username),el('small','El nombre de usuario identifica tus partidas y tu historial.'));
 root.append(title('Biografía'));
 const preview=el('div',undefined,'bio bio-preview');richText(preview,profile.profile.bio||'');
 const f=form([{name:'bio',label:'Sobre mí (hasta 1.000 caracteres). Puedes incluir enlaces HTTPS a imágenes o GIF.',type:'textarea',required:false,max:1000,value:profile.profile.bio||''}],'Guardar biografía',async b=>{const r=await api('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({bio:b.bio})});$('notice').textContent=r.message;});
 const count=el('small'),input=f.elements.bio;const update=()=>{count.textContent=input.value.length+'/1000';richText(preview,input.value);};input.oninput=update;update();
 root.append(f,count,el('h3','Vista previa de la biografía'),preview,title('Colores desbloqueados'));
 for(const c of extra.colors){const row=el('p',c.name+(c.is_equipped?' · En uso':'')+' · '+date(c.purchased_at));root.append(row);}
 if(!extra.colors.length)root.append(el('p','Todavía no has comprado tarjetas de color.'));
 root.append(link('Ver tienda de colores →','/shops.html?tab=cards'));
 }catch(e){$('notice').textContent=e.message;}}
load();
