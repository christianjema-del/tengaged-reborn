import {COLOR_LEVELS} from '/color-level-catalog.js?v=159';
import {request as fetch} from '/http.js?v=170';
import {colorCard} from '/color-cards.js?v=159';
import {$,el,api,post,preview,profileLink,date,buttonTask,loginLink,empty} from '/market-ui.js?v=170';
import {setAvatar} from '/avatar-display.js?v=337';
const params=new URLSearchParams(location.search),tab=['home','users','auctions','cards','manage','wheel'].includes(params.get('tab'))?params.get('tab'):'home',owner=params.get('owner')||'';let viewer=null,designs=[],accountState=null,shopInventory=new Set();
for(const link of document.querySelectorAll('[data-market-tab]'))if(link.dataset.marketTab===tab)link.setAttribute('aria-current','page');
async function balance(){const d=await api('/api/shop');$('shopBalance').textContent=d.signed_in?`Tu saldo: ${Number(d.balance).toLocaleString('es-ES')} T$ · ${Number(d.karma).toLocaleString('es-ES')} karma`:'Explora las tiendas. Inicia sesión para comprar o pujar.';return d;}
async function load(){try{if(tab==='wheel'){await balance().catch(()=>{});const {dailyWheel}=await import('/daily-wheel116.js?v=159');await dailyWheel($('shopContent'),viewer,()=>balance());return;}if(tab==='home'){landing();balance().catch(e=>{$('shopBalance').textContent='Saldo temporalmente no disponible. Reintenta más tarde.';});return;}if(tab==='users'){await users();return;}const account=await balance();accountState=account;if(tab==='manage'){await manage();return;}if(tab==='cards'){cards(account);return;}if(tab==='auctions'){await auctions();return;}await users();}catch(e){$('shopNotice').textContent='No se pudo cargar la sección: '+e.message;const box=el('div',undefined,'shop-cycle');box.append(el('p','La carga no se ha completado. Puedes volver a intentarlo sin cerrar sesión.'));const back=el('a','Volver a todas las tiendas');back.href='/shops.html';box.append(back);const retry=el('button','Reintentar','market-btn');retry.onclick=()=>load();box.append(retry);$('shopContent').replaceChildren(box);}}
function promo(key,title,subtitle){if(key==='wheel'){const a=el('a',undefined,'store-promo daily-wheel-promo177');a.href='/shops.html?tab=wheel';const icon=el('span',undefined,'daily-wheel-icon177');icon.setAttribute('aria-hidden','true');a.append(icon,el('strong','Ruleta diaria'));a.setAttribute('aria-label','Ruleta diaria');return a;}const a=el('a',undefined,'store-promo '+key);a.href='/shops.html?tab='+({colors:'cards',auctions:'auctions',users:'users'}[key]);const image=el('img');image.src='/assets/reference/'+({colors:'colors',auctions:'auctions',users:'shops'}[key])+'.jpg';image.alt=title;a.append(image);a.setAttribute('aria-label',title);return a;}
function landing(){const grid=el('div',undefined,'shop-grid shop-destinations');for(const [key,title,text] of [['users','Tiendas de jugadores','Crea tu tienda, puja por puestos cada 48 horas y vende tus propios diseños.'],['auctions','Subastas','Presenta tu puja en los diseños disponibles.'],['colors','Niveles de color','Consulta los requisitos de karma y el precio de cada tarjeta.'],['wheel','Ruleta diaria','Gira gratis una vez al día y descubre tu premio en T$.']]){const card=el('section',undefined,'shop-card');card.append(promo(key,title,key==='colors'?'COLOR LEVEL STORE':key==='auctions'?'AUCTIONS':'GAME SHOPS'),el('p',text));grid.append(card);}$('shopContent').replaceChildren(grid);}
function storeLayout(title,category){const root=$('shopContent'),layout=el('div',undefined,'store-layout'),side=el('aside',undefined,'store-sidebar'),content=el('section',undefined,'store-main');side.append(promo(category,title,category==='colors'?'COLOR LEVEL STORE':category==='auctions'?'AUCTIONS':'GAME SHOPS'));
 if(viewer){side.append(el('strong',viewer.username),el('p','Karma: '+Number(accountState?.karma||0).toLocaleString('es-ES')),el('p','Saldo: '+Number(accountState?.balance||0).toLocaleString('es-ES')+' T$'));const mine=el('a','Mi tienda','market-btn');mine.href='/shops.html?tab=manage';side.append(mine);}else side.append(loginLink('Inicia sesión para participar'));
 const links=el('nav',undefined,'store-side-links');for(const [url,label] of [['/shops.html','Todas las tiendas'],['/shops.html?tab=users','Tiendas de jugadores'],['/shops.html?tab=manage','Crear / gestionar tienda'],['/shops.html?tab=auctions','Subastas'],['/shops.html?tab=cards','Niveles de color'],['/shops.html?tab=wheel','Ruleta diaria'],['/designs.html','Publicar un diseño']]){const a=el('a',label);a.href=url;links.append(a);}side.append(links);layout.append(side,content);root.replaceChildren(layout);return content;}


