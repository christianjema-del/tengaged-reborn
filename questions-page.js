import {$,el,api,post,title,form,action,comment,link} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search);
async function load(){try{
 const data=await api('/api/questions?'+params),root=$('content');root.replaceChildren(title('Pregúntame · '+data.target),link('Volver al perfil','/profile.html?username='+encodeURIComponent(data.target)));
 if(window.TengagedUser&&!data.is_owner)root.append(form([{name:'question',label:'Tu pregunta',type:'textarea',max:500}], 'Enviar pregunta',async(body,f)=>{const r=await post('/api/questions?user='+encodeURIComponent(data.target),{action:'ask',...body});$('notice').textContent=r.message;f.reset();await load();}));
 if(!data.questions.length)root.append(el('p','Todavía no hay preguntas publicadas.'));
 for(const q of data.questions){
  const row=comment(q.asker,q.question,q.created_at);
  if(q.answer)row.append(comment(data.target,q.answer,q.answered_at));else row.append(el('small','Pendiente de respuesta; solo visible para quien pregunta y quien responde.'));
  if(data.is_owner){
   row.append(form([{name:'answer',label:'Tu respuesta',type:'textarea',value:q.answer||'',max:2000}],q.answer?'Actualizar respuesta':'Publicar respuesta',async(body)=>{const r=await post('/api/questions?user='+encodeURIComponent(data.target),{action:'answer',id:q.id,...body});$('notice').textContent=r.message;await load();}));
   row.append(action('Retirar pregunta',async()=>{if(!confirm('¿Retirar esta pregunta?'))return;await post('/api/questions?user='+encodeURIComponent(data.target),{action:'remove',id:q.id});await load();}));
  }root.append(row);
 }
 }catch(e){$('notice').textContent=e.message;}}
window.TengagedSession.then(load).catch(e=>{$('notice').textContent=e.message||'No se pudo comprobar la sesión.';});
