import {api,el,link,title,avatar,relative} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search);
async function load(){try{
 const requested=params.get('username');const me=requested?null:await window.TengagedSession,name=requested||me?.username;if(!name)return;
 const data=await api('/api/profile-extras?username='+encodeURIComponent(name));
 const badge=document.getElementById('profileGiftLink');badge.href='/gifts.html?username='+encodeURIComponent(data.username);const count=Math.max(0,Number(data.gift_count)||0);document.getElementById('profileGiftCount').textContent=String(count);badge.setAttribute('aria-label','Ver '+count+(count===1?' regalo recibido':' regalos recibidos'));badge.title=count+(count===1?' regalo recibido':' regalos recibidos');
 const groups=document.getElementById('profileGroups');groups.replaceChildren();
 for(const g of data.groups)groups.append(link(g.name,'/groups.html?id='+g.id));
 if(!data.groups.length)groups.textContent=data.self?'Todavía no perteneces a ningún grupo.':'No hay grupos públicos para mostrar.';
 const mentions=document.getElementById('profileMentions');mentions.replaceChildren();
 for(const p of data.mentions){const row=el('div',undefined,'activity-entry');row.append(link(p.title,'/blogs?id='+p.id));const meta=el('small'),person=link(p.author,'/profile.html?username='+encodeURIComponent(p.author));meta.append(document.createTextNode(' · '),person,document.createTextNode(' · '+relative(p.created_at)));row.append(meta);mentions.append(row);}
 if(!data.mentions.length)mentions.append(el('p','Todavía no hay menciones en blogs.'));
 const edit=document.getElementById('profileEditLink');if(edit)edit.hidden=!data.self;
 }catch(e){const badge=document.getElementById('profileGiftLink');if(badge){badge.setAttribute('aria-label','Ver regalos recibidos: contador no disponible');badge.title='Ver regalos recibidos: contador temporalmente no disponible';}}}
load();setInterval(()=>{if(!document.hidden)load();},30000);
