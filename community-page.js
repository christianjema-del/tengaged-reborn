import {$,el,api,link,title,avatar,relative,comment,form} from '/community-ui.js?v=170';
const params=new URLSearchParams(location.search);
async function load(){try{
 const data=await api('/api/community-feed?'+params),root=$('content');root.replaceChildren();
 root.append(form([{name:'q',label:'Buscar jugadores',required:false,max:32,value:params.get('q')||''}],'Buscar',body=>{location.assign('/community.html?q='+encodeURIComponent(body.q));}));
 const layout=el('div',undefined,'social-columns'),main=el('section'),aside=el('aside');
 main.append(title('Jugadores · '+data.online+' conectados'));
 const grid=el('div',undefined,'social-user-grid');
 for(const u of data.users){const card=el('article',undefined,'social-user');card.append(avatar(u.username),link(u.username,'/profile.html?username='+encodeURIComponent(u.username)),el('small',u.karma+' karma · '+(u.last_seen_at?relative(u.last_seen_at):'Sin actividad reciente')));grid.append(card);}main.append(grid);
 aside.append(title('Últimos comentarios en juegos'));
 for(const m of data.messages){const [type,id]=m.room.split(':'),row=m.kind==='event'?el('article',m.body,'community-game-notice'):comment(m.username,m.body,m.created_at);row.append(link((type==='casting'?'Casting':type==='frookies'?'Frookies':'Hunger Games')+' #'+id,type==='casting'?'/casting-game.html?id='+id:type==='frookies'?'/frookies.html?id='+id:'/hunger.html?edition='+id));aside.append(row);}
 if(!data.messages.length)aside.append(el('p','Todavía no hay comentarios.'));
 layout.append(main,aside);root.append(layout);
 }catch(e){$('notice').textContent=e.message;}}
window.TengagedSession.then(load).catch(e=>{$('notice').textContent=e.message||'No se pudo comprobar la sesión.';});
