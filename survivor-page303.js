// V303: página de Survivor. Se actualiza cada 30 s (y al volver a la pestaña) para gastar pocas peticiones;
// la cuenta atrás corre en el navegador.
import {setAvatar} from '/avatar-display.js?v=159';
import {refreshPlayerActivity} from '/player-activity.js?v=302';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
let reloadFor=0,id=Number(params.get('id'))||0,viewTribe=params.get('tribe')||'',state=null,loading=false,busy=false,blogsLoaded=false,showLog=null;
const NAMES={wheel:'La rueda de la fortuna',numbers:'Números',deal:'Trato o no trato',match:'Tres en raya',endurance:'Resistencia',words:'Palabras',guitar:'Guitarra',maze:'Laberinto',snow:'Copos de nieve',line:'Bolas en línea'};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const profile=name=>'/profile.html?username='+encodeURIComponent(name);
const points=n=>Number(n).toLocaleString('es-ES')+' puntos';
const tribeName=t=>'Tribu '+t;
async function api(url,body){
 const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo conectar con Survivor.');return d;
}
function notice(text){const n=$('svNotice');n.textContent=text||'';n.hidden=!text;}

// ---------- Cabecera ----------
function seat(p,me){
 const box=el('div',null,'survivorSeat'+(p.status==='eliminated'?' survivorOut':'')),a=el('a',null,'survivorAvatar'),frame=el('span',null,'avatarFrame'),img=document.createElement('img');
 a.href=profile(p.username);a.setAttribute('aria-label','Perfil de '+p.username);img.alt='Avatar de '+p.username;img.loading='lazy';if(p.bot)img.src='/assets/hunger/tributes/'+(Math.abs(Number(p.id))%12)+'.svg';else setAvatar(img,p.username);frame.append(img);a.append(frame);
 if(p.voted===false){const clock=document.createElement('img');clock.className='survivorBallotClock';clock.src='/assets/survivor/clock.gif';clock.width=14;clock.height=14;clock.alt='Voto sin enviar';clock.title='Voto sin enviar';a.append(clock);}
 const name=el('a',p.username,'survivorName');name.href=profile(p.username);name.title=p.username;
 const presence=el('div',p.bot?'en línea':'…','survivorPresence');if(!p.bot)presence.dataset.playerLastSeen=p.username;
 const status=el('div',null,'survivorStatus');
 if(p.status==='eliminated'&&p.placement){const pl=el('span',String(p.placement),'survivorPlacement');pl.append(el('sup','º'));status.append(pl);}
 else if(p.status==='merged')status.append(el('span','1º','survivorPlacement'));
 else if(p.atCouncil){const q=el('b','?','survivorQuestion');q.title='En el Consejo Tribal';q.setAttribute('aria-label','En el Consejo Tribal');status.append(q);}
 else{const ok=el('b','','survivorSafe');ok.title='A salvo';ok.setAttribute('role','img');ok.setAttribute('aria-label','A salvo');status.append(ok);}
 box.append(a,name,presence,status);return box;
}
function renderHeader(){
 const s=state,me=s.me,roster=$('svRoster');roster.replaceChildren();
 const list=s.phase==='waiting'?s.players:s.players.filter(p=>p.tribe===s.viewTribe);
 for(const p of list)roster.append(seat(p,me));
 if(s.phase==='waiting')for(let i=list.length;i<10*Math.ceil(Math.max(list.length,1)/10);i++)roster.append(el('div',null,'survivorSeat survivorEmpty'));
 // En inscripción no hay texto encima de los avatares.
 $('svPhaseLabel').hidden=true;
 $('svTitle').textContent='Un juego Survivor online #'+s.id;$('svDay').textContent=String(s.day||0);
 const sw=$('svSwitch');sw.hidden=s.phase!=='day';const own=me?.tribe;
 sw.textContent=own&&s.viewTribe!==own?'Tu tribu':'Tribu rival';sw.title=sw.textContent;
 $('svBanner').setAttribute('aria-label','Día '+s.day+' de Survivor · '+tribeName(s.viewTribe));
 $('svAdmin').hidden=!(s.canFillBots||s.canStart);$('svFillBots').hidden=!s.canFillBots;$('svStart').hidden=!s.canStart;
 const join=$('svJoin');join.replaceChildren();join.hidden=true;
 if(s.phase==='waiting'&&!me){const a=el('a','Inscribirme en Survivor #'+s.id,'survivorButton');a.href='/enroll-game.html?type=survivor&id='+s.id;join.append(a);join.hidden=false;}
 if(s.phase==='finished'&&s.nextId){const a=el('a','Ir a Survivor #'+s.nextId,'survivorButton');a.href='/survivor.html?id='+s.nextId;join.append(a);join.hidden=false;}
 refreshPlayerActivity($('svRoster'));
}
function clock(){
 const t=$('svClock');if(!state||state.phase!=='day'||!state.deadline){t.replaceChildren();return;}
 const left=Math.max(0,Math.floor((state.deadline-Date.now())/1000)),h=Math.floor(left/3600),m=Math.floor(left%3600/60),sec=left%60,two=n=>String(n).padStart(2,'0');
 t.replaceChildren(two(h),el('span','H'),two(m),el('span','M'),two(sec),el('span','S'));
 t.setAttribute('aria-label','Siguiente fase en '+two(h)+' horas '+two(m)+' minutos '+two(sec)+' segundos');
 if(left===0&&reloadFor!==state.deadline){reloadFor=state.deadline;setTimeout(load,4000);}
}

