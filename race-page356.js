// V356: página de Race (misma maqueta que El Duelo).
import {request as fetch} from '/http.js?v=170';
import {setAvatar} from '/avatar-display.js?v=337';
import {refreshPlayerActivity} from '/player-activity.js?v=302';
import {CASTING_MINIGAMES} from '/minigame-catalog.js?v=159';
const $=id=>document.getElementById(id),el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
let id=Number(new URLSearchParams(location.search).get('id'))||0,s=null,busy=false,loading=false,offset=0,roster='',pairsSig='',legsSig='';
const euros=n=>Number(n||0).toLocaleString('es-ES')+' €';
const name=userId=>s.players.find(p=>p.id===userId)?.username||'—';
function person(p){
 const card=el('div','','duel-person race-person'+(p.status==='eliminated'?' eliminated':'')),a=el('a',p.username),photo=el('img'),seen=el('small','…');
 photo.alt=p.username;if(p.bot)photo.src='/assets/hunger/tributes/0.svg';else setAvatar(photo,p.username);
 a.href='/profile.html?username='+encodeURIComponent(p.username);const portrait=el('a');portrait.href=a.href;portrait.append(photo);
 if(!p.bot)seen.dataset.playerLastSeen=p.username;else{seen.textContent='Bot';a.removeAttribute('href');portrait.removeAttribute('href');}
 // V357: el transporte de cada pareja es privado y no se muestra en los avatares de arriba.
 const badge=p.placement?el('b',p.placement+'º','duel-place'):p.pair?el('b','Equipo '+p.pair,'race-team-badge race-team-'+(((p.pair-1)%6)+1)):el('b');
 card.append(portrait,a,seen,badge);
 if(p.challengePending){const clock=el('img','','duel-wait220');clock.src='/assets/ui/wait-clock.gif';clock.alt='Prueba pendiente';portrait.append(clock);}
 return card;
}
async function load(input){if(loading||busy)return;loading=true;busy=!!input;try{
 if(!id){const r=await fetch('/api/race',{cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||'No disponible');id=d.matches.find(g=>g.mine&&g.phase!=='finished')?.id||d.matches.find(g=>g.phase==='waiting')?.id;if(!id)throw Error('No hay partida disponible.');history.replaceState(null,'','/race.html?id='+id);location.reload();return;}
 const r=await fetch('/api/race?id='+id,{method:input?'POST':'GET',credentials:'include',cache:'no-store',...(input?{headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})}),d=await r.json();
 if(!r.ok||!d.ok)throw Error(d.message||'No se pudo cargar Race.');s=d.match;offset=s.now-Date.now();render();$('duel-notice').textContent=input?'Guardado.':'';
 }catch(e){$('duel-notice').textContent=e.message;}finally{busy=false;loading=false;}}
function render(){
 $('duel-title').textContent='Race #'+s.id;document.title='Race #'+s.id+' · Tengaged Reborn';
 $('duel-state').textContent={waiting:'ESPERANDO',leg:'ETAPA '+s.leg,final:'ETAPA FINAL',finished:'TERMINADO'}[s.phase]||'';
 const sig=JSON.stringify(s.players);if(sig!==roster){roster=sig;$('duel-players').replaceChildren(...s.players.map(person));for(let i=s.players.length;i<12;i++)$('duel-players').append(el('div','RACE'[(i-s.players.length)%4],'duel-empty'));refreshPlayerActivity($('duel-players'));}
 $('duel-start').hidden=!s.canStart;$('duel-fill-bots').hidden=!s.canFillBots;
 $('duel-entry').hidden=s.phase!=='waiting'||!!s.me;$('duel-enroll').href='/enroll-game.html?type=race&id='+id;
 $('duel-winners').hidden=s.phase!=='finished';$('race-trip').hidden=s.phase==='finished';
 if(s.phase==='finished')$('duel-podium').replaceChildren(...s.players.filter(p=>p.placement===1).map(person));
 trip();pairs();legs();whispers();clock();
}
function trip(){
 const playing=['leg','final'].includes(s.phase),me=s.me;
 $('race-trip-title').textContent=s.phase==='waiting'?'Inscripciones abiertas':s.phase==='final'?'🏁 Etapa final':'🚩 Etapa '+s.leg;
 $('race-route').replaceChildren();
 if(playing&&s.route){$('race-route').append(document.createTextNode('📍 '+s.route[0]),el('span',' → ','race-arrow'),document.createTextNode('📍 '+s.route[1]));}
 $('race-wallet').textContent=me&&playing?'Te quedan '+euros(me.money)+' de presupuesto':'';
 // V358: debajo del presupuesto, el nombre de tu pareja y el transporte que ha elegido (si ya lo ha hecho).
 if(me?.partner){
  const partner=s.players.find(p=>p.id===me.partner),pname=partner?.username||name(me.partner);
  const ptransport=playing&&partner?.transport&&s.transports[partner.transport];
  $('race-partner').textContent='Tu pareja: '+pname+(playing?(ptransport?' · '+ptransport.icon+' '+ptransport.name:' · todavía no ha elegido transporte'):'');
 }else $('race-partner').textContent='';
 let note='';
 if(s.phase==='waiting')note=s.players.length+' de 12 plazas. Cada viajero empieza con '+euros(s.startMoney)+'.';
 else if(!me)note='Sigue la carrera: cada etapa, la pareja que llega la última queda eliminada.';
 else if(me.status!=='active')note='Tu pareja ha quedado fuera de la carrera'+(me.placement?' en el puesto '+me.placement:'')+'. Puedes seguir leyendo el chat.';
 else if(me.saved)note='Prueba guardada: '+me.score+' puntos'+(me.points!==me.score?' ('+me.points+' con tu transporte)':'')+'. Los resultados se verán al llegar.';
 else note=(me.hasAttempt?'Has empezado la prueba: tu transporte ya está decidido. ':'Elige cómo viajar y juega ')+(CASTING_MINIGAMES[s.challenge]||'la prueba')+'. Solo hay un intento.';
 $('race-note').textContent=note;
 const box=$('race-transports'),choose=playing&&me?.status==='active'&&!me.hasAttempt;box.hidden=!(playing&&me?.status==='active');
 if(!box.hidden)box.replaceChildren(...Object.entries(s.transports).map(([kind,t])=>{
  const chosen=(me.transport||'walk')===kind,afford=me.money+(me.transport?s.transports[me.transport].cost:0)>=t.cost;
  const b=el('button','','race-transport'+(chosen?' chosen':''));b.type='button';b.disabled=!choose||!afford||chosen;b.setAttribute('aria-pressed',String(chosen));
  // V358: entre paréntesis, lo que suma ese transporte a tu resultado: la cifra exacta si ya conoces tu puntuación de esta etapa, si no un «?».
  const added=t.bonus?' (+'+(me.saved?Math.round(me.score*t.bonus):'?')+')':'';
  b.append(el('span',t.icon,'race-transport-icon'),el('strong',t.name),el('small',(t.cost?euros(t.cost):'Gratis')+(t.bonus?' · +'+Math.round(t.bonus*100)+' %'+added:'')));
  b.title=!afford?'No te llega el presupuesto':chosen?'Transporte elegido':'Viajar en '+t.name.toLowerCase();
  b.onclick=()=>load({action:'transport',kind,stage:s.stage});return b;}));
 $('race-play').hidden=!(playing&&me?.canPlay&&!me.saved);$('race-play').textContent=me?.hasAttempt?'Reanudar prueba':'Jugar prueba';
}
function pairs(){
 // V357: el dinero de las demás parejas es privado; aquí solo se ve tu pareja.
 const root=$('race-pairs'),me=s.me,pr=me?.pair?s.pairs.find(x=>x.id===me.pair):null;
 const sig=JSON.stringify([pr,me?.money,s.players.find(p=>p.id===me?.partner)]);if(sig===pairsSig)return;pairsSig=sig;
 if(!me||!pr){root.replaceChildren(el('p','Tu pareja se forma al azar cuando empieza el juego.'));return;}
 const partner=s.players.find(p=>p.id===me.partner);
 const box=el('div','','race-mypair'+(pr.status==='eliminated'?' out':''));
 const team=el('b','Equipo '+pr.id,'race-team-badge race-team-'+(((pr.id-1)%6)+1));box.append(team);
 const grid=el('div','','race-mypair-people');grid.append(person({id:me.id,username:me.username,status:me.status,placement:me.placement,bot:false}));
 if(partner)grid.append(person(partner));
 box.append(grid);
 const money=(Number(me.money)||0)+(Number(partner?.money)||0);
 box.append(el('p',pr.placement?pr.placement+'º puesto':'Entre los dos: '+euros(money),'race-pair-state'));
 root.replaceChildren(box);
}
function legs(){
 const sig=JSON.stringify(s.history.length);if(sig===legsSig)return;legsSig=sig;if(!s.history.length)return;
 $('race-legs').replaceChildren(...[...s.history].reverse().map(h=>{const box=el('details','','race-leg');const sum=el('summary',(h.leg?'Etapa '+h.leg+': ':'')+h.from+' → '+h.to);box.append(sum);
  const ol=el('ol');for(const r of h.results){const li=el('li');li.append(el('b','Equipo '+r.pair+' · '+r.points+' pts'),el('span',' '+r.members.map(m=>{const icon=s.transports[m.transport]?.icon;return m.username+' ('+(icon?icon+' ':'')+m.points+')';}).join(', ')));ol.append(li);}
  box.append(ol);return box;}));
 $('race-legs').firstChild.open=true;
}
function whispers(){
 const allowed=s.me?.status==='active'&&s.phase!=='finished';$('duel-whisper-form').hidden=!allowed;const select=$('duel-whisper-to'),previous=select.value;
 select.replaceChildren(...s.players.filter(p=>!p.bot&&p.status==='active'&&p.id!==s.me?.id).map(p=>{const o=el('option',p.username+(p.id===s.me?.partner?' (tu pareja)':''));o.value=p.id;return o;}));if([...select.options].some(o=>o.value===previous))select.value=previous;
 $('duel-whisper-list').replaceChildren(...s.whispers.map(w=>el('p',name(w.from)+' → '+name(w.to)+': '+w.body)));if(!s.whispers.length)$('duel-whisper-list').append(el('p','No hay mensajes privados.'));
}
function clock(){if(!s)return;const sec=Math.max(0,Math.ceil((s.deadline-(Date.now()+offset))/1000));$('duel-clock').textContent=s.phase==='finished'||!s.deadline?'':(s.phase==='waiting'?'Empieza en ':'')+Math.floor(sec/3600)+':'+String(Math.floor(sec/60)%60).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
$('duel-start').onclick=()=>load({action:'start'});$('duel-fill-bots').onclick=()=>load({action:'fill_bots'});
$('race-play').onclick=()=>{if(!s?.me?.canPlay||s.me.saved)return;location.href='/race-challenge.html?id='+id+'&stage='+s.stage;};
$('duel-whisper-form').onsubmit=async e=>{e.preventDefault();const body=$('duel-whisper-body').value.trim();if(!body)return;const old=s?.whispers.length;await load({action:'whisper',to:Number($('duel-whisper-to').value),body});if(s?.whispers.length>old)$('duel-whisper-body').value='';};
for(const [button,isPrivate]of [['duel-public',false],['duel-private',true]])$(button).onclick=()=>{$('public-chat').hidden=isPrivate;$('duel-whispers').hidden=!isPrivate;$('duel-public').setAttribute('aria-pressed',String(!isPrivate));$('duel-private').setAttribute('aria-pressed',String(isPrivate));};
const chat=$('public-chat');let imageSignature='';new MutationObserver(()=>{const sources=[...new Set([...chat.querySelectorAll('.embedded-media img')].map(i=>i.src))].slice(0,3),sig=JSON.stringify(sources);if(sig===imageSignature)return;imageSignature=sig;$('duel-images').replaceChildren(...sources.map(src=>{const a=el('a'),img=el('img');a.href=src;a.target='_blank';a.rel='noopener noreferrer';img.src=src;img.alt='Imagen compartida';img.loading='lazy';a.append(img);return a;}));if(!sources.length)$('duel-images').textContent='No hay imágenes enviadas todavía.';}).observe(chat,{subtree:true,childList:true});
$('duel-images').textContent='No hay imágenes enviadas todavía.';load();setInterval(()=>{if(!document.hidden)load();},20000);setInterval(clock,1000);
