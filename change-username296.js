import {$,el,api,post,link,form} from '/community-ui.js?v=337';
const money=n=>(Math.round((Number(n)||0)*10)/10).toLocaleString('es-ES',{maximumFractionDigits:1});
async function load(){try{
 const data=await api('/api/change-username'),root=$('content');
 const box=el('section',undefined,'rename-card');
 const facts=el('dl',undefined,'rename-facts');
 for(const [k,v] of [['Nombre actual',data.username],['Tu dinero',money(data.money)+' T$'],['Precio del cambio',money(data.price)+' T$']]){facts.append(el('dt',k),el('dd',v));}
 box.append(facts);
 if(!data.allowed)box.append(el('p',data.reason,'rename-warning'));
 else if(data.money<data.price)box.append(el('p','Te faltan '+money(data.price-data.money)+' T$ para poder cambiar tu nombre.','rename-warning'));
 else{
  box.append(el('p','Usa entre 3 y 24 caracteres: letras sin tildes, números o guion bajo. Tu historial, partidas, blogs y regalos pasan al nombre nuevo.','rename-help'));
  const f=form([{name:'username',label:'Nombre nuevo',max:24}],'Cambiar nombre por '+money(data.price)+' T$',async body=>{
   const name=String(body.username||'').trim();
   if(!confirm('¿Cambiar tu nombre de '+data.username+' a '+name+'? Se descontarán '+money(data.price)+' T$.'))return;
   const r=await post('/api/change-username',{username:name});$('notice').textContent=r.message;
   if(window.TengagedUser)window.TengagedUser.username=r.username;
   setTimeout(()=>location.href='/profile.html?username='+encodeURIComponent(r.username),1200);
  });
  const input=f.querySelector('input[name="username"]');input.minLength=3;input.pattern='[A-Za-z0-9_]{3,24}';input.autocomplete='off';input.spellcheck=false;
  box.append(f);
 }
 box.append(link('Volver a mi perfil','/profile.html?username='+encodeURIComponent(data.username),'rename-back'));
 root.replaceChildren(box);
}catch(e){$('notice').textContent=e.message;$('content').replaceChildren(el('p','Para cambiar tu nombre tienes que iniciar sesión.'));}}
(window.TengagedSession||Promise.resolve()).then(load).catch(e=>{$('notice').textContent=e.message||'No se pudo comprobar la sesión.';});
