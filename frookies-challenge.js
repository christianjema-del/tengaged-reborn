import {renderChallengeLeaderboard} from '/casting-leaderboard.js?v=159';
// Keep challenge loading independent from the avatar/market module tree.
async function api(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(url,{credentials:'include',cache:'no-store',signal:controller.signal});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.message||data.error||'No se pudo consultar la partida.');return data;}catch(e){if(controller.signal.aborted)throw Error('La conexión ha tardado demasiado. Pulsa Reintentar conexión.');throw e;}finally{clearTimeout(timer);}}
window.FrookiesChallengeReady145=true;
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=159';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=Number(params.get('id')),round=Number(params.get('round'));
const previews={wheel:'wheel-of-fortune',numbers:'numbers',deal:'deal-or-no-deal',match:'match-three',guitar:'guitar',endurance:'endurance',maze:'maze',snow:'snow-flakes',words:'words',line:'line-balls'};
const descriptions={wheel:'Haz girar la rueda y trata de resolver los puzles.',numbers:'Cuenta los cubos, cuenta los puntos y encuentra la ecuación.',deal:'Abre los maletines y consigue el importe máximo.',match:'Intercambia dos piezas para formar una línea de tres o más.',endurance:'Sigue el objetivo tanto tiempo como puedas.',words:'Encuentra el mayor número de palabras posible.',guitar:'Un juego del tipo Guitar Hero.',maze:'Encuentra el camino a través del laberinto.',snow:'Recoge los copos y completa la prueba.',line:'Conecta bolas del mismo color formando cadenas.'};
let state=null,playing=false,loading=false,launching=false,dispose=null,launchEpoch=0,launchFailed=false,resetAt=null;
const valid=Number.isSafeInteger(id)&&id>0&&Number.isSafeInteger(round)&&round>0;
if(valid)$('challengeBack').href='/frookies.html?id='+id;
function stop(){launchEpoch++;dispose?.();dispose=null;playing=false;}
function canPlay(){return state?.round===round&&!['waiting','warmup','jury','finished'].includes(state.phase)&&state.me?.status==='active'&&!state.me.hasScore;}
function catalogue(){const root=$('challengeCatalogue');if(!root)return;for(const kind of ['wheel','numbers','deal','match','endurance','words','guitar','maze','snow','line']){const row=document.createElement('article'),img=document.createElement('img'),copy=document.createElement('p'),name=document.createElement('strong');row.className='challenge-catalogue-item';row.dataset.kind=kind;img.src='/assets/minigames/regaged-capturas/'+previews[kind]+'.png';img.alt=CASTING_MINIGAMES[kind];img.loading='lazy';name.textContent=CASTING_MINIGAMES[kind]+' ';copy.append(name,document.createTextNode(descriptions[kind]));row.append(img,copy);root.append(row);}}
catalogue();
async function beginChallenge(){
 if(playing||launching||!canPlay())return;
 launching=true;launchFailed=false;playing=true;$('challengeStatus').textContent='Cargando el minijuego… Puede tardar unos segundos la primera vez.';const epoch=++launchEpoch;$('challengeBoard').hidden=false;$('challengeStart').hidden=true;
 try{const cleanup=await launchCastingMinigame($('challengeBoard'),state.challenge,{competitive:true,frookies:true,contextId:id,round});if(epoch!==launchEpoch)cleanup?.();else {dispose=cleanup;$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu resultado se guardará automáticamente.';}}
 catch(e){if(epoch===launchEpoch){stop();launchFailed=true;$('challengeStatus').textContent=e.message;$('challengeStart').hidden=false;}}
 finally{launching=false;}
}
async function refresh(){
 if(loading)return;loading=true;
 try{
 if(!valid)throw Error('Elige el desafío desde la página de tu Frookies.');
 const data=await api('/api/frookies?id='+id);state=data.match;if(resetAt!==null&&resetAt!==state.runId){stop();launchFailed=false;}resetAt=state.runId??null;$('challengeRetry').hidden=true;
 $('challengeTitle').textContent='Desafío · Frookies #'+id+' · Ronda '+round;renderChallengeLeaderboard($('challengeLeaderboard'),state,round,{gameName:'Frookies',roundLabel:'Ronda',challengePath:'/frookies-challenge.html'});
 const kind=state.round===round?state.challenge:state.challengeHistory?.find(d=>d.round===round)?.challenge;
 $('challengeGameName').textContent=CASTING_MINIGAMES[kind]||'Desafío';if($('challengeDuration'))$('challengeDuration').textContent=(state.me?.challengeTime?.duration??150)+' segundos';
 for(const row of $('challengeCatalogue')?.children||[])row.classList.toggle('selected',row.dataset.kind===kind);
 if(state.round===round&&state.me?.hasScore){const completedHere=playing;stop();$('challengeBoard').hidden=true;$('challengeStart').hidden=true;$('challengeRules').hidden=false;$('challengeStatus').textContent='Desafío completado.';$('challengeResult').textContent='Resultado guardado: '+state.me.score+' puntos. Ya puedes volver al juego.';if(completedHere)$('challengeLeaderboard')?.scrollIntoView?.({behavior:'smooth',block:'start'});return;}
 if(state.paused&&!playing){$('challengeStart').hidden=true;$('challengeStatus').textContent='Partida pausada. Las pruebas ya iniciadas pueden guardar su resultado; espera a la reanudación para empezar.';return;}
 if(state.round!==round||['waiting','warmup','jury','finished'].includes(state.phase)||state.me?.status!=='active'){stop();$('challengeStart').hidden=true;$('challengeRules').hidden=false;$('challengeBoard').replaceChildren();$('challengeBoard').hidden=true;$('challengeStatus').textContent=state.round!==round?'La ronda ha cambiado. Vuelve al Frookies para abrir el desafío actual.':!state.me?'No participas en este Frookies. Puedes consultar los resultados, pero solo los concursantes inscritos pueden jugar el desafío.':'El desafío no está disponible en este momento.';return;}
 $('challengeResult').textContent='';$('challengeRules').hidden=false;const time=state.me?.challengeTime;if(time&&$('challengeTimeBreakdown'))$('challengeTimeBreakdown').textContent='PoV ganados en rondas anteriores: '+time.povWins+' · Tiempo: '+time.duration+' segundos.'+(time.locked?' · Tiempo fijado para este intento.':' · Cada PoV ganado resta 5 segundos al siguiente desafío.');if(!playing&&!launching&&!launchFailed)$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu puntuación se confirmará al terminar.';
 if(!playing&&!launching&&!launchFailed)beginChallenge();
 }catch(e){if(!playing)state=null;$('challengeStatus').textContent=playing?'La conexión se ha interrumpido. Mantén el minijuego abierto; reintentaremos consultar el guardado.':e.message;$('challengeRetry').hidden=false;if(!playing)$('challengeStart').hidden=true;const root=$('challengeLeaderboard');if(root&&!root.dataset.signature){root.setAttribute('aria-busy','false');root.replaceChildren();const title=document.createElement('h2'),message=document.createElement('p');title.textContent='Los resultados de hoy para la Prueba de Frookies';message.textContent='No se pudieron cargar los resultados. Pulsa Reintentar conexión.';root.append(title,message);}}
 finally{loading=false;}
}
addEventListener('pagehide',()=>{if(!playing)stop();});
$('challengeStart').onclick=async()=>{launchFailed=false;await refresh();if(canPlay())await beginChallenge();};
$('challengeRetry').onclick=refresh;
if($('challengeScoresRefresh'))$('challengeScoresRefresh').onclick=refresh;
refresh();setInterval(()=>{if(!document.hidden)refresh();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});

addEventListener('online',()=>refresh());
addEventListener('pageshow',event=>{if(event.persisted)refresh();});