function tryOn(d){
 if(!viewer){$('shopNotice').textContent='Inicia sesión para probar diseños en tu avatar.';return;}
 const veil=el('div',undefined,'tryon-veil');veil.setAttribute('role','dialog');veil.setAttribute('aria-modal','true');veil.setAttribute('aria-label','Probar diseño');
 const panel=el('section',undefined,'tryon-panel'),close=el('button','×','tryon-close');close.type='button';
 const avatar=el('img');avatar.alt='Vista previa de '+d.title+' en tu avatar';avatar.src='/api/try-on?design_id='+encodeURIComponent(d.id)+'&v='+Date.now();
 avatar.onerror=()=>{message.textContent='No se ha podido mostrar la prueba. Comprueba que has iniciado sesión.';};
 // Dentro de una imagen SVG externa, Safari puede ocultar sus capas PNG. Insertar en línea.
 fetch(avatar.src,{credentials:'include',cache:'no-store'}).then(async r=>{
   if(!r.ok)throw Error('Vista previa no disponible (HTTP '+r.status+')');
   if(!(r.headers.get('content-type')||'').includes('svg'))return;
   const markup=await r.text();
   if(!markup.trim().startsWith('<svg')||!markup.includes('</svg>'))return;
   const holder=el('div',undefined,'tryon-inline-avatar');holder.innerHTML=markup;
   const vector=holder.querySelector('svg');if(vector){vector.style.width='100%';vector.style.height='auto';vector.style.maxWidth='500px';}
   avatar.replaceWith(holder);
 }).catch(e=>{message.textContent=e.message;});
 const message=el('p','Esta es una prueba: no se compra ni equipa el diseño.');
 panel.append(close,el('h2','Así te queda: '+d.title),avatar,message);
 veil.append(panel);document.body.append(veil);
 const dismiss=()=>{document.removeEventListener('keydown',esc);veil.remove();};
 const esc=e=>{if(e.key==='Escape')dismiss();};
 close.onclick=dismiss;veil.onclick=e=>{if(e.target===veil)dismiss();};document.addEventListener('keydown',esc);close.focus();
}
function addTryOn(card,d){
 const btn=el('button','Probármelo en mi avatar','plain-btn');btn.type='button';btn.onclick=()=>tryOn(d);card.append(btn);
}

