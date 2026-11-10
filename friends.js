import {enableFriendDrag231} from '/friend-drag231.js?v=231';
import {request as fetch} from '/http.js?v=170';
import {setAvatar} from '/avatar-display.js?v=337';
import {canDragFriends333,enableGridSort333,moveFriend333,moveToPage333} from '/friend-sort333.js?v=333';
const root=document.getElementById('profileCommunity');let editingOrder=false,currentPage=1;
async function load(){const username=new URLSearchParams(location.search).get('username')||'';try{
 const response=await fetch('/api/friends?username='+encodeURIComponent(username),{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.message);document.getElementById("friendsTitle").textContent="Amigos";root.replaceChildren();
 const status=document.createElement('p');status.setAttribute('role','status');
 function button(label,action,target=username){const b=document.createElement('button');b.textContent=label;b.type='button';b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/friends?username='+encodeURIComponent(target),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})}),d=await r.json();if(!r.ok)throw Error(d.message);await load();}catch(e){status.textContent=e.message;b.disabled=false;}};return b;}
 const controls=document.createElement('div');controls.className='friend-controls';const actionHost=document.getElementById('profileFriendControls');
 if(data.loggedIn&&!data.self&&!data.target_system){const added=data.added??['accepted','outgoing'].includes(data.relation);controls.append(button(added?'Quitar de mis amigos':'Añadir a amigos',added?'remove':'add'));}
 if(actionHost){actionHost.replaceChildren();for(const b of controls.children){const label=b.textContent;b.setAttribute('aria-label',label);b.title=label;b.className='profile-square-button';b.textContent=label==='Añadir a amigos'?'＋':'✓';}actionHost.append(controls);if(data.self){const edit=document.createElement('a');edit.href='/profile-edit.html';edit.className='profile-square-button';edit.textContent='✎';edit.title='Editar mi perfil';edit.setAttribute('aria-label','Editar mi perfil');actionHost.append(edit);}else if(!data.loggedIn){const login=document.createElement('a');login.href='/?next=profile.html#login';login.className='profile-square-button';login.textContent='＋';login.title='Inicia sesión para añadir a amigos';login.setAttribute('aria-label',login.title);actionHost.append(login);}}
 else root.append(controls);
 const message=document.getElementById('profileMessageButton');if(message){message.hidden=data.self||!data.loggedIn||data.target_system;message.href='/mail.html?with='+encodeURIComponent(username||document.getElementById('username')?.textContent||'');}root.append(status);
 const card=root.closest?.('.friend-card');card?.querySelector('.friends-heading-tools')?.remove();
 const tools=document.createElement('div');tools.className='friends-heading-tools';
 const activityButton=document.createElement('button');activityButton.type='button';activityButton.className='friends-activity-toggle';activityButton.textContent='Actividad de tus amigos NEW!';activityButton.setAttribute('aria-expanded','false');tools.append(activityButton);
 const pages=document.createElement('nav');pages.className='friends-pages';pages.setAttribute('aria-label','Páginas de amigos');tools.append(pages);
 const list=document.createElement('div');list.className='friend-grid';
 const activity=document.createElement('section');activity.className='friends-activity';activity.hidden=true;
 const heading=document.createElement('h3');heading.textContent='Actividad de tus amigos';activity.append(heading);
 for(const post of data.activity||[]){const row=document.createElement('p'),a=document.createElement('a');a.href='/blogs?id='+encodeURIComponent(post.id);a.textContent=post.username+': '+post.title;row.append(a);activity.append(row);}
 if(!(data.activity||[]).length){const p=document.createElement('p');p.textContent='Todavía no hay publicaciones recientes de estos amigos.';activity.append(p);}
 activityButton.onclick=()=>{activity.hidden=!activity.hidden;activityButton.setAttribute('aria-expanded',String(!activity.hidden));};
 function drawFriends(){
  const count=Math.max(1,Math.ceil(data.friends.length/15));currentPage=Math.min(Math.max(1,currentPage),count);pages.replaceChildren();list.replaceChildren();
  for(let i=1;i<=count;i++){const b=document.createElement('button');b.type='button';b.textContent=String(i);b.setAttribute('aria-label','Página '+i+' de amigos');b.dataset.page=String(i);if(i===currentPage)b.setAttribute('aria-current','page');b.onclick=()=>{currentPage=i;drawFriends();};pages.append(b);}
  for(const friend of data.friends.slice((currentPage-1)*15,currentPage*15)){const a=document.createElement('a');a.href='/profile.html?username='+encodeURIComponent(friend.username);a.className='friend-person'+(friend.mutual?' mutual':'');a.dataset.friend=friend.username;a.title=friend.username+(friend.mutual?' · Os habéis añadido mutuamente':'');const img=document.createElement('img');setAvatar(img,friend.username);img.alt='Avatar de '+friend.username;img.loading='lazy';const name=document.createElement('span');name.className='friend-name';name.textContent=friend.username;a.append(img,name);list.append(a);}
  if(data.self&&data.friends.length>1&&canDragFriends333())enableGridSort333(list,pages,{onMove:(name,target,after)=>saveOrder333(moveFriend333(data.friends.map(f=>f.username),name,target,after)),onPage:(name,page)=>{currentPage=page;saveOrder333(moveToPage333(data.friends.map(f=>f.username),name,page,15));}});
  if(!data.friends.length){const empty=document.createElement('p');empty.className='friends-empty';empty.textContent=data.self?'Todavía no tienes amigos. Visita un perfil para añadirlo a tu lista.':'Este usuario todavía no tiene amigos.';list.append(empty);}
 }
 // V333: guarda el orden nuevo al soltar un amigo arrastrado (PC).
 async function saveOrder333(order){
  const before=data.friends.slice(),byName=new Map(before.map(f=>[f.username,f]));data.friends=order.map(n=>byName.get(n)).filter(Boolean);drawFriends();status.textContent='Guardando el orden…';editingOrder=true;
  try{const r=await fetch('/api/friends?username='+encodeURIComponent(username),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reorder',usernames:order})}),d=await r.json();if(!r.ok)throw Error(d.message||'No se pudo guardar el orden.');status.textContent='Orden de amigos guardado.';}
  catch(e){data.friends=before;drawFriends();status.textContent=e.message;}finally{editingOrder=false;}
 }
 drawFriends();if(card)card.insertBefore(tools,root);else root.append(tools);root.append(list,activity);
 if(data.self&&data.friends.length>1&&canDragFriends333()){const hint=document.createElement('p');hint.className='friends-drag-hint333';hint.textContent='Arrastra a tus amigos para cambiar el orden. Suéltalos sobre un número para llevarlos a esa página.';root.append(hint);}
 
 if(data.self&&data.friends.length>1&&!canDragFriends333()){
  const reorder=document.createElement('button');reorder.type='button';reorder.textContent='Ordenar amigos';
  reorder.onclick=()=>{
   editingOrder=true;reorder.disabled=true;let order=data.friends.map(f=>f.username);
   const panel=document.createElement('div');panel.className='friend-reorder-list';
   function drawOrder(){
    panel.replaceChildren();
    order.forEach((name,index)=>{
     const row=document.createElement('div');row.className='friend-reorder-row';const label=document.createElement('span');label.textContent=name;const avatar=document.createElement('img');avatar.alt='Avatar de '+name;avatar.width=40;avatar.height=46;setAvatar(avatar,name);avatar.draggable=false;const handle=document.createElement('span');handle.className='friend-drag-handle231';handle.title='Arrastra el avatar para cambiar su posición';handle.append(avatar);row.append(handle,label);enableFriendDrag231(row,handle,name,(from,to)=>{const a=order.indexOf(from),b=order.indexOf(to);if(a<0||b<0||a===b)return;order.splice(b,0,order.splice(a,1)[0]);drawOrder();});
     for(const [symbol,delta] of [['↑',-1],['↓',1]]){
      const b=document.createElement('button');b.type='button';b.textContent=symbol;b.setAttribute('aria-label',(delta<0?'Subir a ':'Bajar a ')+name);b.disabled=index+delta<0||index+delta>=order.length;
      b.onclick=()=>{[order[index],order[index+delta]]=[order[index+delta],order[index]];drawOrder();};row.append(b);
     }panel.append(row);
    });
    const save=document.createElement('button'),cancel=document.createElement('button');save.type=cancel.type='button';save.textContent='Guardar orden';cancel.textContent='Cancelar';
    save.onclick=async()=>{save.disabled=true;cancel.disabled=true;try{
     const response=await fetch('/api/friends?username='+encodeURIComponent(username),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reorder',usernames:order})}),result=await response.json();
     if(!response.ok)throw Error(result.message);editingOrder=false;await load();
    }catch(e){status.textContent=e.message;save.disabled=false;cancel.disabled=false;}};
    cancel.onclick=()=>{editingOrder=false;load();};panel.append(save,cancel);
   }
   drawOrder();const hint=document.createElement('p');hint.textContent='Arrastra los avatares o usa las flechas. Pulsa Guardar orden al terminar.';root.append(hint,panel);
  };root.append(reorder);
 }

 }catch(e){root.textContent=e.message;}}
load();setInterval(()=>{if(!document.hidden&&!editingOrder&&!root.contains(document.activeElement))load();},60000);
