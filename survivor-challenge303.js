// V308: prueba de Survivor como la de tengaged.es (2014): a la izquierda la Prueba de Grupo,
// los resultados de ayer de las dos tribus y el catálogo; a la derecha el minijuego y los resultados de hoy de tu tribu.
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=303';
import {elapsedMinutes} from '/elapsed-time.js?v=159';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const id=Number(params.get('id')),day=Number(params.get('day')||params.get('round')),mode=params.get('mode')==='immunity'?'immunity':'tribe';
const previews={wheel:'wheel-of-fortune',numbers:'numbers',deal:'deal-or-no-deal',match:'match-three',guitar:'guitar',endurance:'endurance',maze:'maze',snow:'snow-flakes',words:'words',line:'line-balls'};
const descriptions={wheel:'Haga girar la rueda y tratar de resolver los puzzles.',numbers:'Cuenta los cubos, cuenta los puntos y encuentra la ecuación.',deal:'Abre los maletines y obtiene el importe máximo.',match:'Intercambia dos piezas en el tablero para formar una línea de tres o más.',endurance:'Arrastra la bola tanto tiempo como puedas.',words:'Encuentra el mayor número de palabras posible.',guitar:'Un juego del tipo Guitar Hero.',maze:'Encuentra el camino a través del laberinto.',snow:'Empuja las estrellas dentro de la caja.',line:'Conecta bolas del mismo color formando líneas.'};
const testName=mode==='immunity'?'Prueba de Inmunidad':'Prueba de Grupo';
let state=null,playing=false,launching=false,loading=false,dispose=null,epoch=0,busy=false;
const valid=Number.isSafeInteger(id)&&id>0&&Number.isSafeInteger(day)&&day>0;
if(valid)$('challengeBack').href='/survivor.html?id='+id;
$('svcHeading').textContent=testName;$('svcTodayTitle').textContent='Los resultados de hoy para la '+testName;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const pts=n=>Number(n).toLocaleString('es-ES');
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo consultar la partida.');return d;}
const today=()=>state?.phase==='day'&&state.day===day;
function kindNow(){if(!today())return state?.history?.find(h=>h.day===day)?.kind||null;return mode==='immunity'?state.challenge?.immunityKind:state.challenge?.kind;}
function done(){return mode==='immunity'?state.me?.playedImmunity:state.me?.played;}
function score(){return mode==='immunity'?state.me?.immunityScore:state.me?.score;}
function canPlay(){const me=state?.me;if(!me||me.status!=='active'||!today()||done())return false;return mode==='immunity'?me.atCouncil:!me.sitting;}
function myName(){return state?.players?.find(p=>String(p.id)===String(state.me?.id))?.username||'';}
function catalogue(kind){const root=$('challengeCatalogue');root.replaceChildren();for(const k of Object.keys(previews)){const row=el('article',null,'challenge-catalogue-item'+(k===kind?' selected':'')),img=document.createElement('img'),p=el('p'),b=el('strong',CASTING_MINIGAMES[k]+' ');img.src='/assets/minigames/regaged-capturas/'+previews[k]+'.png';img.alt=CASTING_MINIGAMES[k];img.loading='lazy';p.append(b,document.createTextNode(descriptions[k]));row.append(img,p);root.append(row);}}
function note(){
 const required=state?.required;
 $('svcNote').textContent=mode==='immunity'
  ?'Trate de conseguir tantos puntos como sea posible en la prueba. El que más puntos consiga quedará inmune y no podrá ser expulsado en el Consejo Tribal. También pueden jugar quienes se sentaron en la Prueba de Grupo.'
  :'Trate de conseguir tantos puntos como sea posible en la prueba. La tribu con menos puntos tendrá que escoger un nominado.'+(required?' El Total de puntos será la suma de las peores '+required+' pruebas de hoy que hayan sido empezadas.':'');
}
// Resultados de ayer: las dos tribus, de mayor a menor; en amarillo las pruebas que cuentan.
function renderYesterday(){
 const box=$('svcYesterday');box.replaceChildren();
 const h=state?.history?.find(h=>h.day===day-1);
 if(!h){box.append(el('p','Todavía no hay resultados de ayer.'));return;}
 const sortRows=rows=>(rows||[]).slice().sort((a,b)=>(b.points??-1)-(a.points??-1)||a.username.localeCompare(b.username,'es'));
 const A=sortRows(h.rows.A),B=sortRows(h.rows.B),n=Math.max(A.length,B.length);
 const table=el('table'),body=el('tbody');
 const name=r=>{const td=el('td',null,'svc-name');if(r){const a=el('a',r.username);a.href='/profile.html?username='+encodeURIComponent(r.username);a.title=r.username;td.append(a);}return td;};
 const value=r=>{const td=el('td',!r?'':r.result==='sitting'?'—':String(r.points??0));if(r&&r.result==='score')td.className='svc-count';if(r&&r.result==='sitting')td.title='Sentado';if(r&&r.result==='dropped')td.title='No cuenta: prueba más alta de sobra';return td;};
 for(let i=0;i<n;i++){const tr=el('tr');tr.append(name(A[i]),value(A[i]),value(B[i]),name(B[i]));body.append(tr);}
 const foot=el('tfoot'),tr=el('tr');tr.append(el('td','Tribu A','svc-name'),el('td',pts(h.totals.A)),el('td',pts(h.totals.B)),el('td','Tribu B','svc-name'));foot.append(tr);
 table.append(body,foot);box.append(table);
}
function rows(){
 const me=state.me;if(!me)return null;
 if(today())return mode==='immunity'?(state.immunity||null):(state.today?.own?.rows||null);
 const h=state.history?.find(h=>h.day===day);if(!h)return null;
 return mode==='immunity'?(h.council?.immunity||null):(h.rows?.[me.tribe]||null);
}
// Resultados de hoy de tu tribu, como en la Prueba de Grupo de 2014.
function renderToday(){
 const root=$('challengeLeaderboard'),list=$('svcToday');root.setAttribute('aria-busy','false');list.replaceChildren();
 if(!state.me){list.append(el('li','Solo los náufragos de la partida ven los resultados de su tribu.'));return;}
 const r=rows();if(!r){list.append(el('li',mode==='immunity'?'Tu tribu no juega la inmunidad este día.':'Todavía no hay resultados.'));return;}
 const me=myName().toLowerCase(),isToday=today();
 for(const x of r.slice().sort((a,b)=>(b.at??0)-(a.at??0)||(a.points==null)-(b.points==null)||a.username.localeCompare(b.username,'es'))){
  const li=el('li');if(x.username.toLowerCase()===me)li.className='svc-me';
  const a=el(x.bot?'span':'a',x.username);if(!x.bot)a.href='/profile.html?username='+encodeURIComponent(x.username);li.append(a);
  if(x.result==='sitting')li.append(el('span',' se sienta hoy y no hace la prueba','svc-out'));
  else if(x.points!=null){li.append(document.createTextNode(' terminada la prueba con '+pts(x.points)+' puntos'));if(x.at)li.append(el('small',elapsedMinutes(Math.max(0,Math.floor((Date.now()-x.at)/60000)))));}
  else li.append(el('span',isToday?(x.started?' está realizando la prueba':' no ha empezado la prueba todavía'):' no hizo la prueba','svc-out'));
  list.append(li);
 }
}
function renderRules(){
 const secs=state.me?.seconds??200,rules=$('challengeRules');rules.replaceChildren();
 const b=el('strong','Leer.'),s=el('strong',secs+' segundos,'),g=el('strong','Guardar');
 rules.append(b,document.createTextNode(' Hoy tu '+testName+' durará '),s,document.createTextNode(' esta duración se basa en tu fuerza total (niveles de agua y comida). Una vez que comience la prueba, no podrás hacer una pausa o detenerla. Cuando termines la prueba espera a que se confirme el '),g,document.createTextNode(' de tus resultados en Tengaged, de lo contrario tu puntuación contará cero. Una vez que hagas clic en Start, no salgas hasta que el juego esté correctamente guardado en Tengaged.'));
}
function renderSitout(){
 const box=$('svcSitout'),me=state.me;box.replaceChildren();box.hidden=true;
 if(mode!=='tribe'||!today()||!me||me.status!=='active')return;
 const need=state.today?.seatsToSit?.[me.tribe]||0,sitting=state.today?.sitouts?.[me.tribe]||[];if(need<=0)return;
 box.hidden=false;box.append(el('p','Tu tribu tiene más náufragos: '+need+(need===1?' debe sentarse':' deben sentarse')+' hoy y no hacer la prueba. Sentados: '+(sitting.length?sitting.join(', '):'nadie')+'.'));
 if(!me.played){const b=el('button',me.sitting?'Volver a jugar hoy':'Sentarme hoy','plain-btn');b.type='button';b.disabled=busy||playing;b.onclick=async()=>{busy=true;b.disabled=true;try{state=(await api('/api/survivor?id='+id,{action:'sitout'})).match;stop();$('challengeBoard').replaceChildren();render();if(canPlay())begin();}catch(e){$('challengeStatus').textContent=e.message;}finally{busy=false;}};box.append(b);}
}
function stop(){epoch++;dispose?.();dispose=null;playing=false;}
async function begin(){
 if(playing||launching||!canPlay())return;launching=true;playing=true;const mine=++epoch;
 $('challengeStatus').textContent='Cargando el minijuego… Puede tardar unos segundos la primera vez.';$('challengeBoard').hidden=false;$('challengeStart').hidden=true;
 try{const cleanup=await launchCastingMinigame($('challengeBoard'),kindNow(),{competitive:true,survivor:true,contextId:id,round:day+':'+mode});if(mine!==epoch)cleanup?.();else{dispose=cleanup;$('challengeStatus').textContent='Pulsa START dentro del minijuego. Tu resultado se guardará automáticamente.';}}
 catch(e){if(mine===epoch){stop();$('challengeStatus').textContent=e.message;$('challengeStart').hidden=false;}}
 finally{launching=false;}
}
function render(){const kind=kindNow();catalogue(kind);$('challengeGameName').textContent=CASTING_MINIGAMES[kind]||'Prueba';note();renderRules();renderSitout();renderYesterday();renderToday();}
async function refresh(){
 if(loading)return;loading=true;
 try{
  if(!valid)throw Error('Abre la prueba desde tu partida de Survivor.');
  state=(await api('/api/survivor?id='+id)).match;$('challengeRetry').hidden=true;render();
  if(today()&&done()){const here=playing;stop();$('challengeBoard').hidden=true;$('challengeRules').hidden=true;$('challengeStatus').textContent='Prueba completada.';$('challengeResult').textContent='Resultado guardado: '+pts(score())+' puntos. Ya puedes volver al juego.';if(here)$('challengeLeaderboard').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(!canPlay()){if(!playing){$('challengeBoard').hidden=true;$('challengeRules').hidden=!today();$('challengeStatus').textContent=!today()?'Resultados del día '+day+'.':!state.me?'No participas en esta partida de Survivor.':state.me.status!=='active'?'Ya no estás en la partida.':mode==='immunity'?'Hoy tu tribu no juega la inmunidad.':state.me.sitting?'Hoy te sientas: no juegas la Prueba de Grupo.':'La prueba no está disponible ahora.';}return;}
  $('challengeRules').hidden=false;if(!playing&&!launching)begin();
 }catch(e){$('challengeStatus').textContent=playing?'La conexión se ha interrumpido. Mantén el minijuego abierto; reintentaremos consultar el guardado.':e.message;$('challengeRetry').hidden=false;}
 finally{loading=false;}
}
$('challengeStart').onclick=()=>{refresh();};$('challengeRetry').onclick=refresh;
addEventListener('pagehide',()=>{if(!playing)stop();});
refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