async function purchase(d,button){await buttonTask(button,async()=>{const data=await post('/api/shop',{action:(d.owned)?'equip_design':'buy_design',item_code:'userdesign-'+d.id});$('shopNotice').textContent=data.message;await load();await window.TengagedRefreshSession();},$('shopNotice'));}
function product(d){const card=el('article',undefined,'design-card');card.append(preview(d),el('h3',d.title),profileLink(d.author),el('p',d.description),el('small',d.price?'Precio: '+d.price+' T$':'Gratis'));addTryOn(card,d);if(viewer){const button=el('button',d.is_equipped?'Equipado':d.owned?'Equipar':'Comprar','market-btn');button.disabled=!!d.is_equipped;button.onclick=()=>purchase(d,button);card.append(button);}else card.append(loginLink('Entrar para comprar'));return card;}
function liveCountdown(end){const time=Math.max(0,Number(end)*1000-Date.now()),h=Math.floor(time/3600000),m=Math.floor(time%3600000/60000);return `${h} h ${m} min`;}
function giftDialog(d,s){
 const veil=el('div',undefined,'tryon-veil'),panel=el('section',undefined,'tryon-panel');
 veil.setAttribute('role','dialog');veil.setAttribute('aria-modal','true');veil.setAttribute('aria-label','Regalar diseño');
 const form=el('form',undefined,'section-form'),label=el('label','Nombre de usuario del destinatario'),input=el('input');
 input.required=true;input.maxLength=80;input.autocomplete='off';label.append(input);
 const send=el('button','Enviar regalo · '+d.price+' T$','market-btn'),close=el('button','Cancelar','plain-btn'),notice=el('p');
 close.type='button';notice.setAttribute('role','status');
 panel.append(el('h2','Regalar «'+d.title+'»'),el('p','Se descontarán '+d.price+' T$ de tu saldo y el diseño se añadirá al inventario del destinatario.'),form);
 const dedicationLabel=el('label','Dedicatoria (opcional)'),dedication=el('textarea');dedication.maxLength=300;dedicationLabel.append(dedication);form.append(label,dedicationLabel,notice,send,close);veil.append(panel);document.body.append(veil);
 const previousFocus=document.activeElement;
 const dismiss=()=>{document.removeEventListener('keydown',esc);veil.remove();previousFocus?.focus();};
 const esc=e=>{if(e.key==='Escape'&&!send.disabled)dismiss();};
 close.onclick=()=>{if(!send.disabled)dismiss();};veil.onclick=e=>{if(e.target===veil&&!send.disabled)dismiss();};document.addEventListener('keydown',esc);
 form.onsubmit=e=>{e.preventDefault();return buttonTask(send,async()=>{
 const r=await post('/api/player-shops',{action:'gift',shop_id:s.id,design_id:d.design_id,recipient:input.value.trim(),message:dedication.value.trim()});
 dismiss();$('shopNotice').textContent=r.message;await users();await balance();await window.TengagedRefreshSession();
 },notice);};input.focus();
}
function shopProduct(d,s){
 const card=el('article',undefined,'design-card');
 card.append(preview({id:d.design_id,title:d.title,theme_code:d.theme_code,has_image:d.has_image}),el('h3',d.title),el('small',d.price+' T$ · '+d.quantity+' disponibles'));
 addTryOn(card,{id:d.design_id,title:d.title});
 if(viewer){
 const owned=shopInventory.has('userdesign-'+d.design_id),own=s.owner_id===viewer.id;
 const reason=!s.active?'Tienda pendiente de obtener escaparate: compras y regalos cerrados.':!d.quantity?'Artículo agotado.':Number(accountState?.balance||0)<d.price?'Saldo insuficiente.':'';
 if(reason)card.append(el('p',reason,'purchase-requirement'));
 const buy=el('button',owned?'Ya lo tienes':'Comprar','market-btn');buy.disabled=!!reason||owned;
 buy.onclick=()=>buttonTask(buy,async()=>{
 const r=await post('/api/player-shops',{action:'purchase',shop_id:s.id,design_id:d.design_id});
 $('shopNotice').textContent=r.message;await users();await balance();await window.TengagedRefreshSession();
 },$('shopNotice'));
 const gift=el('button','Regalar','plain-btn');gift.disabled=!!reason;gift.onclick=()=>giftDialog(d,s);
 card.append(buy,gift);if(own)card.append(el('small','Puedes comprar una unidad para tu armario. Al ser tu tienda, el cargo y el ingreso se compensan.'));
 }else card.append(loginLink('Entrar para comprar o regalar'));
 return card;
}
let shopsCountdown169=null;
function shopURL169(shop){return '/shops.html?tab=users&owner='+encodeURIComponent(shop.owner||shop.shop_owner);}
function shopAnchor169(shop,label){const a=el('a',label||shop.name||shop.shop_name);a.href=shopURL169(shop);return a;}
function shoppingHeading169(text){const heading=el('h2',text.replace(/^[🛒♧✓]+\s*/u,''),'shopping-heading169');if(text.startsWith('🛒'))heading.dataset.icon='cart';else if(text.includes('#shops'))heading.dataset.icon='tag';else if(text.startsWith('♧'))heading.dataset.icon='gift';else if(text.startsWith('✓'))heading.dataset.icon='check';return heading;}
function shoppingImage169(d){const a=preview({id:d.design_id,title:d.title,has_image:d.has_image,theme_code:d.theme_code});a.className='shopping-thumb169';a.title=d.title;return a;}
function shoppingCountdown169(end){
 const box=el('div',undefined,'shopping-countdown169');box.append(el('span','Siguiente juego en','shopping-countdown-label169'));const digits=el('span');digits.setAttribute('role','timer');box.append(digits);
 const update=()=>{let n=Math.max(0,Math.floor(Number(end)-Date.now()/1000));const values=[Math.floor(n/86400),Math.floor(n%86400/3600),Math.floor(n%3600/60),n%60];digits.replaceChildren();values.forEach((v,i)=>{digits.append(el('b',String(v).padStart(i?2:1,'0')),el('small',['D','H','M','S'][i]));});if(!n){digits.title='La próxima consulta actualizará los escaparates.';}};
 if(shopsCountdown169)clearInterval(shopsCountdown169);update();shopsCountdown169=setInterval(update,1000);return box;
}
function shoppingSidebar169(info){
 const side=el('aside',undefined,'shopping-side169');side.append(el('h1','Shops Game'));const logo=el('img');logo.src='/assets/shopping/shopsgame.png';logo.alt='Shops Game';logo.width=154;logo.height=154;side.append(logo,shoppingCountdown169(info.cycle.ends_at));
 const invite=el('div',undefined,'shopping-invite169');invite.append(el('p','¿Te gustaría tener tu propia tienda?'));
 const action=viewer?el('a',info.mine?'Mi tienda / pujar':'Crear mi tienda','market-btn'):loginLink('Identifícate para crear tu tienda');if(viewer)action.href='/shops.html?tab=manage';invite.append(action);side.append(invite);
 if(viewer)side.append(profileLink(viewer.username),el('p','Saldo: '+Number(info.balance||0).toLocaleString('es-ES')+' T$'));
 const nav=el('nav',undefined,'shopping-nav169');nav.setAttribute('aria-label','Otras tiendas');for(const [href,label]of [['/shops.html','← Todas las tiendas'],['/shops.html?tab=auctions','Subastas'],['/shops.html?tab=cards','Tarjetas de color'],['/shops.html?tab=wheel','Ruleta diaria'],['/shops.html?tab=manage','Mi tienda / pujar']]){const a=el('a',label);a.href=href;nav.append(a);}side.append(nav);
 const blogs=el('section',undefined,'shopping-blogs169');blogs.append(shoppingHeading169('♧ #shops'));const list=el('ol');list.append(el('li','Cargando blogs…'));blogs.append(list);side.append(blogs);
 api('/api/blog?q=%23shops&page_size=14').then(data=>{if(!list.isConnected)return;list.replaceChildren();for(const p of data.posts||[]){if(!/(?:^|[^\p{L}\p{N}_])#shops(?![\p{L}\p{N}_-])/iu.test(p.title+' '+p.body))continue;const li=el('li'),a=el('a',p.title);a.href='/blogs?id='+encodeURIComponent(p.id);li.append(a);list.append(li);}if(!list.children.length)list.append(el('li','Todavía no hay blogs con #shops.'));}).catch(()=>{list.replaceChildren(el('li','Blogs temporalmente no disponibles.'));});return side;
}
function shoppingActivity169(info){
 const columns=el('div',undefined,'shopping-activity169');for(const [key,title,isGift]of [['public_gifts','♧ Últimos regalos',true],['public_sales','✓ Últimos compradores',false]]){
 const section=el('section');section.append(shoppingHeading169(title));const list=el('ol',undefined,'shopping-messages169');for(const entry of info[key]||[]){
 const li=el('li'),message=el('div',undefined,'shopping-message169'),header=el('div',undefined,'shopping-message-header169');li.append(shoppingImage169(entry));
 if(isGift)header.append('De ',profileLink(entry.buyer),' a ',profileLink(entry.recipient),', en la tienda ',shopAnchor169(entry));else header.append(profileLink(entry.buyer),' compró «'+entry.title+'» en la tienda ',shopAnchor169(entry));message.append(header);if(isGift&&entry.message)message.append(el('p',entry.message));li.append(message);list.append(li);
 }if(!list.children.length)list.append(el('li',isGift?'Todavía no hay regalos.':'Todavía no hay compradores.'));section.append(list);columns.append(section);
 }return columns;
}
let activityTimer282=null;
function liveActivity282(info){
 const signature=d=>JSON.stringify([d.public_gifts,d.public_sales]);let last=signature(info);clearInterval(activityTimer282);
 activityTimer282=setInterval(async()=>{if(document.hidden)return;const shown=document.querySelector('.shopping-activity169');if(!shown){clearInterval(activityTimer282);return;}try{const data=await api('/api/player-shops?activity=1'),next=signature(data);if(next===last)return;last=next;shown.replaceWith(shoppingActivity169(data));}catch{}},15000);
}
function shoppingStore169(shop,products,index){
 const card=el('li',undefined,'shopping-store169'),header=el('div',undefined,'shopping-store-head169'),facade=shopAnchor169(shop);facade.className='shopping-facade169 facade-'+index%5;facade.setAttribute('aria-label','Entrar en '+shop.name);const icon=el('span','▰');icon.setAttribute('aria-hidden','true');facade.replaceChildren(icon);if(shop.has_logo){const image=el('img');image.src='/api/player-shops?image='+shop.id;image.alt=shop.name;image.width=50;image.height=50;facade.replaceChildren(image);facade.className='shopping-facade169 has-logo';}
 const details=el('div',undefined,'shopping-store-title169');details.append(shopAnchor169(shop),el('p'));details.children[1].append('diseños de ',profileLink(shop.owner));const values=el('p');values.append('Valor tienda: ',el('strong',Number(shop.lifetime_value||0).toLocaleString('es-ES',{minimumFractionDigits:1})),' T$ · Valor juego: ',el('strong',Number(shop.cycle_value||0).toLocaleString('es-ES',{minimumFractionDigits:1})),' T$');details.append(values);header.append(facade,details);card.append(header);
 const list=el('ol',undefined,'shopping-items169');for(const d of products.slice(0,6)){const li=el('li'),a=shoppingImage169(d);a.href=shopURL169(shop)+'#producto-'+d.design_id;li.append(a);if(!d.quantity)li.append(el('span','vendido','shopping-sold169'));li.append(el('span',Number(d.price).toLocaleString('es-ES')+' T$','shopping-price169'));list.append(li);}
 if(!products.length)card.append(el('p','Esta tienda todavía no tiene artículos.','shopping-empty169'));else card.append(list);return card;
}
async function users(){
 const info=await api('/api/player-shops');accountState={...(accountState||{}),balance:info.balance};shopInventory=new Set(info.inventory||[]);if(accountState)accountState.balance=info.balance;
 document.body.classList?.add('classic-shopping169');const layout=el('div',undefined,'shopping-layout169'),main=el('section',undefined,'shopping-main169');layout.append(shoppingSidebar169(info),main);$('shopContent').replaceChildren(layout);
 if(owner){
 const shop=info.shops.find(s=>s.owner.toLowerCase()===owner.toLowerCase());if(!shop){main.append(shoppingHeading169('Tienda no encontrada'),el('p','Esta persona todavía no tiene tienda.'));return;}
 main.append(shoppingHeading169(shop.name));const by=el('p',undefined,'shopping-owner169');by.append('diseños de ',profileLink(shop.owner));main.append(by);if(shop.description)main.append(el('p',shop.description,'shopping-description169'));
 if(!shop.active)main.append(el('p','Esta tienda está fuera de escaparate. Las compras se abrirán cuando consiga un puesto.','shopping-description169'));
 const grid=el('div',undefined,'design-grid shopping-detail169');for(const d of info.products.filter(d=>d.shop_id===shop.id)){const card=shopProduct(d,shop);card.id='producto-'+d.design_id;grid.append(card);}if(!grid.children.length)grid.append(el('p','Todavía no hay productos.'));main.append(grid);
 }else{
 const heading=shoppingHeading169('🛒 Tiendas');heading.append(el('span','Tiendas abiertas · ronda #'+(info.cycle.id||1),'shopping-heading-info169'));main.append(heading);
 const active=info.shops.filter(s=>s.active),list=el('ol',undefined,'shopping-stores169');for(const [i,shop]of active.entries())list.append(shoppingStore169(shop,info.products.filter(d=>d.shop_id===shop.id),i));if(!active.length)list.append(el('li','Todavía no hay tiendas abiertas. Crea tu tienda y puja para conseguir un escaparate.','shopping-empty169'));main.append(list);
 const inactive=info.shops.filter(s=>!s.active);if(inactive.length){const fold=el('details',undefined,'shopping-pending169');fold.append(el('summary','Tiendas fuera de escaparate ('+inactive.length+')'));const pending=el('ol',undefined,'shopping-stores169');for(const [i,shop]of inactive.entries())pending.append(shoppingStore169(shop,info.products.filter(d=>d.shop_id===shop.id),i));fold.append(pending);main.append(fold);}
 }main.append(shoppingActivity169(info));liveActivity282(info);if(/^#producto-\d+$/.test(location.hash))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
}

let manageView271='stock';
function adminSetup271(content){
 if(viewer.username.toLowerCase()!=='admin1')return;
 const setupBox=el('div',undefined,'shop-cycle'),setup=el('button','Preparar primera tienda de prueba','market-btn');
 setupBox.append(el('p','Crea la tienda de admin1 y añade hasta 3 diseños existentes, con 5 unidades a 10 T$ cada uno. No altera los saldos ni repite el inventario al pulsarlo de nuevo.'),setup);
 setup.onclick=()=>buttonTask(setup,async()=>{const r=await post('/api/player-shops',{action:'admin_setup_first_shop'});await manage();$('shopNotice').textContent=r.message;},$('shopNotice'));
 content.append(setupBox);
}
function shopForm271(mine){
 const form=el('form',undefined,'section-form'),title=el('label','Nombre de la tienda'),name=el('input'),description=el('label','Descripción'),desc=el('textarea'),save=el('button',mine?'Guardar cambios':'Crear tienda','market-btn');
 name.maxLength=40;name.minLength=3;name.required=true;name.value=mine?.name||'';desc.maxLength=250;desc.value=mine?.description||'';title.append(name);description.append(desc);form.append(title,description,save);
 form.onsubmit=e=>{e.preventDefault();buttonTask(save,async()=>{const r=await post('/api/player-shops',{action:mine?'edit':'create',name:name.value,description:desc.value});$('shopNotice').textContent=r.message;await manage();},$('shopNotice'));};
 return form;
}
function shopDetails271(content,info,mine){
 adminSetup271(content);content.append(shopForm271(mine));
 const appearance=el('form',undefined,'section-form'),imageLabel=el('label','Imagen de la tienda (50 × 50; PNG, JPG o WebP, máximo 256 KB)'),file=el('input'),saveLogo=el('button','Guardar imagen','market-btn');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.required=true;imageLabel.append(file);appearance.append(imageLabel,saveLogo);
 if(mine.has_logo){const logo=el('img');logo.src='/api/player-shops?image='+mine.id;logo.alt=mine.name;logo.width=50;logo.height=50;appearance.append(logo);const remove=el('button','Quitar imagen','plain-btn');remove.type='button';remove.onclick=()=>buttonTask(remove,async()=>{const r=await post('/api/player-shops',{action:'set_logo',image_data:null});await manage();$('shopNotice').textContent=r.message;},$('shopNotice'));appearance.append(remove);}
 appearance.onsubmit=e=>{e.preventDefault();buttonTask(saveLogo,async()=>{const chosen=file.files[0];if(!chosen)throw Error('Selecciona una imagen.');if(chosen.size>262144)throw Error('La imagen debe ocupar como máximo 256 KB.');const image_data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la imagen.'));reader.readAsDataURL(chosen);});const r=await post('/api/player-shops',{action:'set_logo',image_data});await manage();$('shopNotice').textContent=r.message;},$('shopNotice'));};content.append(appearance);
 const status=el('div',undefined,'shop-cycle');status.append(el('strong',mine.active?'Tu tienda está destacada':'Tu tienda no ocupa un puesto destacado'),el('span','Nueva rotación dentro de '+liveCountdown(info.cycle.ends_at)+' · 5 puestos'));content.append(status);
 if(viewer.username.toLowerCase()==='admin1'){
  const adminPanel=el('div',undefined,'shop-cycle'),close=el('button','Cerrar ronda de pruebas ahora','market-btn');
  adminPanel.append(el('p','Herramienta de prueba para admin1. Cierra el ciclo actual, adjudica los 5 escaparates por puja y comienza otro de 48 horas. Solo cobra las pujas ganadoras.'),close);
  close.onclick=()=>{if(!confirm('¿Cerrar ahora la ronda y adjudicar los escaparates?'))return;buttonTask(close,async()=>{const r=await post('/api/player-shops',{action:'admin_close_cycle'});$('shopNotice').textContent=r.message;await manage();},$('shopNotice'));};
  content.append(adminPanel);
 }
 const bids=[...info.shops].sort((a,b)=>b.bid-a.bid),rank=bids.findIndex(x=>x.id===mine.id)+1;content.append(el('p',`Tu puja actual: ${mine.bid} T$ · Posición provisional: ${rank}/${info.shops.length}. Las cinco mayores pujas consiguen escaparate en el siguiente cambio. Solo se cobra la puja si tu tienda sube al escaparate: necesitas tener ese saldo cuando acabe la ronda.`));
 const bidForm=el('form',undefined,'section-form'),label=el('label','Puja total (T$) · puedes subirla o bajarla, 0 la retira'),bid=el('input'),bidBtn=el('button',mine.bid?'Cambiar mi puja':'Pujar','market-btn');bid.type='number';bid.step='1';bid.min='0';bid.max='100000';bid.value=String(mine.bid||1);label.title='Puedes subirla o bajarla hasta que acabe la ronda. Pon 0 para retirarla.';label.append(bid);bidForm.append(label,bidBtn);bidForm.onsubmit=e=>{e.preventDefault();buttonTask(bidBtn,async()=>{const r=await post('/api/player-shops',{action:'bid',amount:Number(bid.value)});$('shopNotice').textContent=r.message;await manage();await window.TengagedRefreshSession();},$('shopNotice'));};content.append(bidForm);
}
function shopTable271(headers,rows){
 const table=el('table',undefined,'shop-table271'),head=el('tr');for(const h of headers)head.append(el('th',h));const thead=el('thead'),tbody=el('tbody');thead.append(head);
 for(const cells of rows){const tr=el('tr');for(const cell of cells){const td=el('td');td.append(cell);tr.append(td);}tbody.append(tr);}
 table.append(thead,tbody);return table;
}
function shopSales271(content,info){
 content.append(el('p','Saldo actual: '+Number(info.balance||0).toLocaleString('es-ES')+' T$','shop-stock-count271'),el('h2','Últimas ventas y regalos','shop-title271'));
 const recent=info.recent_sales||[];
 if(!recent.length){content.append(el('p','Aún no hay ventas registradas en esta tienda.'));return;}
 content.append(shopTable271(['Diseño','Operación','Precio','Fecha'],recent.map(item=>[item.title,item.recipient?item.buyer+' regaló a '+item.recipient:item.buyer+' compró',Number(item.price).toLocaleString('es-ES')+' T$',date(item.created_at)])));
}
function shopStock271(content,info,mine,designs){
 const posted=Number(info.stock_posted||0),sold=new Map((info.my_sold||[]).map(x=>[x.design_id,Number(x.sold)])),products=info.products.filter(x=>x.shop_id===mine.id).sort((a,b)=>(b.quantity>0)-(a.quantity>0));
 const count=el('p',undefined,'shop-stock-count271');count.append(el('span','Stock publicado: '),el('b',String(posted)));
 const labs=el('a','Juego de diseños','shop-labs271');labs.href='/designs.html';content.append(count,labs,el('h2','Elige un diseño','shop-title271'));
 const form=el('form',undefined,'shop-stock-form271'),picker=el('div',undefined,'shop-picker271'),price=el('input'),qty=el('input'),perm=el('input'),add=el('button','Añadir stock','shop-yellow271'),cancel=el('button','Cancelar','shop-cancel271');picker.id='shopPicker271';
 let chosen=null;
 const sync=()=>{add.disabled=!chosen||!perm.checked;};
 const pick=(design,card)=>{chosen=design;for(const c of picker.children)c.setAttribute('aria-pressed',String(c===card));const current=products.find(p=>p.design_id===design?.id);if(current)price.value=String(current.price);sync();};
 for(const d of designs){
  const card=el('button',undefined,'shop-design271'),art=el('span',undefined,'shop-design-art271'),image=preview({id:d.id,title:d.title,has_image:d.has_image,theme_code:d.theme_code});
  card.type='button';card.setAttribute('aria-pressed','false');art.append(...image.childNodes);card.append(art,el('span',d.title,'shop-design-name271'));card.onclick=()=>pick(d,card);picker.append(card);
 }
 if(!designs.length){const go=el('a','Publicar mi primer diseño →','collection-link');go.href='/designs.html';picker.append(go);}
 price.type='number';price.min='0';price.max='100000';price.step='1';price.value='20';price.required=true;
 qty.type='number';qty.min='1';qty.step='1';qty.value='1';qty.required=true;
 const fields=el('div',undefined,'shop-fields271'),priceLabel=el('label','Precio (T$)'),qtyLabel=el('label','Número de artículos');priceLabel.append(price);qtyLabel.append(qty);fields.append(priceLabel,qtyLabel);
 const rules=el('p',undefined,'shop-rules271');for(const text of ['Stock mínimo: 1','Espera de compra: 0 horas máximo','Retraso de regalo: 0 horas'])rules.append(el('span',text));
 const permission=el('label',undefined,'shop-permission271');perm.type='checkbox';perm.onchange=sync;permission.append(perm,el('span','Tengo permiso para vender este diseño.'));
 const actions=el('div',undefined,'shop-actions271');cancel.type='button';cancel.onclick=()=>{perm.checked=false;price.value='20';qty.value='1';pick(null,null);};actions.append(add,cancel);
 form.append(picker,fields,rules,permission,actions);sync();
 form.onsubmit=e=>{e.preventDefault();buttonTask(add,async()=>{if(!chosen)throw Error('Elige un diseño.');const r=await post('/api/player-shops',{action:'stock',design_id:chosen.id,quantity:Number(qty.value),price:Number(price.value)});await manage();$('shopNotice').textContent=r.message;},$('shopNotice'));};
 content.append(form,el('h2','Stock actual','shop-title271'));
 if(!products.length){content.append(el('p','Todavía no hay diseños en tu tienda.'));return;}
 content.append(shopTable271(['Diseño','Precio','Restante','Vendidos',''],products.map(d=>{const remove=el('button','Retirar','shop-remove271');remove.type='button';remove.onclick=()=>buttonTask(remove,async()=>{const r=await post('/api/player-shops',{action:'remove',design_id:d.design_id});await manage();$('shopNotice').textContent=r.message;},$('shopNotice'));return [d.title,Number(d.price).toLocaleString('es-ES')+' T$',String(d.quantity),String(sold.get(d.design_id)||0),remove];})));
}
function shopManager271(info,mine,designs){
 document.body.classList.add('classic-shopping169');
 const layout=el('div',undefined,'shop-manage271'),side=el('aside',undefined,'shop-side271'),main=el('section',undefined,'shop-main271'),show=view=>{manageView271=view;$('shopNotice').textContent='';shopManager271(info,mine,designs);};
 const banner=el('div',undefined,'shop-banner271'),pics=el('div',undefined,'shop-banner-pics271'),portrait=el('img'),product=info.products.find(x=>x.shop_id===mine.id&&x.has_image);setAvatar(portrait,mine.owner);portrait.alt=mine.owner;pics.append(portrait);
 if(mine.has_logo||product){const image=el('img');image.src=mine.has_logo?'/api/player-shops?image='+mine.id:'/api/design-image?id='+product.design_id;image.alt=mine.name;pics.append(image);}
 banner.append(el('strong',mine.name),pics);
 const ownerImage=el('img'),ownerLink=el('a',undefined,'shop-owner-pic271');setAvatar(ownerImage,mine.owner);ownerImage.alt=mine.owner;ownerLink.href='/profile.html?username='+encodeURIComponent(mine.owner);ownerLink.append(ownerImage);
 const status=el('p','Estado: ');status.append(el('b',mine.active?'abierta':'fuera de escaparate',mine.active?'shop-open271':'shop-closed271'));
 const total=(label,value)=>{const p=el('p',label+': ','shop-total271');p.append(el('b',Number(value||0).toLocaleString('es-ES')),' T$');return p;};
 const help=el('a','Ayuda del juego de tiendas');help.href='/help.html#tiendas';const gestion=el('button','Gestionar tienda','shop-yellow271');gestion.type='button';gestion.onclick=()=>show('details');const addLink=el('a','Añadir stock');addLink.href='#shopPicker271';addLink.onclick=e=>{e.preventDefault();show('stock');};
 side.append(banner,el('p','Propiedad de:'),profileLink(mine.owner),ownerLink,status,total('Total tienda',mine.lifetime_value),total('Total juego',mine.cycle_value),help,gestion,addLink);
 const head=el('div',undefined,'shop-head271'),visit=el('a','Ver tienda','shop-yellow271');visit.href=shopURL169(mine);head.append(el('h1','Gestionar '+mine.name),visit);
 const tabs=el('nav',undefined,'shop-tabs271');tabs.setAttribute('aria-label','Gestión de la tienda');for(const [view,label]of [['details','Detalles de la tienda'],['stock','Stock'],['sales','Ventas y regalos']]){const a=el('a',label);a.href='#'+view;if(view===manageView271)a.setAttribute('aria-current','page');a.onclick=e=>{e.preventDefault();show(view);};tabs.append(a);}
 main.append(head,tabs);layout.append(side,main);$('shopContent').replaceChildren(layout);
 if(manageView271==='details')shopDetails271(main,info,mine);else if(manageView271==='sales')shopSales271(main,info);else shopStock271(main,info,mine,designs);
}
async function manage(){
 const info=await api('/api/player-shops'),mine=viewer?info.shops.find(s=>s.id===info.mine):null;
 if(mine){const creations=await api('/api/designs?owner='+encodeURIComponent(viewer.username));shopManager271(info,mine,creations.designs);return;}
 const content=storeLayout('Gestionar mi tienda','users');content.append(el('h2','Mi tienda y pujas','section-title'));
 if(!viewer){content.append(loginLink('Inicia sesión para crear una tienda'));return;}
 adminSetup271(content);content.append(shopForm271(null));
}

function cards(data){
 document.body.classList.add('color-level-store-page');
 const root=$('shopContent'),layout=el('div',undefined,'color-store-layout'),side=el('aside',undefined,'color-store-sidebar'),catalog=el('section',undefined,'color-store-catalog');catalog.setAttribute('aria-label','Color levels');
 const back=el('a','Back to Shops','color-store-back');back.href='/shops.html';side.append(back);
 const banner=el('img');banner.src='/assets/color-levels/shop_colors.jpg';banner.alt='Color Levels Shop';banner.width=500;banner.height=130;side.append(banner);
 const owned=new Set(data.items.filter(i=>i.owned).map(i=>i.code)),equipped=data.items.find(i=>i.category==='Tarjetas de color'&&i.is_equipped),wearing=COLOR_LEVELS.find(l=>l.itemCode===equipped?.code)||COLOR_LEVELS[0];
 const perform=(button,action,item)=>buttonTask(button,async()=>{const result=await post('/api/shop',{action,item_code:item});$('shopNotice').textContent=result.message;await load();await window.TengagedRefreshSession?.();},$('shopNotice'));
 if(viewer){side.append(el('strong',viewer.username),el('p','Karma: '+Number(data.karma||0)),el('p','T$: '+Number(data.balance||0)));
  const worn=el('p',undefined,'color-store-wearing');worn.append(document.createTextNode('Wearing: '),el('strong',wearing.name));side.append(worn);
  const white=el('button','Wear White','color-store-button');white.type='button';white.disabled=wearing.code==='white';white.onclick=()=>perform(white,'wear_white','color-card-white');side.append(white);
 }else side.append(loginLink('Inicia sesión para comprar o equipar tarjetas'));
 catalog.append(el('h1','Color Level Store','color-store-title'));const heading=el('h2','Items available ','color-store-heading');heading.append(el('span','19 items available','color-store-count'));catalog.append(heading);
 const list=el('ol',undefined,'color-store-items');
 for(const level of COLOR_LEVELS.slice(1)){
  const item=data.items.find(i=>i.code===level.itemCode);if(!item)continue;
  const card=el('li',undefined,'color-level-item');card.append(el('h3','Level '+level.name));const swatch=el('div',undefined,'color-store-swatch');swatch.style.background=colorCard(level.code).background;swatch.setAttribute('role','img');swatch.setAttribute('aria-label',level.name);swatch.title=level.name;card.append(swatch);
  for(const [name,value] of [['Power',level.power],['Karma',item.min_karma]]){const stat=el('p',undefined,'color-store-stat');stat.append(document.createTextNode(name+': '),el('strong',String(value)));card.append(stat);}
  card.append(el('p','T$'+item.price,'color-store-price'));
  const isWearing=wearing.code===level.code&&!!viewer,isOwned=!!item.owned,missingPrevious=!!level.previous&&!owned.has(level.previous),insufficientKarma=Number(data.karma)<Number(item.min_karma),insufficientMoney=Number(data.balance)<Number(item.price);
  const button=el('button',isWearing?'Wearing':isOwned?'Wear':'Buy','color-store-button');button.type='button';button.disabled=!viewer||isWearing||(!isOwned&&(missingPrevious||insufficientKarma||insufficientMoney));button.title=!viewer?'Inicia sesión':isWearing?'Currently wearing':isOwned?'Wear '+level.name:missingPrevious?'Buy the previous color first':insufficientKarma?'Necesitas más karma':insufficientMoney?'Saldo insuficiente':'Buy '+level.name;button.setAttribute('aria-label',button.title);button.onclick=()=>perform(button,isOwned?'equip':'buy',item.code);card.append(button);list.append(card);
 }
 catalog.append(list);layout.append(side,catalog);root.replaceChildren(layout);
}
async function auctions(){const data=await api('/api/auctions'),root=storeLayout('Subastas','auctions'),grid=el('div',undefined,'design-grid');root.append(el('h2','Subastas y pujas','section-title'),el('p','El importe se cobra al cerrar la subasta si la puja ganadora dispone de saldo. También puedes pujar por tu propio diseño; en ese caso pagas el premio completo y no recibes ingresos como vendedor.'));for(const a of data.auctions){const card=el('article',undefined,'design-card');card.append(preview({id:a.design_id,title:a.title,theme_code:a.theme_code,has_image:a.has_image}),el('h3',a.title),profileLink(a.seller),el('p',a.status==='open'?'Abierta · Cierra '+date(a.ends_at):a.status==='sold'?'Vendida':'Finalizada sin venta'),el('small','Puja actual: '+(a.current_bid||a.starting_bid)+' T$'));if(a.highest_bidder)card.append(el('small','Lidera: '+a.highest_bidder));const history=(data.bids||[]).filter(b=>b.auction_id===a.id).slice(0,5);if(history.length){const bidList=el('div',undefined,'shop-bid-history');bidList.append(el('strong','Últimas pujas'));for(const bid of history)bidList.append(el('p',bid.bidder+' · '+bid.amount+' T$ · '+date(bid.created_at)));card.append(bidList);}if(a.status==='open'){if(viewer){const form=el('form',undefined,'section-form'),label=el('label','Tu puja en T$'),amount=el('input'),button=el('button','Pujar','market-btn'),minimum=Math.max(Number(a.starting_bid),Number(a.current_bid)+1);amount.type='number';amount.min=String(minimum);amount.max='100000';amount.step='1';amount.value=String(minimum);amount.required=true;label.append(amount);form.append(label,button);form.onsubmit=e=>{e.preventDefault();buttonTask(button,async()=>{const result=await post('/api/auctions',{action:'bid',auction_id:a.id,amount:Number(amount.value)});$('shopNotice').textContent=result.message;await load();},$('shopNotice'));};card.append(form);}else card.append(loginLink('Entrar para pujar'));}grid.append(card);}root.append(grid);if(!data.auctions.length)empty(grid,'Todavía no hay subastas. Puedes crear una desde un diseño tuyo.');const link=el('a','Mis diseños / crear subasta →','collection-link');link.href='/designs.html';root.append(link);}
if(tab==='home')landing();else{if(tab==='cards')document.body.classList.add('color-level-store-page');$('shopContent').textContent='Cargando tienda…';}if(tab==='users'){window.TengagedSession.then(user=>{viewer=user;load();}).catch(()=>load());}else{load();window.TengagedSession.then(user=>{viewer=user;if(tab!=='home')load();}).catch(()=>{});}if(tab==='auctions')setInterval(()=>{if(!document.hidden)load();},30000);