// ---------- Campamento ----------
const KINDS={hunt:'caza',['hunt-start']:'sale a cazar',bucket:'agua del cubo',['bucket-start']:'saca el cubo',eat:'come',drink:'bebe',fan:'aviva el fuego'};
function renderCamp(){
 const s=state,c=s.camp,me=s.me,own=!!me&&me.tribe===s.viewTribe&&me.status==='active';
 $('svCamp').hidden=!c;if(!c)return;
 $('svCampTitle').textContent='Provisiones de la '+tribeName(c.tribe);
 const fire=$('svFire');fire.src='/assets/survivor/icon_game_campfire_'+(c.fire?3:1)+'.gif';fire.alt=fire.title=c.fire?'Fuego encendido':'Fuego apagado';
 const w=$('svWeather'),code={sun:3,cloudy:2,rain:1}[c.weather],label={sun:'Soleado',cloudy:'Nublado',rain:'Lluvia'}[c.weather];w.src='/assets/survivor/icon_game_weather_'+code+'.gif';w.alt=w.title=label;
 $('svWaterStock').textContent=c.water;$('svFoodStock').textContent=c.food;
 $('svMyWater').textContent=own?me.water:'';$('svMyFood').textContent=own?me.food:'';
 const box=$('svCampActions');box.replaceChildren();
 if(!own){if(me&&s.phase==='day'&&me.tribe!==s.viewTribe)box.append(el('p','Estás viendo el campamento de la '+tribeName(s.viewTribe)+'.','survivorNotice'));return;}
 if(me.food<=0&&me.water<=0)box.append(el('p','Estás a 0 de pollo y 0 de agua. Si sigues así cuando cambie el día, quedarás eliminado.','survivorWarning'));
}

