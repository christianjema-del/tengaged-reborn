import {setAvatar} from '/avatar-display.js?v=159';
import {refreshPlayerActivity} from '/player-activity.js?v=302';
import {$,el,api,post,buttonTask,profileLink,loginLink} from '/market-ui.js?v=170';
const id=Number(new URLSearchParams(location.search).get('id'))||1;let state=null,stateRevision=0,loading=false,busy=false,clockOffset=0,reactionTimer=null,reactionReady=0,playingReaction=false,challengeStartedAt=0,demoPlaying=false,disposeFlash=null;
async function action(input){if(busy)return;busy=true;stateRevision++;try{const data=await post('/api/castings?id='+id,input);applyState(data.match);$('gameNotice').textContent='Acción guardada.';}catch(e){$('gameNotice').textContent=e.message;}finally{busy=false;updateResourceControls();}}
function sameMatch(a,b){if(!a||!b)return false;const {now:oldNow,commitId:oldCommit,...oldState}=a,{now:newNow,commitId:newCommit,...newState}=b;return JSON.stringify(oldState)===JSON.stringify(newState);}
async function load(){if(busy||loading||demoPlaying)return;loading=true;const revision=stateRevision;try{const data=await api('/api/castings?id='+id);if(!busy&&revision===stateRevision)applyState(data.match);}catch(e){$('gameNotice').textContent=e.message;}finally{loading=false;}}
function applyState(next){clockOffset=next.now-Date.now();
 if(!playingReaction&&sameMatch(state,next)){state=next;timer();return;}
 if(playingReaction&&state&&next.phase===state.phase&&next.round===state.round&&next.me?.status==='active'&&!next.me?.hasReacted){state=next;const status=document.querySelector('[data-flash-status]');if(status&&next.me?.hasAttempt)status.textContent='Prueba en curso. El resultado se guardará al terminar.';const health=document.querySelector('.casting-metrics>div:nth-child(3)>b');if(health&&next.me)health.textContent=String(next.me.health);$('phaseDescription').textContent=next.counts.reactions+'/'+next.counts.active+' pruebas completadas.';updateResourceControls();timer();return;}
 if(playingReaction){playingReaction=false;disposeFlash?.();disposeFlash=null;if(next.me?.hasReacted)$('gameNotice').textContent='Resultado guardado: '+(next.me.challengePoints??0)+' puntos.';}
 state=next;render();}

