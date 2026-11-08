// V303: prueba de tribu o de inmunidad de Survivor con los minijuegos Flash originales.
// Debajo del minijuego, los resultados de tus compañeros de tribu con el mismo formato que Casting.
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=303';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const id=Number(params.get('id')),day=Number(params.get('day')||params.get('round')),mode=params.get('mode')==='immunity'?'immunity':'tribe';
const previews={wheel:'wheel-of-fortune',numbers:'numbers',deal:'deal-or-no-deal',match:'match-three',guitar:'guitar',endurance:'endurance',maze:'maze',snow:'snow-flakes',words:'words',line:'line-balls'};
let state=null,playing=false,launching=false,loading=false,dispose=null,epoch=0,busy=false;
const valid=Number.isSafeInteger(id)&&id>0&&Number.isSafeInteger(day)&&day>0;
const label=mode==='immunity'?'Inmunidad':'Prueba de tribu';
if(valid)$('challengeBack').href='/survivor.html?id='+id;
$('svcHeading').textContent=mode==='immunity'?'Inmunidad individual':'Prueba de tribu';
if(mode==='immunity')$('svcNote').textContent='La tribu que vota hoy juega esta prueba, también quienes se sentaron en la prueba de tribu. El ganador final queda a salvo del Consejo Tribal y los votos a él no cuentan. Tu tiempo depende de tu pollo y tu agua. Solo tu tribu ve estos resultados.';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo consultar la partida.');return d;}
const today=()=>state?.phase==='day'&&state.day===day;
function kindNow(){if(!today()){const h=state?.history?.find(h=>h.day===day);return mode==='tribe'?h?.kind:null;}return mode==='immunity'?state.challenge?.immunityKind:state.challenge?.kind;}
function done(){return mode==='immunity'?state.me?.playedImmunity:state.me?.played;}
function score(){return mode==='immunity'?state.me?.immunityScore:state.me?.score;}
function canPlay(){const me=state?.me;if(!me||me.status!=='active'||!today()||done())return false;return mode==='immunity'?me.atCouncil:!me.sitting;}
function catalogue(kind){const root=$('challengeCatalogue');root.replaceChildren();for(const k of Object.keys(previews)){const row=el('article',null,'challenge-catalogue-item'+(k===kind?' selected':'')),img=document.createElement('img'),p=el('p'),b=el('strong',CASTING_MINIGAMES[k]);img.src='/assets/minigames/regaged-capturas/'+previews[k]+'.png';img.alt=CASTING_MINIGAMES[k];img.loading='lazy';p.append(b);row.append(img,p);root.append(row);}}