// ---------- Botones Prueba · Inmunidad · Consejo ----------
function renderSteps(){
 const s=state,me=s.me,mine=me?.status==='active'?me:null,box=$('svSteps');box.replaceChildren();
 const step=(label,href,on,title)=>{const li=el('li');if(on)li.setAttribute('aria-current','step');if(href){const a=el('a',label);a.href=href;if(title)a.title=title;li.append(a);}else{li.textContent=label;if(title)li.title=title;}box.append(li);return li;};
 const day=s.phase==='day';
 step('Prueba',day?'/survivor-challenge.html?'+new URLSearchParams({id:s.id,day:s.day,mode:'tribe'}):null,day,day?'Prueba de tribu del día '+s.day:'La prueba se abre al empezar la partida.');
 step('Inmunidad',day&&s.nominated&&mine?.tribe===s.nominated?'/survivor-challenge.html?'+new URLSearchParams({id:s.id,day:s.day,mode:'immunity'}):null,day&&!!s.nominated,s.nominated?'Inmunidad individual de la '+tribeName(s.nominated):'La inmunidad no está abierta este día.');
 const li=step('Consejo',null,day&&!!s.nominated||s.history.length>0);
 // V311: el Consejo se abre en su propia página con los avatares y el botón Nominar.
 li.replaceChildren();const a=el('a','Consejo');a.href='/survivor-council.html?'+new URLSearchParams({id:s.id});li.append(a);
}
function renderWhispers(){
 const s=state,select=$('froWhisperTo'),old=select.value;select.replaceChildren(new Option('Selecciona…',''));
 for(const p of s.players.filter(p=>p.status==='active'&&!p.bot&&String(p.id)!==String(s.me?.id)))select.append(new Option(p.username,p.id));select.value=old;
 $('froWhisperForm').hidden=!s.me||s.me.status!=='active'||s.phase!=='day';
 $('froWhisperList').replaceChildren(...(s.whispers||[]).slice().reverse().map(w=>{const p=el('p','','fro-whisper');p.append(el('strong',w.from+' → '+w.to+': '),document.createTextNode(w.body));return p;}));
 if(!(s.whispers||[]).length)$('froWhisperList').append(el('p','Todavía no tienes mensajes privados en esta partida.'));
}
function tab(isPrivate){$('public-chat').hidden=isPrivate;$('froWhispers').hidden=!isPrivate;$('froPublic').setAttribute('aria-selected',String(!isPrivate));$('froPrivate').setAttribute('aria-selected',String(isPrivate));}
$('froPublic').onclick=()=>tab(false);$('froPrivate').onclick=()=>tab(true);
$('froWhisperForm').onsubmit=async e=>{e.preventDefault();const to=$('froWhisperTo').value,body=$('froWhisperText').value.trim();if(!to||!body)return;await act({action:'whisper',to:Number(to),body});if(!$('svNotice').textContent)$('froWhisperText').value='';};
async function loadBlogs(){
 if(blogsLoaded)return;blogsLoaded=true;
 try{const d=await api('/api/blog?q=%23survivor');const posts=(d.posts||[]).slice(0,5);if(!posts.length)return;const box=$('svBlogs');box.replaceChildren();for(const b of posts){const p=el('p'),a=el('a',b.title||'Blog');a.href='/blogs?id='+b.id;p.append(a);box.append(p);}}catch{}
}
function render(){renderHeader();renderCamp();renderSteps();renderWhispers();clock();}
async function pick(){
 const d=await api('/api/survivor');const list=d.matches||[];
 const mine=list.find(m=>m.mine&&m.phase!=='finished'),active=list.find(m=>m.phase==='day'),waiting=list.find(m=>m.phase==='waiting');
 return (mine||active||waiting||list[0])?.id||0;
}
async function load(){
 if(loading)return;loading=true;
 try{
  if(!id)id=await pick();if(!id)throw Error('Todavía no hay partidas de Survivor.');
  const d=await api('/api/survivor?'+new URLSearchParams({id,...(viewTribe?{tribe:viewTribe}:{})}));state=d.match;notice('');
  document.title='Survivor #'+state.id+' · Tengaged Reborn';render();loadBlogs();
 }catch(e){notice(e.message);}finally{loading=false;}
}
async function act(body){
 if(busy)return;busy=true;
 try{const d=await api('/api/survivor?'+new URLSearchParams({id,...(viewTribe?{tribe:viewTribe}:{})}),body);state=d.match;notice('');render();}
 catch(e){notice(e.message);}finally{busy=false;}
}
$('svSwitch').onclick=()=>{if(!state)return;const own=state.me?.tribe;viewTribe=state.viewTribe===(own||'A')?(own==='B'?'A':'B'):(own||'A');const url=new URL(location.href);url.searchParams.set('id',String(state.id));url.searchParams.set('tribe',viewTribe);history.replaceState(null,'',url);dispatchEvent(new Event('online'));load();};
$('svFillBots').onclick=()=>act({action:'fill_bots'});
$('svStart').onclick=()=>act({action:'start'});
const campPage=kind=>{if(state)location.href='/survivor-camp.html?'+new URLSearchParams({id:state.id,kind});};
$('svWaterLog').onclick=()=>campPage('water');$('svFoodLog').onclick=()=>campPage('food');$('svFireLog').onclick=()=>campPage('fire');$('svWeatherLog').onclick=()=>campPage('weather');
load();setInterval(clock,1000);setInterval(()=>{if(!document.hidden)load();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
