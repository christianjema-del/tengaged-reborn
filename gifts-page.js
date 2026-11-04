import {$,el,api,link,title,tabs,pages,relative} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search),owned=params.get('view')==='owned';
async function load(){try{
 const me=await window.TengagedSession,name=params.get('username')||me?.username;
 if(!name)throw Error('Selecciona un usuario desde su perfil.');
 const data=await api('/api/profile-extras?username='+encodeURIComponent(name)),root=$('content');
 const href=(view,page=1)=>'/gifts.html?'+new URLSearchParams({username:data.username,view,page});
 root.replaceChildren(title(data.username),link('Volver al perfil','/profile.html?username='+encodeURIComponent(data.username)),tabs([['Regalos ('+data.gift_count+')',href('gifts'),!owned],['Diseños adquiridos ('+data.owned_count+')',href('owned'),owned]]));
 const grid=el('div',undefined,'gift-gallery'),items=owned?data.owned:data.gifts;
 for(const d of items){
  const card=el('article',undefined,'gift-card'),a=link('','/designs.html?id='+d.id);
  if(d.has_image){const img=el('img');img.src='/api/design-image?v=38&id='+d.id;img.alt=d.title;img.loading='lazy';a.append(img);}
  a.append(el('h3',d.title));card.append(a);
  if(owned){card.append(el('small','Adquirido '+relative(d.purchased_at)));if(d.is_equipped)card.append(el('strong','Equipado'));}
  else{const from=el('p','De ');from.append(link(d.sender,'/profile.html?username='+encodeURIComponent(d.sender)));card.append(from,el('small',relative(d.created_at)));if(d.message)card.append(el('p',d.message,'gift-dedication'));}
  grid.append(card);
 }
 root.append(grid);if(!items.length)root.append(el('p',owned?'Todavía no tiene diseños adquiridos.':'Todavía no ha recibido regalos.'));
 root.append(pages(data.page,owned?data.owned_count:data.gift_count,20,p=>href(owned?'owned':'gifts',p)));
 if(data.self)root.append(link('Probar y equipar mis diseños →','/avatar.html','market-btn'));
 }catch(e){$('notice').textContent=e.message;}}
load();