// Resultados de tus compañeros: mismo formato que la Prueba de Casting.
function rows(){
 const me=state.me;if(!me)return null;
 if(today()){
  if(mode==='immunity')return state.immunity?state.immunity.map(r=>({...r,result:r.points==null?'none':'score'})):null;
  return state.today?.own?.rows||null;
 }
 const h=state.history?.find(h=>h.day===day);if(!h)return null;
 if(mode==='immunity')return h.council?.immunity?h.council.immunity.map(r=>({...r,result:r.points==null?'none':'score'})):null;
 return h.rows?.[me.tribe]||null;
}
function renderLeaderboard(){
 const root=$('challengeLeaderboard');root.setAttribute('aria-busy','false');root.replaceChildren();
 const isToday=today();root.append(el('h2',(isToday?'Los resultados de hoy para la ':'Los resultados del día '+day+' para la ')+(mode==='immunity'?'Inmunidad':'Prueba de tribu')+' de Survivor'));
 const list=rows();
 if(!state.me){root.append(el('p','Solo los náufragos de la partida ven los resultados de su tribu.'));return;}
 if(!list){root.append(el('p',mode==='immunity'?'Tu tribu no jugó la inmunidad este día.':'No hay resultados guardados para esta prueba.'));return;}
 const sorted=list.slice().sort((a,b)=>(a.points==null)-(b.points==null)||(b.points??0)-(a.points??0)||a.username.localeCompare(b.username,'es'));
 const finished=sorted.filter(r=>r.points!=null).length,playing=sorted.filter(r=>r.result!=='sitting').length;
 root.append(el('p',finished+' de '+playing+' compañeros han terminado.'+(mode==='tribe'&&state.required&&isToday?' Hoy cuentan '+state.required+' pruebas por tribu; si se juegan de más, se quita la más alta.':'')));
 const ol=el('ol');ol.setAttribute('aria-label','Resultados de tu tribu');let rank=0,prev=null;
 sorted.forEach((r,i)=>{
  const li=el('li');if(r.username.toLowerCase()===String(state.me.username||state.players.find(p=>p.id===state.me.id)?.username||'').toLowerCase())li.className='challenge-own-result';
  const name=el(r.bot?'span':'a',r.username,'challenge-player-name');if(!r.bot)name.href='/profile.html?username='+encodeURIComponent(r.username);
  const text=r.result==='sitting'?'se sienta hoy y no juega la prueba.':r.points!=null?'ha terminado la prueba con '+Number(r.points).toLocaleString('es-ES')+' puntos'+(r.result==='dropped'?' (no cuenta: era la más alta de sobra).':'.'):!isToday?'no completó la prueba.':r.started?'está realizando la prueba.':'no ha empezado la prueba todavía.';
  li.append(name,el('span',' '+text+(r.bot?' · Bot':'')));
  if(r.points!=null){if(i===0||r.points!==prev)rank=i+1;prev=r.points;li.setAttribute('data-rank',String(rank));}
  ol.append(li);
 });
 root.append(ol);
 const days=[...new Set([...(state.phase==='day'?[state.day]:[]),...(state.history||[]).map(h=>h.day)])].sort((a,b)=>b-a);
 if(days.length>1){const nav=el('nav');nav.setAttribute('aria-label','Resultados de otros días');for(const d of days){const a=el('a','Día '+d);a.href='/survivor-challenge.html?'+new URLSearchParams({id,day:d,mode});if(d===day)a.setAttribute('aria-current','page');nav.append(a);}root.append(nav);}
}
function renderSitout(){
 const box=$('svcSitout'),me=state.me;box.replaceChildren();box.hidden=true;
 if(mode!=='tribe'||!today()||!me||me.status!=='active')return;
 const need=state.today?.seatsToSit?.[me.tribe]||0,sitting=state.today?.sitouts?.[me.tribe]||[];
 box.append(el('p','Hoy deben jugar '+state.required+' náufragos por tribu.'));box.hidden=false;
 if(need>0){
  box.append(el('p','Tu tribu tiene más náufragos: '+need+(need===1?' debe sentarse':' deben sentarse')+' hoy. Sentados: '+(sitting.length?sitting.join(', '):'nadie')+'.'));
  if(!me.played){const b=el('button',me.sitting?'Volver a jugar hoy':'Sentarme hoy','plain-btn');b.type='button';b.disabled=busy||playing;b.onclick=async()=>{busy=true;b.disabled=true;try{state=(await api('/api/survivor?id='+id,{action:'sitout'})).match;stop();$('challengeBoard').replaceChildren();render();if(canPlay())begin();}catch(e){$('challengeStatus').textContent=e.message;}finally{busy=false;}};box.append(b);}
 }
}
function stop(){epoch++;dispose?.();dispose=null;playing=false;}
async function begin(){
 if(playing||launching||!canPlay())return;launching=true;playing=true;const mine=++epoch;
 $('challengeStatus').textContent='Cargando el minijuego… Puede tardar unos segundos la primera vez.';$('challengeBoard').hidden=false;$('challengeStart').hidden=true;
 try{const cleanup=await launchCastingMinigame($('challengeBoard'),kindNow(),{competitive:true,survivor:true,contextId:id,round:day+':'+mode});if(mine!==epoch)cleanup?.();else{dispose=cleanup;$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu resultado se guardará automáticamente.';}}
 catch(e){if(mine===epoch){stop();$('challengeStatus').textContent=e.message;$('challengeStart').hidden=false;}}
 finally{launching=false;}
}
function render(){
 const kind=kindNow();catalogue(kind);$('challengeGameName').textContent=(CASTING_MINIGAMES[kind]||'Prueba')+' · '+label;
 $('challengeDuration').textContent=(state.me?.seconds??200)+' segundos';renderSitout();renderLeaderboard();
}
async function refresh(){
 if(loading)return;loading=true;
 try{
  if(!valid)throw Error('Abre la prueba desde tu partida de Survivor.');
  state=(await api('/api/survivor?id='+id)).match;$('challengeRetry').hidden=true;render();
  if(today()&&done()){const here=playing;stop();$('challengeBoard').hidden=true;$('challengeRules').hidden=true;$('challengeStatus').textContent='Prueba completada.';$('challengeResult').textContent='Resultado guardado: '+Number(score()).toLocaleString('es-ES')+' puntos. Ya puedes volver al juego.';if(here)$('challengeLeaderboard').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(!canPlay()){if(!playing){$('challengeBoard').hidden=true;$('challengeRules').hidden=!today();$('challengeStatus').textContent=!today()?'Resultados del día '+day+'.':!state.me?'No participas en esta partida de Survivor.':state.me.status!=='active'?'Ya no estás en la partida.':mode==='immunity'?'Hoy tu tribu no juega la inmunidad.':state.me.sitting?'Hoy te sientas: no juegas la prueba de tribu.':'La prueba no está disponible ahora.';}return;}
  $('challengeRules').hidden=false;if(!playing&&!launching)begin();
 }catch(e){$('challengeStatus').textContent=playing?'La conexión se ha interrumpido. Mantén el minijuego abierto; reintentaremos consultar el guardado.':e.message;$('challengeRetry').hidden=false;}
 finally{loading=false;}
}
$('challengeStart').onclick=()=>{refresh();};$('challengeRetry').onclick=refresh;$('challengeScoresRefresh').onclick=refresh;
addEventListener('pagehide',()=>{if(!playing)stop();});
refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
