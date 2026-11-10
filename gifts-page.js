// V299: réplica de la página de regalos clásica (/gifts/usuario). Solo se listan los regalos recibidos.
import {$,el,api} from '/community-ui.js?v=337';
import {setAvatar} from '/avatar-display.js?v=337';
import {pageList} from '/gifts-pages301.js?v=301';
const params=new URLSearchParams(location.search);
const profile=name=>'/profile.html?username='+encodeURIComponent(name);
const shopHref=owner=>'/shops.html?'+new URLSearchParams({tab:'users',owner});
function a(text,href,cls){const x=el('a',text,cls);x.href=href;return x;}
function gift(d){
 const li=el('li'),img=el('img');img.alt=d.title;img.loading='lazy';img.src=d.has_image?'/api/design-image?v=38&id='+d.id:'/assets/reference/shops.jpg';
 const msg=el('div',undefined,'message big'),head=el('div','De ','header');
 head.append(a(d.sender,profile(d.sender)));
 if(d.shop_name){head.append(' comprado en la tienda ');const strong=el('strong');strong.append(d.shop_owner?a(d.shop_name,shopHref(d.shop_owner)):d.shop_name);head.append(strong);}
 msg.append(head,document.createTextNode(String(d.message||'').trim()||'Te quiero...'));
 li.append(img,msg);return li;
}
function shop(s){
 const link=a('',s.owner?shopHref(s.owner):'/shops.html?tab=users','inlineshop');link.title=s.name;
 if(s.has_image){const img=el('img');img.src='/api/player-shops?image='+s.id;img.alt=s.name;img.loading='lazy';link.append(img);}
 else link.append(el('span',s.name,'inlineshop-name'));
 return link;
}
// V301: paginador clásico (div.paginator) al final de la línea de «Últimos regalos recibidos».
function paginator(page,total,href){
 const box=el('div',undefined,'paginator h2');
 for(const p of pageList(page,total)){if(p==='…'){box.append(el('span','…','gap'));continue;}const link=a(String(p),href(p),p===page?'gpage showing':'gpage');if(p===page)link.setAttribute('aria-current','page');box.append(link);}
 return box;
}
function giver(g,i){
 const row=el('div',undefined,'gifts299-giver'),link=a('',profile(g.username)),img=el('img');link.title=g.username;
 img.width=65;img.height=75;img.alt=g.username;img.loading='lazy';setAvatar(img,g.username);
 link.append(el('em',(i+1)+'°','gifts299-rank'),img,el('span',g.username));
 row.append(link,el('strong',String(g.gifts)));row.title=g.username+' ha hecho '+g.gifts+(g.gifts===1?' regalo':' regalos');
 return row;
}
async function load(){try{
 const me=await window.TengagedSession,name=params.get('username')||me?.username;
 if(!name)throw Error('Selecciona un usuario desde su perfil.');
 const wanted=Math.max(1,Math.floor(Number(params.get('page'))||1));
 const data=await api('/api/profile-extras?'+new URLSearchParams({view:'gifts',username:name,page:wanted})),root=$('content');
 const size=Number(data.page_size)||20,pagesTotal=Math.max(1,Math.ceil((Number(data.gift_count)||0)/size)),current=Math.min(Number(data.page)||1,pagesTotal);
 const pageHref=p=>'/gifts.html?'+new URLSearchParams({username:data.username,...(p>1?{page:p}:{})});
 document.title='Regalos de '+data.username+' · Tengaged Reborn';
 const left=el('div',undefined,'inuser-left'),header=el('div',undefined,'user-header'),av=el('div',undefined,'user-avatar'),pic=a('',profile(data.username),'avatarpic'),img=el('img');
 img.width=110;img.height=126;img.alt=data.username;setAvatar(img,data.username);pic.title=data.username;pic.append(img);av.append(pic);
 const info=el('div',undefined,'user-info'),count=el('span','Núm. de regalos: ','small');count.append(el('span',String(data.gift_count),'remark'));
 info.append(el('h1',data.username),count);header.append(av,info);
 const details=el('div',undefined,'user-details'),h2=el('h2','Últimos regalos recibidos');h2.append(a('Ir al perfil',profile(data.username),'action'));if(pagesTotal>1){h2.classList.add('gifts299-paged');h2.append(paginator(current,pagesTotal,pageHref));}
 const list=el('ol',undefined,'gifts');for(const d of data.gifts||[])list.append(gift(d));
 details.append(h2,list);if(!(data.gifts||[]).length)details.append(el('p',data.gift_count>0?'No hay regalos en esta página.':'Todavía no ha recibido regalos.','gifts299-empty'));
 left.append(header,details);
 const right=el('div',undefined,'inuser-right'),h3=el('h3','Envíame un regalo');h3.append(a('Juego de compras','/shops.html?tab=users','action'));
 const shops=el('div');for(const s of data.shops||[])shops.append(shop(s));
 right.append(h3,shops,el('div',undefined,'gifts299-clear'));if(!(data.shops||[]).length)right.append(el('p','Ahora mismo no hay tiendas abiertas.','gifts299-empty'));
 const top=el('section',undefined,'gifts299-top');top.append(el('h3','Los que más me regalan'));
 const givers=data.givers||[];if(givers.length)givers.forEach((g,i)=>top.append(giver(g,i)));else top.append(el('p','Todavía nadie le ha hecho regalos.','gifts299-empty'));
 right.append(top);
 root.replaceChildren(left,right,el('div',undefined,'gifts299-clear'));
 }catch(e){$('notice').textContent=e.message;$('content').textContent='';}}
load();
