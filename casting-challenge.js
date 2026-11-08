import {renderChallengeLeaderboard} from '/casting-leaderboard.js?v=159';
import {api} from '/market-ui.js?v=170';
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=303';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=Number(params.get('id')),round=Number(params.get('round'));
const previews={wheel:'wheel-of-fortune',numbers:'numbers',deal:'deal-or-no-deal',match:'match-three',guitar:'guitar',endurance:'endurance',maze:'maze',snow:'snow-flakes',words:'words',line:'line-balls'};
const descriptions={wheel:'Haz girar la rueda y trata de resolver los puzles.',numbers:'Cuenta los cubos, cuenta los puntos y encuentra la ecuación.',deal:'Abre los maletines y consigue el importe máximo.',match:'Intercambia dos piezas para formar una línea de tres o más.',endurance:'Sigue el objetivo tanto tiempo como puedas.',words:'Encuentra el mayor número de palabras posible.',guitar:'Un juego del tipo Guitar Hero.',maze:'Encuentra el camino a través del laberinto.',snow:'Recoge los copos y completa la prueba.',line:'Conecta bolas del mismo color formando cadenas.'};
let state=null,playing=false,loading=false,launching=false,dispose=null,launchEpoch=0,launchFailed=false,resetAt=null;
const valid=Number.isSafeInteger(id)&&id>0&&Number.isSafeInteger(round)&&round>0;
if(valid)$('challengeBack').href='/casting-game.html?id='+id;
function stop(){launchEpoch++;dispose?.();dispose=null;playing=false;}
function canPlay(){return state?.daily&&state.round===round&&!['waiting','finished'].includes(state.phase)&&state.me?.status==='active'&&!state.me.hasReacted;}
function catalogue(){const root=$('challengeCatalogue');if(!root)return;for(const kind of ['wheel','numbers','deal','match','endurance','words','guitar','maze','snow','line']){const row=document.createElement('article'),img=document.createElement('img'),copy=document.createElement('p'),name=document.createElement('strong');row.className='challenge-catalogue-item';row.dataset.kind=kind;img.src='/assets/minigames/regaged-capturas/'+previews[kind]+'.png';img.alt=CASTING_MINIGAMES[kind];img.loading='lazy';name.textContent=CASTING_MINIGAMES[kind]+' ';copy.append(name,document.createTextNode(descriptions[kind]));row.append(img,copy);root.append(row);}}
catalogue();
async function beginChallenge(){
 if(playing||launching||!canPlay())return;
 launching=true;launchFailed=false;playing=true;const epoch=++launchEpoch;$('challengeBoard').hidden=false;$('challengeStart').hidden=true;
 try{const cleanup=await launchCastingMinigame($('challengeBoard'),state.challenge,{competitive:true,contextId:id,round});if(epoch!==launchEpoch)cleanup?.();else dispose=cleanup;}
 catch(e){if(epoch===launchEpoch){stop();launchFailed=true;$('challengeStatus').textContent=e.message;$('challengeStart').hidden=false;}}
 finally{launching=false;}
}
async function refresh(){
 if(loading)return;loading=true;
 try{
 if(!valid)throw Error('Elige el desafío desde la página de tu Casting.');
 const data=await api('/api/castings?id='+id);state=data.match;if(resetAt!==null&&resetAt!==state.challengeResetAt){stop();launchFailed=false;}resetAt=state.challengeResetAt??null;$('challengeRetry').hidden=true;
 $('challengeTitle').textContent='Desafío · Casting #'+id+' · Día '+round;renderChallengeLeaderboard($('challengeLeaderboard'),state,round);
 const kind=state.round===round?state.challenge:state.challengeHistory?.find(d=>d.round===round)?.challenge;
 $('challengeGameName').textContent=CASTING_MINIGAMES[kind]||'Desafío';if($('challengeDuration'))$('challengeDuration').textContent=(state.me?.challengeTime?.duration??100)+' segundos';
 for(const row of $('challengeCatalogue')?.children||[])row.classList.toggle('selected',row.dataset.kind===kind);
 if(!state.daily||state.round!==round||['waiting','finished'].includes(state.phase)||state.me?.status!=='active'){stop();$('challengeStart').hidden=true;$('challengeRules').hidden=false;$('challengeBoard').replaceChildren();$('challengeBoard').hidden=true;$('challengeStatus').textContent=state.round!==round?'El día ha cambiado. Vuelve al Casting para abrir el desafío actual.':!state.me?'Debes estar inscrito en esta partida para jugar.':'El desafío no está disponible en este momento.';return;}
 if(state.me.hasReacted){const completedHere=playing;stop();$('challengeBoard').hidden=true;$('challengeStart').hidden=true;$('challengeRules').hidden=false;$('challengeStatus').textContent='Desafío completado.';$('challengeResult').textContent='Resultado guardado: '+state.me.challengePoints+' puntos. Ya puedes volver al juego.';if(completedHere)$('challengeLeaderboard')?.scrollIntoView?.({behavior:'smooth',block:'start'});return;}
 $('challengeResult').textContent='';$('challengeRules').hidden=false;const time=state.me?.challengeTime;if(time&&$('challengeTimeBreakdown'))$('challengeTimeBreakdown').textContent=(state.round===1?'Día 1: todos disponen de 100 segundos.':'Posición por tics naranjas: '+(time.checksRank||'—')+' · Tiempo: '+time.duration+' s')+(time.locked?' · Tiempo fijado para este intento.':' · Se fija al iniciar el intento.');if(!launchFailed)$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu puntuación se confirmará al terminar.';
 if(!playing&&!launching&&!launchFailed)beginChallenge();
 }catch(e){state=null;$('challengeStatus').textContent=e.message;$('challengeRetry').hidden=false;if(!playing)$('challengeStart').hidden=true;const root=$('challengeLeaderboard');if(root&&!root.dataset.signature){root.setAttribute('aria-busy','false');root.replaceChildren();const title=document.createElement('h2'),message=document.createElement('p');title.textContent='Los resultados de hoy para la Prueba de Casting';message.textContent='No se pudieron cargar los resultados. Pulsa Reintentar conexión.';root.append(title,message);}}
 finally{loading=false;}
}
$('challengeStart').onclick=async()=>{launchFailed=false;await refresh();if(canPlay())await beginChallenge();};
$('challengeRetry').onclick=refresh;
if($('challengeScoresRefresh'))$('challengeScoresRefresh').onclick=refresh;
refresh();setInterval(()=>{if(!document.hidden)refresh();},10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});

addEventListener('online',()=>refresh());
addEventListener('pageshow',event=>{if(event.persisted)refresh();});
