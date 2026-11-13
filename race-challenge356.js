import {request as fetch} from '/http.js?v=170';
import {showFinished} from '/challenge-finished314.js?v=314';
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=356';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=Number(params.get('id')),stage=Number(params.get('stage'));
let loading=false,playing=false,dispose=null,failed=false;
$('challengeReturn').href='/race.html?id='+id;
function stop(){dispose?.();dispose=null;playing=false;}
async function refresh(){if(loading)return;loading=true;try{
 if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(stage)||stage<1)throw Error('Enlace de desafío no válido. Vuelve al juego.');
 const r=await fetch('/api/race?id='+id,{credentials:'include',cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||'No se pudo consultar el desafío.');const s=d.match;
 $('challengeTitle').textContent='Race #'+id+' · '+(CASTING_MINIGAMES[s.challenge]||'Desafío');$('challengeRetry').hidden=true;
 if(s.stage!==stage||!s.me?.canPlay){stop();$('challengeBoard').hidden=true;$('challengeStatus').textContent=s.stage!==stage?'La etapa ha cambiado. Vuelve al juego para abrir la prueba actual.':'Esta prueba no está disponible para tu cuenta.';return;}
 if(s.me.saved){stop();$('challengeBoard').hidden=true;$('challengeStatus').textContent='';showFinished($('challengeResult'),s.me.score);return;}
 if(!playing&&!failed){$('challengeBoard').hidden=false;$('challengeStatus').textContent='Cargando la prueba. Pulsa START dentro del minijuego para comenzar.';playing=true;try{dispose=await launchCastingMinigame($('challengeBoard'),s.challenge,{competitive:true,race:true,contextId:id,round:stage});}catch(e){playing=false;failed=true;throw e;}}
 }catch(e){$('challengeStatus').textContent=playing?'Conexión interrumpida. Mantén la prueba abierta; comprobaremos el guardado de nuevo.':e.message;$('challengeRetry').hidden=false;}finally{loading=false;}}
$('challengeRetry').onclick=()=>{failed=false;refresh();};
addEventListener('pagehide',()=>stop());addEventListener('online',()=>refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
refresh();setInterval(()=>{if(!document.hidden)refresh();},10000);
