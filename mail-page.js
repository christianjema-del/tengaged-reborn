import {$,el,api,post,link,title,action,form,tabs,pages,comment} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search),peer=params.get('with')||'',folder=params.get('folder')||'inbox',page=Number(params.get('page'))||1;
async function load(){try{
 const data=await api('/api/mail?'+params),root=$('content');root.replaceChildren(tabs([['Recibidos ('+data.unread+')','/mail.html',folder!=='sent'&&!peer],['Enviados','/mail.html?folder=sent',folder==='sent'],['Nuevo mensaje','#compose',false]]));
 const toolbar=el('div',undefined,'mail-toolbar296'),refresh=el('button','Actualizar bandeja','plain-btn');refresh.type='button';refresh.onclick=load;toolbar.append(refresh);
 if(data.unread>0){const readAll=el('button','✓ Marcar todos como leídos','market-btn mail-read-all296');readAll.type='button';readAll.onclick=async()=>{readAll.disabled=true;try{const r=await post('/api/mail',{action:'read_all'});$('notice').textContent=r.message;window.TengagedSetUnread?.(0);document.dispatchEvent(new Event('tengaged:mail-changed'));await load();}catch(error){$('notice').textContent=error.message;readAll.disabled=false;}};toolbar.append(readAll);}
 root.append(toolbar);
 if(data.peer&&!data.peer_system){root.append(title('Conversación con '+data.peer));root.append(action(data.blocks.some(x=>x.username===data.peer)?'Desbloquear usuario':'Bloquear usuario',async()=>{const r=await post('/api/mail',{action:data.blocks.some(x=>x.username===data.peer)?'unblock':'block',recipient:data.peer});$('notice').textContent=r.message;await load();}));}
 if(!data.messages.length)root.append(el('p','No hay mensajes en esta carpeta.'));
 window.TengagedSetUnread?.(data.unread);
 for(const m of data.messages){
  const own=m.recipient===window.TengagedUser?.username,row=el('details',undefined,'mail-message'+(own&&!m.read_at?' mail-unread':'')),summary=el('summary'),heading=el('strong',m.subject),state=el('span',m.read_at?'Leído':own?'Sin leer':'Enviado','mail-read-state');
  summary.append(heading,el('span',m.sender+' → '+m.recipient,'mail-envelope'),state);row.append(summary);
  const content=comment(m.sender,m.body,m.created_at);content.classList.add('mail-open-body');row.append(content);
  if(m.system_sender&&(m.system_event||'').startsWith('admin-notice:'))content.append(el('strong','Aviso de la administración de Tengaged','system-account-label'));
  else if(m.system_sender){content.append(el('strong','Aviso automático de Tengaged','system-account-label'));const shortcuts=el('div',undefined,'social-actions');if((m.system_event||'').startsWith('daily-reward:'))shortcuts.append(link('Ver mi perfil','/profile.html'));else{shortcuts.append(link('Editar avatar','/avatar.html'));if((m.system_event||'').startsWith('gift:'))shortcuts.append(link('Ver mis regalos','/gifts.html'));else shortcuts.append(link('Cómo jugar','/help.html'),link('Elegir partida','/games.html'));}content.append(shortcuts);}
  if(!m.system_sender)content.append(link('Ver conversación','/mail.html?with='+encodeURIComponent(m.sender===window.TengagedUser?.username?m.recipient:m.sender)));
  let reading=false;const readStatus=el('p','', 'mail-read-status');readStatus.setAttribute('role','status');content.append(readStatus);
  async function markRead(){if(reading||!own||m.read_at||!row.open)return;reading=true;try{const result=await post('/api/mail',{action:'read',id:m.id});m.read_at=new Date().toISOString();state.textContent='Leído';row.classList.remove('mail-unread');readStatus.replaceChildren();window.TengagedSetUnread?.(result.unread);const inbox=root.querySelector('nav a[href="/mail.html"]');if(inbox)inbox.textContent='Recibidos ('+result.unread+')';document.dispatchEvent(new Event('tengaged:mail-changed'));}catch(error){readStatus.replaceChildren(el('span',error.message));const retry=el('button','Reintentar marcar como leído');retry.type='button';retry.onclick=markRead;readStatus.append(retry);}finally{reading=false;}}
  row.addEventListener('toggle',()=>{if(row.open)markRead();});root.append(row);
 }
 root.append(pages(data.page,data.total,20,p=>'/mail.html?'+new URLSearchParams({...Object.fromEntries(params),page:p})));
 if(data.peer_system){root.append(el('p','Tengaged solo envía avisos automáticos y no recibe respuestas.'));return;}
 const compose=el('section');compose.id='compose';compose.append(title('Escribir un mensaje'));
 compose.append(form([{name:'recipient',label:'Destinatario',max:32,value:peer},{name:'subject',label:'Asunto',max:100},{name:'body',label:'Mensaje',type:'textarea',max:4000}], 'Enviar mensaje',async(body,f)=>{const r=await post('/api/mail',{action:'send',...body});$('notice').textContent=r.message;f.reset();await load();}));root.append(compose);
 if(data.blocks.length){root.append(title('Usuarios bloqueados'));for(const user of data.blocks)root.append(action('Desbloquear a '+user.username,async()=>{await post('/api/mail',{action:'unblock',recipient:user.username});await load();}));}
 }catch(e){$('notice').textContent=e.message;$('content').replaceChildren(el('p','El correo requiere iniciar sesión.'));}}
window.TengagedSession.then(load).catch(e=>{$('notice').textContent=e.message||'No se pudo comprobar la sesión.';});
