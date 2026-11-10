import {api,el,link,title,avatar} from '/community-ui.js?v=337';
const root=document.getElementById('communityGroups');
async function load(){try{
 const data=await api('/api/groups'),section=el('section');section.append(title('Grupos de la comunidad'),link('Ver todos →','/groups.html'));
 for(const g of data.groups.slice(0,4)){
  const row=el('article',undefined,'social-group-card');row.append(el('div',g.name.slice(0,2).toUpperCase(),'social-group-emblem'),link(g.name,'/groups.html?id='+g.id,'social-group-title'),el('small',' · '+g.members+' miembros · '+g.owner),el('p',g.description.slice(0,180)));section.append(row);
 }
 if(!data.groups.length)section.append(el('p','Todavía no hay grupos. Puedes crear el primero.'));
 root.replaceChildren(section);
 }catch{root.replaceChildren(el('p','No se pudieron consultar los grupos.'));}}
load();
