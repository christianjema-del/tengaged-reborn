// V303: prueba de tribu o de inmunidad de Survivor con los minijuegos Flash originales.
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=303';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const id=Number(params.get('id')),day=Number(params.get('day')),mode=params.get('mode')==='immunity'?'immunity':'tribe';
const previews={wheel:'wheel-of-fortune',numbers:'numbers',deal:'deal-or-no-deal',match:'match-three',guitar:'guitar',endurance:'endurance',maze:'maze',snow:'snow-flakes',words:'words',line:'line-balls'};
let state=null,playing=false,launching=false,loading=false,dispose=null,epoch=0;
const valid=Number.isSafeInteger(id)&&id>0&&Number.isSafeInteger(day)&&day>0;
if(valid)$('challengeBack').href='/survivor.html?id='+id;
$('svcHeading').textContent=mode==='immunity'?'Inmunidad individual':'Prueba de tribu';
async function api(url){const r=await fetch(url,{credentials:'include',cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo consultar la partida.');return d;}
function kindNow(){return mode==='immunity'?state.challenge?.immunityKind:state.challenge?.kind;}
function done(){return mode==='immunity'?state.me?.playedImmunity:state.me?.played;}
function score(){return mode==='immunity'?state.me?.immunityScore:state.me?.score;}
function canPlay(){const me=state?.me;if(!me||me.status!=='active'||state.phase!=='day'||state.day!==day||done())return false;return mode==='immunity'?me.atCouncil:!me.sitting;}
function catalogue(kind){const root=$('challengeCatalogue');root.replaceChildren();for(const k of Object.keys(previews)){const row=document.createElement('article'),img=document.createElement('img'),p=document.createElement('p'),b=document.createElement('strong');row.className='challenge-catalogue-item'+(k===kind?' selected':'');img.src='/assets/minigames/regaged-capturas/'+previews[k]+'.png';img.alt=CASTING_MINIGAMES[k];img.loading='lazy';b.textContent=CASTING_MINIGAMES[k];p.append(b);row.append(img,p);root.append(row);}}
function stop(){epoch++;dispose?.();dispose=null;playing=false;}
async function begin(){
 if(playing||launching||!canPlay())return;launching=true;playing=true;const mine=++epoch;
 $('challengeStatus').textContent='Cargando el minijuego… Puede tardar unos segundos la primera vez.';$('challengeBoard').hidden=false;$('challengeStart').hidden=true;
 try{const cleanup=await launchCastingMinigame($('challengeBoard'),kindNow(),{competitive:true,survivor:true,contextId:id,round:day+':'+mode});if(mine!==epoch)cleanup?.();else{dispose=cleanup;$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu resultado se guardará automáticamente.';}}
 catch(e){if(mine===epoch){stop();$('challengeStatus').textContent=e.message;$('challengeStart').hidden=false;}}
 finally{launching=false;}
}
async function refresh(){
 if(loading)return;loading=true;
 try{
  if(!valid)throw Error('Abre la prueba desde tu partida de Survivor.');
  state=(await api('/api/survivor?id='+id)).match;$('challengeRetry').hidden=true;
  const kind=kindNow();catalogue(kind);$('challengeGameName').textContent=(CASTING_MINIGAMES[kind]||'Prueba')+' · '+(mode==='immunity'?'Inmunidad':'Prueba de tribu');
  $('challengeDuration').textContent=(state.me?.seconds??200)+' segundos';
  if(state.day===day&&done()){const here=playing;stop();$('challengeBoard').hidden=true;$('challengeStatus').textContent='Prueba completada.';$('challengeResult').textContent='Resultado guardado: '+Number(score()).toLocaleString('es-ES')+' puntos. Ya puedes volver al juego.';if(here)scrollTo(0,0);return;}
  if(!canPlay()){if(!playing){$('challengeBoard').hidden=true;$('challengeStatus').textContent=state.day!==day?'El día ha cambiado. Vuelve a Survivor para abrir la prueba actual.':!state.me?'No participas en esta partida de Survivor.':state.me.status!=='active'?'Ya no estás en la partida.':mode==='immunity'?'Hoy tu tribu no juega la inmunidad.':state.me.sitting?'Hoy te sientas: no juegas la prueba de tribu.':'La prueba no está disponible ahora.';}return;}
  if(!playing&&!launching)begin();
 }catch(e){$('challengeStatus').textContent=playing?'La conexión se ha interrumpido. Mantén el minijuego abierto; reintentaremos consultar el guardado.':e.message;$('challengeRetry').hidden=false;}
 finally{loading=false;}
}
$('challengeStart').onclick=()=>{refresh();};$('challengeRetry').onclick=refresh;
addEventListener('pagehide',()=>{if(!playing)stop();});
refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
