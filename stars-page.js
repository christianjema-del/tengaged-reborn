// V373: página de Stars (misma maqueta que El Duelo / Race), con nominaciones, pareja de nominados y voto.
import {request as fetch} from '/http.js?v=170';
import {setAvatar} from '/avatar-display.js?v=337';
import {refreshPlayerActivity} from '/player-activity.js?v=302';
const $=id=>document.getElementById(id),el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
let id=Number(new URLSearchParams(location.search).get('id'))||0,s=null,busy=false,loading=false,offset=0,roster='',historySig='';
function person(p){
 const card=el('div','','duel-person'+(p.status==='eliminated'?' eliminated':'')),a=el('a',p.username),photo=el('img'),seen=el('small','…');
 photo.alt=p.username;if(p.bot)photo.src='/assets/hunger/tributes/0.svg';else setAvatar(photo,p.username);
 a.href='/profile.html?username='+encodeURIComponent(p.username);const portrait=el('a');portrait.href=a.href;portrait.append(photo);
 if(!p.bot)seen.dataset.playerLastSeen=p.username;else{seen.textContent='Prueba';a.removeAttribute('href');portrait.removeAttribute('href');}
 const badge=p.placement?el('b',p.placement+'º','duel-place'):p.nominated?el('b','NOM','duel-nominated220'):el('b');
 card.append(portrait,a,seen,badge);return card;
}
async function load(input){if(loading||busy)return;loading=true;busy=!!input;try{
 if(!id){const r=await fetch('/api/stars',{cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||'No disponible');id=d.matches.find(g=>g.mine&&g.phase!=='finished')?.id||d.matches.find(g=>g.phase==='waiting')?.id;if(!id)throw Error('No hay partida disponible.');history.replaceState(null,'','/stars.html?id='+id);location.reload();return;}
 const r=await fetch('/api/stars?id='+id,{method:input?'POST':'GET',credentials:'include',cache:'no-store',...(input?{headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})}),d=await r.json();
 if(!r.ok||!d.ok)throw Error(d.message||'No se pudo cargar Stars.');s=d.match;offset=s.now-Date.now();render();$('duel-notice').textContent=input?'Guardado.':'';
 }catch(e){$('duel-notice').textContent=e.message;}finally{busy=false;loading=false;}}
function render(){
 $('duel-title').textContent='Stars #'+s.id;document.title='Stars #'+s.id+' · Tengaged Reborn';
 $('duel-state').textContent={waiting:'ESPERANDO',nominate:'DÍA '+s.round+' · NOMINACIONES',vote:'DÍA '+s.round+' · VOTACIÓN',final3:'FINAL · TRES',finished:'TERMINADO'}[s.phase]||'';
 $('stars-day').textContent=s.phase==='waiting'?'—':s.round;
 $('stars-next-phase').textContent={waiting:'Inicio',nominate:'Votación',vote:'Expulsión',final3:'Resultado final',finished:'—'}[s.phase]||'';
 $('stars-test-note').hidden=!(s.testOnly&&s.phase==='waiting');
 const sig=JSON.stringify(s.players);if(sig!==roster){roster=sig;$('duel-players').replaceChildren(...s.players.map(person));for(let i=s.players.length;i<16;i++)$('duel-players').append(el('div','STARS'[(i-s.players.length)%5],'duel-empty'));refreshPlayerActivity($('duel-players'));}
 $('duel-start').hidden=!s.canStart;$('duel-fill-bots').hidden=!s.canFillBots;
 $('race-host-box').hidden=!(s.canPause||s.canResume);$('race-host-pause').textContent=s.paused?'Reanudar partida':'Pausar partida';$('race-host-pause').onclick=()=>load({action:s.paused?'resume':'pause'});$('race-host-status').hidden=!s.paused;
 $('duel-entry').hidden=s.phase!=='waiting'||!!s.me||s.testOnly;$('duel-enroll').href='/enroll-game.html?type=stars&id='+id;
 $('duel-winners').hidden=s.phase!=='finished';
 if(s.phase==='finished')$('duel-podium').replaceChildren(...s.players.filter(p=>p.placement&&p.placement<=3).sort((a,b)=>a.placement-b.placement).map(person));
 actions();history_();whispers();clock();
}
function actions(){
 const me=s.me,title=$('stars-phase-title'),note=$('stars-phase-note');
 title.textContent={waiting:'Inscripciones abiertas',nominate:'Nominaciones del día '+s.round,vote:'Votación del día '+s.round,final3:'Última prueba: tercer puesto',finished:'Partida terminada'}[s.phase]||'';
 note.textContent=s.phase==='waiting'?s.players.length+' de 16 plazas.':!me?'Sigue la partida: cada día se nomina y se vota a quién expulsar.':me.status!=='active'?'Has quedado fuera'+(me.placement?' en el puesto '+me.placement:'')+'. Puedes seguir leyendo el chat.':s.phase==='nominate'?(me.canNominate?'Elige a dos compañeros para nominar.':'Ya has nominado. Esperando al resto.'):s.phase==='vote'?(s.nominees.includes(me.id)?'Estás nominado/a. Espera el resultado de la votación.':me.canVote?'Vota a quién de los dos nominados expulsar.':'Ya has votado. Esperando al resto.'):s.phase==='final3'?(me.canFinalPick?'Elige a quién crees que debe quedar tercero.':'Ya has elegido. Esperando al resto.'):'';
 const nominateForm=$('stars-nominate-form');nominateForm.hidden=!(me?.canNominate);
 if(me?.canNominate){const picked=new Set();$('stars-nominate-list').replaceChildren(...s.players.filter(p=>p.status==='active'&&p.id!==me.id).map(p=>{const b=el('button',p.username,'market-btn');b.type='button';b.onclick=()=>{if(picked.has(p.id)){picked.delete(p.id);b.classList.remove('chosen');}else if(picked.size<2){picked.add(p.id);b.classList.add('chosen');}};return b;}));nominateForm.onsubmit=async e=>{e.preventDefault();if(picked.size!==2){$('duel-notice').textContent='Elige exactamente a dos compañeros.';return;}await load({action:'nominate',targets:[...picked]});};}
 const voteForm=$('stars-vote-form');voteForm.hidden=!(me?.canVote);
 if(me?.canVote){let chosen=null;$('stars-vote-list').replaceChildren(...s.nominees.map(nid=>{const p=s.players.find(x=>x.id===nid),b=el('button',p?.username||'—','market-btn');b.type='button';b.onclick=()=>{chosen=nid;[...$('stars-vote-list').children].forEach(c=>c.classList.remove('chosen'));b.classList.add('chosen');};return b;}));voteForm.onsubmit=async e=>{e.preventDefault();if(!chosen){$('duel-notice').textContent='Elige a quién expulsar.';return;}await load({action:'vote',target:chosen});};}
 const finalForm=$('stars-final-form');finalForm.hidden=!(me?.canFinalPick);
 if(me?.canFinalPick){let chosen=null;$('stars-final-list').replaceChildren(...s.players.filter(p=>p.status==='active'&&p.id!==me.id).map(p=>{const b=el('button',p.username,'market-btn');b.type='button';b.onclick=()=>{chosen=p.id;[...$('stars-final-list').children].forEach(c=>c.classList.remove('chosen'));b.classList.add('chosen');};return b;}));finalForm.onsubmit=async e=>{e.preventDefault();if(!chosen){$('duel-notice').textContent='Elige a un compañero.';return;}await load({action:'final_pick',target:chosen});};}
}
function history_(){
 const sig=JSON.stringify(s.history.length);if(sig===historySig)return;historySig=sig;if(!s.history.length){$('stars-history').replaceChildren(el('p','Todavía no ha pasado nada.'));return;}
 $('stars-history').replaceChildren(...[...s.history].reverse().map(h=>{const box=el('details','','race-leg');const title=h.phase==='final3'?'Última prueba: tercer puesto':'Día '+h.round;const sum=el('summary',title);box.append(sum);const p=el('p',h.phase==='final3'?(s.players.find(x=>x.id===h.third)?.username||'—')+' queda en el tercer puesto.':(s.players.find(x=>x.id===h.evicted)?.username||'—')+' queda eliminado/a.');box.append(p);return box;}));
 $('stars-history').firstChild.open=true;
}
function whispers(){
 const allowed=s.me?.status==='active'&&s.phase!=='finished';$('duel-whisper-form').hidden=!allowed;const select=$('duel-whisper-to'),previous=select.value;
 select.replaceChildren(...s.players.filter(p=>!p.bot&&p.status==='active'&&p.id!==s.me?.id).map(p=>{const o=el('option',p.username);o.value=p.id;return o;}));if([...select.options].some(o=>o.value===previous))select.value=previous;
 $('duel-whisper-list').replaceChildren(...s.whispers.map(w=>{const from=s.players.find(p=>p.id===w.from)?.username||'—',to=s.players.find(p=>p.id===w.to)?.username||'—';return el('p',from+' → '+to+': '+w.body);}));if(!s.whispers.length)$('duel-whisper-list').append(el('p','No hay mensajes privados.'));
}
function clock(){if(!s)return;const sec=Math.max(0,Math.ceil((s.deadline-(Date.now()+offset))/1000));$('duel-clock').textContent=s.phase==='finished'||!s.deadline?'':(s.phase==='waiting'?'Empieza en ':'')+Math.floor(sec/3600)+':'+String(Math.floor(sec/60)%60).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
$('duel-start').onclick=()=>load({action:'start'});$('duel-fill-bots').onclick=()=>load({action:'fill_bots'});
$('duel-whisper-form').onsubmit=async e=>{e.preventDefault();const body=$('duel-whisper-body').value.trim();if(!body)return;const old=s?.whispers.length;await load({action:'whisper',to:Number($('duel-whisper-to').value),body});if(s?.whispers.length>old)$('duel-whisper-body').value='';};
for(const [button,isPrivate]of [['duel-public',false],['duel-private',true]])$(button).onclick=()=>{$('public-chat').hidden=isPrivate;$('duel-whispers').hidden=!isPrivate;$('duel-public').setAttribute('aria-pressed',String(!isPrivate));$('duel-private').setAttribute('aria-pressed',String(isPrivate));};
const chat=$('public-chat');let imageSignature='';new MutationObserver(()=>{const sources=[...new Set([...chat.querySelectorAll('.embedded-media img')].map(i=>i.src))].slice(0,3),sig=JSON.stringify(sources);if(sig===imageSignature)return;imageSignature=sig;$('duel-images').replaceChildren(...sources.map(src=>{const a=el('a'),img=el('img');a.href=src;a.target='_blank';a.rel='noopener noreferrer';img.src=src;img.alt='Imagen compartida';img.loading='lazy';a.append(img);return a;}));if(!sources.length)$('duel-images').textContent='No hay imágenes enviadas todavía.';}).observe(chat,{subtree:true,childList:true});
$('duel-images').textContent='No hay imágenes enviadas todavía.';load();setInterval(()=>{if(!document.hidden)load();},20000);setInterval(clock,1000);