function button(text,input){const b=el('button',text,'market-btn');b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;await action(input);updateResourceControls();};return b;}
function render(){const s=state,p=s.me;const reward=s.myPrize,notice=$('gameReward186');if(notice){notice.hidden=!reward;notice.textContent=reward?'Puesto '+reward.placement+'º · '+reward.karma+' karma · '+reward.money+' T$ · '+(reward.paymentRecorded?'Premio abonado.':'Abono pendiente de confirmación.') :'';if(reward?.paymentRecorded&&!notice.dataset.receipt186){notice.dataset.receipt186='1';Promise.resolve(window.TengagedRefreshSession?.()).catch(()=>{});}}$('gameTitle').textContent='Casting #'+s.id;const opened=$('openedDate');if(opened)opened.textContent='Abierto el '+formatDate(s.createdAt);$('gameState').textContent=`Ronda ${s.round} · ${s.players.length}/16 participantes · ${s.counts.active} activos`;$('phaseTitle').textContent=({waiting:'Inscripción abierta',immunity:s.counts.active===2?'Prueba final':'Prueba de inmunidad',nominations:'Nominaciones',elimination:'Votación de expulsión',finished:'Partida finalizada'})[s.phase];renderPhaseSteps(s);$('phaseActions').replaceChildren();$('resources').replaceChildren();
$('phaseDescription').textContent=s.phase==='waiting'?'La partida empieza cinco minutos después de la segunda inscripción o al llenarse.':s.phase==='finished'?'Ganador/a: '+s.winner:s.phase==='immunity'?`${s.counts.reactions}/${s.counts.active} pruebas completadas.`:s.phase==='nominations'?`Inmune: ${s.immune}. Han nominado ${s.counts.nominations}/${s.counts.active}.`:`Nominados: ${s.nominees.join(' y ')}. Votos: ${s.counts.ballots}/${s.counts.active}.`;
if(s.phase==='finished'){
 const games=[['wheel','Wheel of Fortune'],['numbers','Numbers'],['deal','Deal or No Deal'],['match','Match Three'],['guitar','Guitar'],['endurance','Endurance'],['maze','Maze'],['snow','Snow Flakes'],['words','Words'],['line','Line Balls']];
 const panel=el('section',undefined,'challenge-card');
 panel.append(el('h3','Modo de prueba · 10 juegos originales'));
 panel.append(el('p','Esta partida sigue finalizada. Puedes probar los juegos sin cambiar su ganador, historial, estadísticas ni puntuaciones.'));
 const picker=el('select');picker.setAttribute('aria-label','Seleccionar minijuego original');
 for(const [key,label] of games){const option=el('option',label);option.value=key;picker.append(option);}
 const launch=el('button','Abrir minijuego original','market-btn');launch.type='button';
 const slot=el('div');const controls=el('div',undefined,'game-vote');
 controls.append(picker,launch);panel.append(controls,slot);$('phaseActions').append(panel);
 launch.onclick=async()=>{
  if(playingReaction)return;
  playingReaction=true;demoPlaying=true;picker.disabled=true;launch.disabled=true;
  controls.replaceChildren();
  const back=el('button','Elegir otro minijuego','market-btn');back.type='button';
  back.onclick=()=>{disposeFlash?.();disposeFlash=null;playingReaction=false;demoPlaying=false;render();};controls.append(back);
  try{const m=await import('/casting-minigame-launcher.js?v=159');
   disposeFlash=await m.launchCastingMinigame(slot,picker.value,{demo:true});
  }catch(err){playingReaction=false;demoPlaying=false;slot.replaceChildren(el('p','No se pudo iniciar: '+(err?.message||err)));}
 };
}
if(s.phase==='waiting'&&!p)$('phaseActions').append(s.user?enrollmentLink(s.id):loginLink('Entrar para unirme'));
if(p&&p.status==='active'&&!['waiting','finished'].includes(s.phase)){
 const metrics=el('div',undefined,'casting-metrics');for(const [symbol,value,label] of [['🗝',p.keys,'Llaves'],['🍏',p.apples,'Manzanas'],['♥',p.health,'Salud'],['DÍA',s.round,'Ronda']]){const metric=el('div');metric.append(el('strong',symbol),el('b',String(value)),el('small',label));metrics.append(metric);}const eat=button('Comer manzana (+20)',{action:'eat_apple'}),rest=button('Descansar (+20)',{action:'rest'});eat.id='casting-eat';rest.id='casting-rest';$('resources').append(metrics,eat,rest);
 if(s.phase==='immunity'&&!p.hasReacted){
  const names={wheel:'Ruleta de palabras',numbers:'Numbers',deal:'Trato o no trato',match:'Match Three',guitar:'Guitar',endurance:'Endurance',maze:'Maze',snow:'Snow Flakes',words:'Words',line:'Line Balls'};
  const box=el('div',undefined,'challenge-card');box.append(el('h3',names[s.challenge]||'Minijuego'));
  box.append(el('p',s.scoringMode==='flash-v1'?'Prueba elegida al azar para esta ronda. Consigue la mayor puntuación: el resultado se guarda automáticamente.':'Esta ronda conserva el sistema anterior. Las pruebas originales aleatorias comienzan en la siguiente ronda.'));
  if(s.scoringMode!=='flash-v1'){box.append(el('p','Administración puede adelantar esta fase para iniciar la nueva rotación.'));$('phaseActions').append(box);}else{
  const start=el('button',p.hasAttempt?'Reanudar prueba':'Jugar prueba','market-btn');start.type='button';start.disabled=!p.hasAttempt&&p.health<20;start.onclick=()=>{
   if(playingReaction)return;playingReaction=true;challengeStartedAt=performance.now();
   start.disabled=true;
   const round=s.round,kind=s.challenge;
   import('/casting-minigame-launcher.js?v=159').then(async m=>{
    disposeFlash=await m.launchCastingMinigame(box,kind,{competitive:true,contextId:s.id,round});
    const retry=el('button','Reabrir el minijuego','plain-btn');retry.type='button';
    retry.onclick=()=>{disposeFlash?.();disposeFlash=null;playingReaction=false;render();};
    box.append(el('p','No cierres esta página mientras juegas. Si se interrumpe, reabrir conserva el tiempo restante del intento.'),retry);
   }).catch(err=>{playingReaction=false;$('gameNotice').textContent=err.message;load();});
  };box.append(start);$('phaseActions').append(box);}
 }
 else if(s.phase==='immunity')$('phaseActions').append(el('p','Tu prueba está guardada'+(p.challengePoints!=null?' · '+p.challengePoints+' puntos':'')+'. Puedes visitar otras secciones.','saved-result'));
 else if(['nominations','elimination'].includes(s.phase)){const done=s.phase==='nominations'?p.hasNominated:p.hasVoted;if(done)$('phaseActions').append(el('p','Tu voto está guardado. Esperando al resto o al final del plazo.'));else{const select=el('select');select.setAttribute('aria-label','Elige a un jugador');const names=s.phase==='nominations'?s.players.filter(x=>x.status==='active'&&x.username!==s.immune).map(x=>x.username):s.nominees;for(const name of names.filter(x=>x.toLowerCase()!==p.username.toLowerCase())){const o=el('option',name);o.value=name;select.append(o);}const b=el('button',s.phase==='nominations'?'Nominar':'Votar expulsión','market-btn');b.disabled=!select.options.length;b.onclick=()=>buttonTask(b,()=>action({action:s.phase==='nominations'?'nominate':'evict',target:select.value}),$('gameNotice'));const box=el('div',undefined,'game-vote');box.append(select,b);$('phaseActions').append(box);}}
}else if(p?.status==='eliminated')$('phaseActions').append(el('p','Has quedado eliminado/a. Puedes seguir la partida o inscribirte en otra.'));
$('castPlayers').replaceChildren();for(const x of s.players){const card=el('article',undefined,'cast-player'+(x.status==='eliminated'?' dead':x.username===s.immune?' inmune':'')),img=el('img');setAvatar(img,x.username);img.alt='Avatar de '+x.username;card.append(img,profileLink(x.username),(()=>{const seen=el('small','…','player-last-seen');if(x.bot)seen.textContent='0 min';else seen.dataset.playerLastSeen=x.username;return seen;})(),el('p',x.status==='eliminated'?'Puesto '+(x.placement||'—'):x.username===s.immune?'★ Inmune':s.nominees.includes(x.username)?'Nominado/a':'✓ En juego'));$('castPlayers').append(card);}refreshPlayerActivity($('castPlayers'));
$('gameAdmin').replaceChildren();if(s.user?.is_admin){if(s.phase==='waiting'&&s.players.length>=2)$('gameAdmin').append(button('Adelantar inicio',{action:'start'}));if(['immunity','nominations','elimination'].includes(s.phase)){const b=el('button','Adelantar fase (administración)','plain-btn');b.onclick=()=>{if(confirm('¿Cerrar esta fase con las respuestas recibidas?'))action({action:'advance'});};$('gameAdmin').append(b);}}timer();}
function formatDate(value){if(value==null||value==='')return 'fecha no disponible';let x=value;if(typeof x==='string'){x=x.trim();if(/^\d{10,13}$/.test(x))x=Number(x);else if(/^\d{4}-\d{2}-\d{2} /.test(x))x=x.replace(' ','T')+'Z';}if(typeof x==='number'&&x<1e11)x*=1000;const d=new Date(x);return Number.isFinite(d.getTime())?d.toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}):'fecha no disponible';}
function updateResourceControls(){const p=state?.me,at=Date.now()+clockOffset;if(!p)return;for(const [position,value] of [[1,p.keys],[2,p.apples],[3,p.health]]){const metric=document.querySelector('.casting-metrics>div:nth-child('+position+')>b');if(metric)metric.textContent=String(value);}const eat=$('casting-eat'),rest=$('casting-rest');if(eat)eat.disabled=busy||p.health>=100||p.apples<1;if(rest){const wait=Math.max(0,Math.ceil(((p.lastRest||0)+60000-at)/1000));rest.disabled=busy||p.health>=100||wait>0;rest.textContent=wait>0?'Descansar ('+wait+' s)':'Descansar (+20)';}}
function timer(){if(!state)return;updateResourceControls();const end=state.phase==='waiting'?state.startAt:state.deadline;if(!end){$('deadline').textContent=state.phase==='waiting'?'Esperando al menos dos participantes.':'';return;}const seconds=Math.max(0,Math.ceil((end-Date.now()-clockOffset)/1000));$('deadline').textContent=(state.phase==='waiting'?'Comienza en ':'Tiempo restante: ')+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
window.TengagedSession.then(load).catch(load);setInterval(()=>{if(!document.hidden)load();},10000);setInterval(timer,1000);addEventListener('beforeunload',()=>{clearTimeout(reactionTimer);disposeFlash?.();});

function enrollmentLink(id){const a=document.createElement('a');a.href='/enroll-game.html?type=casting&id='+id;a.textContent='Unirme';a.className='market-btn';return a;}

function renderPhaseSteps(s){const root=$('casting-steps');if(!root)return;root.replaceChildren();for(const [key,label] of [['waiting','Inscripción'],['immunity',s.counts.active===2?'Final':'Prueba'],['nominations','Nominaciones'],['elimination','Expulsión'],['finished','Resultado']]){const step=el('li',label);if(s.phase===key)step.setAttribute('aria-current','step');root.append(step);}}
$('casting-refresh').onclick=load;

document.addEventListener('casting:refresh',load);
