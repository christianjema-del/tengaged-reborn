import {$,el,api,post,link,title,form,action,tabs,comment,avatar,relative} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search),id=Number(params.get('id'))||0,view=params.get('view')||'home',topic=Number(params.get('topic'))||0;
const url='/api/groups'+(id?'?id='+id:'');
async function change(body){const r=await post(url,body);$('notice').textContent=r.message||'';await load();return r;}
const groupLink=(v='home',extra={})=>'/groups.html?'+new URLSearchParams({id,view:v,...extra});
async function load(){try{
 const data=await api(id?url+(topic?'&topic='+topic:''):'/api/groups?'+params),root=$('content');root.replaceChildren();
 if(!id){
  root.append(tabs([['Todos los grupos','/groups.html',params.get('tab')!=='mine'],['Mis grupos','/groups.html?tab=mine',params.get('tab')==='mine']]));
  root.append(form([{name:'q',label:'Buscar grupos',required:false,max:80,value:params.get('q')||''}],'Buscar',b=>location.assign('/groups.html?q='+encodeURIComponent(b.q))));
  const columns=el('div',undefined,'social-columns group-directory'),list=el('section'),side=el('aside');list.className='group-directory-cards';side.id='groupComposer';const create=action('Crear grupo',()=>{side.hidden=!side.hidden;create.setAttribute('aria-expanded',String(!side.hidden));});create.setAttribute('aria-expanded','false');root.append(create);side.hidden=true;
  for(const g of data.groups){const card=el('article',undefined,'social-group-card'),icon=el('div',g.name.slice(0,2).toUpperCase(),'social-group-emblem');card.append(icon,link(g.name,'/groups.html?id='+g.id,'social-group-title'),el('p',g.description),el('small',(g.admission==='open'?'Público':'Admisión privada')+' · '+g.members+' miembros · '+g.owner));list.append(card);}
  if(!data.groups.length)list.append(el('p','No hay grupos para esta búsqueda.'));
  side.append(title('Crear un grupo'));
  if(window.TengagedUser)side.append(form([{name:'name',label:'Nombre',max:60},{name:'description',label:'Descripción',type:'textarea',max:2000},{name:'admission',label:'Admisión',options:[['open','Abierto'],['private','Por solicitud']]}],'Crear grupo',async b=>{const r=await post('/api/groups',{action:'create',...b});location.assign('/groups.html?id='+r.id);}));
  else side.append(link('Inicia sesión para crear un grupo','/#login'));
  columns.append(list,side);root.append(columns);return;
 }
 const g=data.group,canWrite=data.is_owner||data.membership==='accepted';
 root.append(title(g.name),el('p',g.description,'social-description'));
 root.append(tabs([['Inicio',groupLink(),view==='home'],['Foro',groupLink('forum'),view==='forum'],['Encuestas',groupLink('polls'),view==='polls'],['Miembros',groupLink('members'),view==='members'],['Imágenes',groupLink('images'),view==='images'],['Todos los grupos','/groups.html',false]]));
 const info=el('div',undefined,'social-info');info.append(el('span','Por '+g.owner+' · '+(g.admission==='open'?'Grupo abierto':'Admisión privada')));
 if(window.TengagedUser&&!data.is_owner)info.append(action(data.membership==='accepted'?'Salir del grupo':data.membership==='pending'?'Cancelar solicitud':'Unirme al grupo',()=>change({action:data.membership?'leave':'join'})));
 root.append(info);
 if(!data.can_read){root.append(el('p','Debes ser aceptado para ver el foro y los contenidos de este grupo.'));return;}
 if(view==='home'||view==='forum'){
  root.append(title('Foro'));
  if(topic){
   const t=data.topics.find(t=>t.id===topic);
   if(t){root.append(el('h3',t.title),comment(t.author,t.body,t.created_at));for(const r of data.replies)root.append(comment(r.author,r.body,r.created_at));
    if(data.is_owner)root.append(action(t.locked?'Abrir tema':'Cerrar tema',()=>change({action:'lock',topic_id:t.id})));
    if(canWrite&&!t.locked)root.append(form([{name:'body',label:'Responder',type:'textarea',max:2000}],'Publicar respuesta',async(b,f)=>{await change({action:'reply',topic_id:topic,...b});f.reset();}));
    if(t.locked)root.append(el('p','Este tema está cerrado.'));
   }else root.append(el('p','Tema no encontrado.'));
  }else{
   for(const t of data.topics){const row=el('article',undefined,'social-topic');row.append(link(t.title,groupLink('forum',{topic:t.id})),el('small',t.author+' · '+t.replies+' respuestas · '+relative(t.created_at)+(t.locked?' · Cerrado':'')));root.append(row);}
   if(!data.topics.length)root.append(el('p','Todavía no hay temas.'));
   if(canWrite){root.append(title('Crear tema'));root.append(form([{name:'title',label:'Título',max:100},{name:'body',label:'Contenido',type:'textarea',max:4000}],'Publicar tema',async b=>{const r=await post(url,{action:'topic',...b});location.assign(groupLink('forum',{topic:r.topic}));}));}
  }
 }
 if(view==='home'||view==='polls'){
  root.append(title('Encuestas'));
  for(const p of data.polls){const card=el('article',undefined,'social-poll');card.append(el('h3',p.title));const total=p.votes.reduce((n,v)=>n+v.n,0);
   p.options.forEach((option,i)=>{const votes=p.votes.find(v=>v.choice===i)?.n||0,row=el('div',undefined,'poll-option'),progress=el('progress');progress.max=Math.max(1,total);progress.value=votes;row.append(el('span',option+' · '+votes+' votos'),progress);if(canWrite&&p.mine==null&&!p.closed)row.append(action('Votar',()=>change({action:'vote',poll_id:p.id,choice:i})));if(p.mine===i)row.append(el('small','Tu voto'));card.append(row);});
   card.append(el('small',total+' votos · '+(p.closed?'Cerrada':'Abierta')));
   if(data.is_owner&&!p.closed)card.append(action('Cerrar encuesta',()=>change({action:'close_poll',poll_id:p.id})));
   root.append(card);
  }
  if(!data.polls.length)root.append(el('p','No hay encuestas publicadas.'));
  if(canWrite){root.append(title('Nueva encuesta'));root.append(form([{name:'title',label:'Pregunta',max:150},{name:'options',label:'Opciones (una por línea, entre 2 y 8)',type:'textarea',max:640}],'Publicar encuesta',b=>change({action:'poll',title:b.title,options:b.options.split('\n').map(x=>x.trim()).filter(Boolean)})));}
 }
 if(view==='members'||view==='home'){
  root.append(title('Miembros'));
  for(const member of data.members){const row=el('div',undefined,'social-member');row.append(avatar(member.username),link(member.username,'/profile.html?username='+encodeURIComponent(member.username)),el('small',member.status==='pending'?'Solicitud pendiente':member.user_id===g.owner_id?'Propietario':'Miembro'));
   if(data.is_owner&&member.user_id!==g.owner_id){
    if(member.status==='pending')row.append(action('Aceptar',()=>change({action:'accept',user_id:member.user_id})));
    row.append(action(member.status==='pending'?'Rechazar':'Retirar',()=>change({action:'remove',user_id:member.user_id})));
    if(member.status==='accepted')row.append(action('Ceder administración',async()=>{if(confirm('¿Ceder la administración a '+member.username+'?'))await change({action:'transfer',user_id:member.user_id});}));
   }root.append(row);
  }
 }
 if(view==='images'||view==='home'){
  root.append(title('Imágenes'));const gallery=el('div',undefined,'social-gallery');
  for(const i of data.images){const f=el('figure'),img=el('img');img.src=i.image_data;img.alt=i.title;img.loading='lazy';f.append(img,el('figcaption',i.title));gallery.append(f);}root.append(gallery);
  if(!data.images.length)root.append(el('p','No hay imágenes todavía.'));
  if(canWrite){const f=form([{name:'title',label:'Título',max:100},{name:'image',label:'Imagen (PNG, JPG o WebP; hasta 256 KB)',type:'file'}],'Añadir imagen',async(b,formElement)=>{
   const file=formElement.elements.image.files[0];if(!file||file.size>262144)throw Error('Selecciona una imagen de hasta 256 KB.');
   const image_data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   await change({action:'image',title:b.title,image_data});
  });f.elements.image.accept='image/png,image/jpeg,image/webp';root.append(f);}
 }
 if(data.is_owner){root.append(title('Ajustes del grupo'));root.append(form([{name:'name',label:'Nombre',max:60,value:g.name},{name:'description',label:'Descripción',type:'textarea',max:2000,value:g.description},{name:'admission',label:'Admisión',value:g.admission,options:[['open','Abierto'],['private','Por solicitud']]}],'Guardar ajustes',b=>change({action:'edit',...b})));}
 }catch(e){$('notice').textContent=e.message;}}
window.TengagedSession.then(load).catch(e=>{$('notice').textContent=e.message||'No se pudo comprobar la sesión.';});
