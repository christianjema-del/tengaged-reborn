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
 else if(state.phase==='waiting')status.append(el('span','✓','survivorReady'));
 else if(p.immunityLeader)status.append(document.createTextNode('Líder de inmunidad'));
 else if(p.atCouncil){const n=el('span',null,'survivorNominated');n.setAttribute('role','img');n.title=n.ariaLabel='En el Consejo Tribal';status.append(n);}
 box.append(a,name,presence,status);return box;
}
function renderHeader(){
 const s=state,me=s.me,roster=$('svRoster');roster.replaceChildren();
 const list=s.phase==='waiting'?s.players:s.players.filter(p=>p.tribe===s.viewTribe);
 for(const p of list)roster.append(seat(p,me));
 if(s.phase==='waiting')for(let i=list.length;i<10*Math.ceil(Math.max(list.length,1)/10);i++)roster.append(el('div',null,'survivorSeat survivorEmpty'));
 $('svPhaseLabel').textContent=s.phase==='waiting'?'Inscripción · '+s.players.length+' / '+s.capacity+' náufragos':s.phase==='finished'?'Unificación':s.nominated?'Prueba de tribu y Consejo Tribal':'Prueba de tribu';
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
 const steps={svStepChallenge:s.phase==='day',svStepImmunity:!!s.nominated,svStepCouncil:!!s.nominated};for(const [k,on] of Object.entries(steps))on?$(k).setAttribute('aria-current','step'):$(k).removeAttribute('aria-current');
 const logList=$('svUseLog');logList.replaceChildren();
 const items=c.log.filter(l=>!showLog||(showLog==='water'?['drink','bucket','hunt-start','fan'].includes(l.kind):['eat','hunt','bucket-start'].includes(l.kind)));
 logList.hidden=!showLog||!own;
 for(const l of items.slice(-20).reverse())logList.append(el('li',new Date(l.at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+' · '+l.user+' '+KINDS[l.kind]+' ('+(l.amount>0?'+':'')+l.amount+')'));
 if(showLog&&!items.length&&own)logList.append(el('li','Hoy todavía no se ha usado.'));
 const box=$('svCampActions');box.replaceChildren();
 if(!own){if(me&&s.phase==='day'&&me.tribe!==s.viewTribe)box.append(el('p','Estás viendo el campamento de la '+tribeName(s.viewTribe)+'.','survivorNotice'));return;}
 if(me.doomed)box.append(el('p','Comiste con el fuego apagado y te quedaste a 0 de pollo y agua: no superarás el próximo cambio de día.','survivorWarning'));
 else if(me.food<=0&&me.water<=0)box.append(el('p','Estás a 0 de pollo y 0 de agua. Si sigues así cuando cambie el día, quedarás eliminado.','survivorWarning'));
 if(c.weather==='sun'){const b=button('Cazar (−6 de agua)',()=>act({action:'hunt'}),'survivorButton survivorGather');b.disabled=me.hunting||me.water<6;box.append(b);if(me.hunting)box.append(el('p','Estás cazando. La caza se recoge entre 30 y 45 minutos después de salir.','survivorNotice'));}
 if(c.weather==='rain'){const b=button('Sacar el cubo (−6 de pollo)',()=>act({action:'bucket'}),'survivorButton survivorGather');b.disabled=!!c.bucket||me.food<6;box.append(b);}
 if(c.bucket)box.append(el('p',c.bucket.username+' está recogiendo agua con el cubo'+(c.bucket.readyAt?' (vuelve hacia las '+new Date(c.bucket.readyAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+')':'')+'.','survivorNotice'));
 if(c.hunting.length)box.append(el('p','Cazando: '+c.hunting.map(h=>h.username).join(', ')+'.','survivorNotice'));
 if(c.fire){const b=button('Avivar el fuego (−5 de agua, +30 min)',()=>act({action:'fan'}),'survivorButton survivorGather');b.disabled=me.water<5;box.append(b);if(c.fireUntil)box.append(el('p','El fuego estará encendido hasta las '+new Date(c.fireUntil).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+'.','survivorNotice'));}
 const form=el('form',null,'survivorTake'),food=document.createElement('input'),water=document.createElement('input');
 for(const [input,label,max] of [[food,'Pollo',Math.min(c.food,100-me.food)],[water,'Agua',Math.min(c.water,100-me.water)]]){input.type='number';input.min='0';input.max=String(Math.max(0,max));input.value='0';input.setAttribute('aria-label',label);const l=el('label',label+' ');l.append(input);form.append(l);}
 const eat=el('button',c.fire?'Comer y beber':'Comer con el fuego apagado','survivorButton');eat.type='submit';form.append(eat);
 form.onsubmit=e=>{e.preventDefault();const body={action:'eat',food:Number(food.value)||0,water:Number(water.value)||0};if(!c.fire){if(!confirm('El fuego está apagado. Tienes un 50 % de posibilidades de quedarte a 0 de pollo y agua y morir en el próximo cambio de día. ¿Comer igualmente?'))return;body.risk=true;}act(body);};
 box.append(form);if(!c.fire)box.append(el('p','Espera a que se encienda el fuego para comer y beber sin riesgo.','survivorNotice'));
}
function button(text,fn,cls='survivorButton'){const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;}

// ---------- Prueba, inmunidad y consejo ----------
function renderPhase(){
 const s=state,me=s.me,box=$('svPhase');box.replaceChildren();
 $('svChallenge').textContent=s.nominated?'Prueba y Consejo Tribal':'Prueba de tribu';
 if(s.phase==='waiting'){box.append(el('p','Survivor empieza cuando se completan las 20 plazas y admin1 lo inicia. Los 20 náufragos se reparten en dos tribus de diez'+(s.carriedFrom?'; los supervivientes de Survivor #'+s.carriedFrom+' forman la tribu A y los nuevos completan la tribu rival.':'.')));return;}
 if(s.phase==='finished'){const merged=s.players.filter(p=>p.status==='merged').map(p=>p.username);box.append(el('p','Unificación: '+merged.join(', ')+' comparten el primer puesto.'));return;}
 const t=s.today,mine=me?.status==='active'?me:null;
 box.append(el('p','Las dos tribus juegan la prueba de hoy. La tribu con menos puntos va al Consejo Tribal durante el día siguiente.'));
 box.append(el('p','Cada día dura 12 horas. La votación, la inmunidad individual y la siguiente prueba de tribu comparten la misma cuenta atrás.'));
 box.append(el('p','Hoy deben jugar '+s.required+' por tribu'+(s.challenge?' · Minijuego: '+(NAMES[s.challenge.kind]||s.challenge.kind):'')+'.','survivorNotice'));
 if(mine){
  const need=t?.seatsToSit?.[mine.tribe]||0;
  if(mine.played)box.append(el('p','Ya has jugado la prueba de hoy: '+points(mine.score)+'.','survivorNotice'));
  else if(mine.sitting)box.append(el('p','Hoy te sientas: no juegas la prueba de tribu.','survivorNotice'));
  else{const a=el('a','Jugar la prueba de tribu ('+mine.seconds+' s)','survivorButton');a.href='/survivor-challenge.html?'+new URLSearchParams({id:s.id,day:s.day,mode:'tribe'});box.append(a);}
  if(need>0&&!mine.played){const sitting=t.sitouts[mine.tribe]||[];box.append(el('p','Tu tribu tiene más náufragos: '+need+(need===1?' debe sentarse':' deben sentarse')+' hoy. Sentados: '+(sitting.length?sitting.join(', '):'nadie')+'. Si juegan de más, se quita la prueba más alta.','survivorNotice'));box.append(button(mine.sitting?'Volver a jugar hoy':'Sentarme hoy',()=>act({action:'sitout'})));}
 }
 const imm=el('h3','Inmunidad individual');imm.id='svImmunity';imm.tabIndex=-1;box.append(imm);
 if(!s.nominated)box.append(el('p','La inmunidad individual no está abierta este día.'));
 else{
  box.append(el('p','La tribu que vota hoy juega una prueba aparte, también quienes se sentaron en la prueba de tribu. El líder puede cambiar hasta el cambio de día; solo el ganador final queda a salvo. Los votos a ese ganador no cuentan. Puedes cambiar tu voto durante todo el día.'));
  if(s.immunity){const ul=el('ul');s.immunity.forEach((r,i)=>ul.append(el('li',r.username+': '+(r.points==null?'Sin puntuación':points(r.points)+(i===0?' — líder actual':'')))));box.append(ul);}
  else box.append(el('p','Los resultados de la inmunidad solo los ve la '+tribeName(s.nominated)+'.','survivorNotice'));
  if(mine&&mine.atCouncil){if(mine.playedImmunity)box.append(el('p','Tu inmunidad de hoy: '+points(mine.immunityScore)+'.','survivorNotice'));else{const a=el('a','Jugar la inmunidad ('+mine.seconds+' s)','survivorButton');a.href='/survivor-challenge.html?'+new URLSearchParams({id:s.id,day:s.day,mode:'immunity'});box.append(a);}}
 }
 const council=el('h3','Consejo Tribal');council.id='svCouncil';council.tabIndex=-1;box.append(council);
 if(!s.nominated)box.append(el('p','La votación está cerrada. Vota la tribu que pierda la prueba de hoy.'));
 else{
  box.append(el('p','La '+tribeName(s.nominated)+' perdió la prueba anterior y está en el Consejo Tribal. Sale quien tenga más votos al cambiar de día. Los votos al inmune no cuentan. Los votos son secretos: al cambiar de día se verá cuántos votos tuvo cada uno.'));
  if(mine&&mine.atCouncil){const targets=el('div',null,'survivorVoteTargets');for(const p of s.players.filter(p=>p.status==='active'&&p.tribe===mine.tribe&&p.id!==mine.id)){const b=button(p.username,()=>act({action:'vote',target:p.id}));b.setAttribute('aria-pressed',String(String(mine.vote)===String(p.id)));targets.append(b);}box.append(el('p',mine.vote?'Tu voto está guardado. Puedes cambiarlo hasta el cambio de día.':'Todavía no has votado.','survivorNotice'),targets);}
 }
}
function table(caption,rows){
 const t=el('table'),cap=el('caption',caption),head=el('thead'),hr=el('tr'),body=el('tbody');hr.append(el('th','Náufrago'),el('th','Resultado'));head.append(hr);
 for(const r of rows){const tr=el('tr'),th=el('th',r.username);th.scope='row';tr.append(th,el('td',r.result==='sitting'?'Sentado':r.result==='dropped'?points(r.points)+' (no cuenta)':r.result==='score'?points(r.points):'Sin puntuación'));body.append(tr);}
 t.append(cap,head,body);return t;
}
function renderResults(){
 const s=state,box=$('svResults'),open=new Set([...box.querySelectorAll('details[open]')].map(d=>d.dataset.key));box.replaceChildren();
 const add=(k,summary,fill)=>{const d=el('details');d.dataset.key=k;if(open.has(k)||(!open.size&&k==='today'))d.open=true;d.append(el('summary',summary));fill(d);box.append(d);};
 if(s.phase==='day'&&s.today?.own)add('today','Puntuaciones de hoy',d=>{const cols=el('div',null,'survivorResultColumns');cols.append(table(tribeName(s.today.own.tribe)+' — '+points(s.today.own.total),s.today.own.rows));const other=el('div');other.append(el('p',tribeName(s.today.other.tribe)+': se verá al cambiar de día.','survivorNotice'));cols.append(other);d.append(cols);});
 else if(s.phase==='day')add('today','Puntuaciones de hoy',d=>d.append(el('p','Cada tribu ve sus propias puntuaciones. Se comparten al cambiar de día.','survivorNotice')));
 for(const h of s.history){
  add('day'+h.day,'Día '+h.day+' — puntuaciones y votos',d=>{
   d.append(el('p',tribeName(h.winner)+(h.tieBreak?' ganó el desempate aleatorio. ':' ganó. ')+tribeName(h.loser)+' va al siguiente Consejo Tribal.'));
   const cols=el('div',null,'survivorResultColumns');cols.append(table(tribeName('A')+' — '+points(h.totals.A),h.rows.A),table(tribeName('B')+' — '+points(h.totals.B),h.rows.B));d.append(cols);
   if(h.council){
    if(h.council.immunity){d.append(el('h3','Inmunidad individual'));const ul=el('ul');for(const r of h.council.immunity)ul.append(el('li',r.username+': '+(r.points==null?'Sin puntuación':points(r.points))));d.append(ul);}
    d.append(el('h3','Votos'));const ul=el('ul');for(const v of h.council.votes||[])ul.append(el('li',v.username+': '+v.votes+(v.votes===1?' voto':' votos')+(v.immune?' (inmune)':'')));d.append(ul);
    if(h.council.out)d.append(el('p','Expulsado: '+h.council.out+'.'));
   }
  });
 }
}
function renderStory(){const box=$('svStory');box.replaceChildren();for(const e of state.events)box.append(el('p',e.text));for(const w of state.welcomes||[])box.append(el('p',w.username+': '+w.body));}
async function loadBlogs(){
 if(blogsLoaded)return;blogsLoaded=true;
 try{const d=await api('/api/blog?q=%23survivor');const posts=(d.posts||[]).slice(0,5);if(!posts.length)return;const box=$('svBlogs');box.replaceChildren();for(const b of posts){const p=el('p'),a=el('a',b.title||'Blog');a.href='/blogs?id='+b.id;p.append(a);box.append(p);}}catch{}
}
function render(){renderHeader();renderCamp();renderPhase();renderResults();renderStory();clock();}
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
 try{const d=await api('/api/survivor?'+new URLSearchParams({id,...(viewTribe?{tribe:viewTribe}:{})}),body);state=d.match;notice(d.result?.poisoned?'¡Mala suerte! Comiste con el fuego apagado y te has quedado a 0 de pollo y agua.':'');render();}
 catch(e){notice(e.message);}finally{busy=false;}
}
$('svSwitch').onclick=()=>{if(!state)return;const own=state.me?.tribe;viewTribe=state.viewTribe===(own||'A')?(own==='B'?'A':'B'):(own||'A');load();};
$('svFillBots').onclick=()=>act({action:'fill_bots'});
$('svStart').onclick=()=>act({action:'start'});
$('svWaterLog').onclick=()=>{showLog=showLog==='water'?null:'water';renderCamp();};
$('svFoodLog').onclick=()=>{showLog=showLog==='food'?null:'food';renderCamp();};
load();setInterval(clock,1000);setInterval(()=>{if(!document.hidden)load();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
