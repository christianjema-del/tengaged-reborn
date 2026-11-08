// V309: cada recurso del campamento tiene su propia sección.
// Agua: beber con − / + y Guardar, y sacar el cubo. Pollo: comer con − / + y Guardar, y cazar. Fuego: avivarlo con 6 de agua.
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const id=Number(params.get('id')),kind=['water','food','fire'].includes(params.get('kind'))?params.get('kind'):'food';
const FAN_WATER=6,HUNT_WATER=6,BUCKET_FOOD=6,WEAK_MS=30*60000;
let state=null,busy=false,loading=false,qty=1;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const time=at=>new Date(at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
if(id)$('scBack').href='/survivor.html?id='+id;
async function api(body){
 const r=await fetch('/api/survivor?id='+id,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo conectar con Survivor.');return d;
}
function notice(text,ok){$('scNotice').textContent=text||'';$('scNotice').hidden=!text;$('scNotice').className=ok?'survivorNotice':'survivorWarning';}
// Cada movimiento del campamento contado como en la historia del juego.
export function moveText(l){
 const who=l.user;
 return {['hunt-start']:who+' ha salido a cazar.',hunt:who+' ha cazado comida'+(l.amount>0?' (+'+l.amount+' de pollo).':', pero la reserva ya estaba llena.'),
  ['bucket-start']:who+' ha sacado el cubo de agua.',bucket:who+' ha recogido agua con el cubo'+(l.amount>0?' (+'+l.amount+' de agua).':', pero la reserva ya estaba llena.'),
  eat:who+' ha comido '+Math.abs(l.amount)+' de pollo.',drink:who+' ha bebido '+Math.abs(l.amount)+' de agua.',fan:who+' ha avivado el fuego.'}[l.kind]||who+'.';
}
// Qué movimientos salen en cada sección.
export const SECTION_KINDS={water:['drink','bucket-start','bucket'],food:['eat','hunt-start','hunt'],fire:['fan']};
// Cuánto se puede tomar como máximo: lo que quede en la reserva y lo que te falte para 100.
export function maxTake(stock,mine){return Math.max(0,Math.min(stock,100-mine));}
export function clampQty(n,max){return max<1?0:Math.max(1,Math.min(max,Math.round(n)||1));}
async function send(body,okText){
 if(busy)return;busy=true;render();
 try{const d=await api(body);state=d.match;qty=1;notice(okText,true);}
 catch(e){notice(e.message);}finally{busy=false;render();}
}
function action(label,body,disabled,okText){const b=el('button',label,'survivorButton survivorGather');b.type='button';b.disabled=disabled||busy;b.onclick=()=>send(body,okText);return b;}
const own=()=>{const s=state,me=s?.me,c=s?.camp;return !!me&&me.status==='active'&&!!c&&me.tribe===c.tribe;};
function renderResource(c,me,mine){
 const water=kind==='water',stock=water?c.water:c.food,mineNow=water?me?.water:me?.food,word=water?'agua':'pollo';
 $('scImage').src=water?'/assets/survivor/icon_game_water_level.gif':'/assets/survivor/icon_game_food_level.gif';$('scImage').alt=water?'Cubo de agua':'Pollo';
 $('scStock').textContent=stock;
 $('scLine').textContent='Reserva de la tribu: '+stock+' de '+word+(mine?' · Tú tienes '+mineNow+' de 100':'')+'.';
 const max=mine?maxTake(stock,mineNow):0;qty=clampQty(qty,max);
 $('scStepper').hidden=!mine;$('scQty').textContent=qty;
 $('scMinus').disabled=busy||qty<=1;$('scPlus').disabled=busy||qty>=max;$('scSave').disabled=busy||max<1;
 $('scAfter').textContent=!mine?'':max<1?(mineNow>=100?'Ya tienes 100 de '+word+'.':'No queda '+word+' en la reserva de la tribu.'):(water?'Vas a beber ':'Vas a comer ')+qty+' de '+word+' y te quedarás con '+(mineNow+qty)+'.';
 const box=$('scChoices');box.replaceChildren();
 if(!mine)return;
 if(water){
  if(c.bucket)box.append(el('p',c.bucket.username+' está recogiendo agua con el cubo'+(c.bucket.readyAt?' (vuelve hacia las '+time(c.bucket.readyAt)+')':'')+'.','survivorNotice'));
  else if(c.weather==='rain')box.append(action('Sacar el cubo (−'+BUCKET_FOOD+' de pollo)',{action:'bucket'},me.food<BUCKET_FOOD,'Has sacado el cubo de agua. Vuelve en una hora para ver cuánta agua has recogido.'));
  else box.append(el('p','Solo se puede sacar el cubo cuando llueve.','survivorNotice'));
 }else{
  if(c.weather==='sun')box.append(action('Cazar (−'+HUNT_WATER+' de agua)',{action:'hunt'},me.hunting||me.water<HUNT_WATER,'Has salido a cazar. La caza vuelve entre 30 y 45 minutos después.'));
  else box.append(el('p','Solo se puede cazar cuando hace sol.','survivorNotice'));
  if(me.hunting)box.append(el('p','Estás cazando. La caza vuelve entre 30 y 45 minutos después de salir.','survivorNotice'));
 }
}
function renderFire(c,me,mine){
 const left=c.fire&&c.fireUntil?c.fireUntil-Date.now():0,weak=c.fire&&left<WEAK_MS;
 $('scImage').src='/assets/survivor/icon_game_campfire_'+(c.fire?3:1)+'.gif';$('scImage').alt=c.fire?(weak?'Fuego flojo':'Fuego encendido'):'Fuego apagado';
 $('scStock').textContent='';$('scStepper').hidden=true;$('scAfter').textContent='';
 $('scLine').textContent=!c.fire?'El fuego está apagado.':(weak?'El fuego está flojo':'El fuego está encendido')+(c.fireUntil?' hasta las '+time(c.fireUntil):'')+'.';
 const box=$('scChoices');box.replaceChildren();
 if(!mine)return;
 if(c.fire)box.append(action('Avivar el fuego (−'+FAN_WATER+' de agua, +30 min)',{action:'fan'},me.water<FAN_WATER,'Has avivado el fuego: aguantará 30 minutos más.'));
 else box.append(el('p','El fuego ya se ha apagado y no se puede avivar. Espera a que vuelva a encenderse.','survivorNotice'));
}
function render(){
 const s=state,me=s.me,c=s.camp,mine=own();
 const name={water:'Agua',food:'Pollo',fire:'Fuego'}[kind];
 $('scTitle').textContent=c?name+' de la Tribu '+c.tribe:name;
 if(!c){$('scHint').textContent='El campamento se abre cuando empieza la partida.';return;}
 if(kind==='fire')renderFire(c,me,mine);else renderResource(c,me,mine);
 $('scHint').textContent=!mine?(me?'Solo puedes usar el campamento de tu tribu mientras sigues en la partida.':'Solo los náufragos de esta tribu pueden usar su campamento.'):
  kind==='fire'?'Si el fuego todavía no se ha apagado, puedes avivarlo con '+FAN_WATER+' de tu agua para que dure 30 minutos más.':'Elige cuánto quieres '+(kind==='water'?'beber':'comer')+' con − y +, y pulsa Guardar. Tu máximo es 100.';
 const list=$('scMoves');list.replaceChildren();
 if(mine){
  const kinds=SECTION_KINDS[kind];
  const live=kind==='food'?c.hunting.map(h=>({at:Infinity,text:h.username+' está cazando.'})):kind==='water'&&c.bucket?[{at:Infinity,text:c.bucket.username+' está recogiendo agua con el cubo.'}]:[];
  const rows=[...live,...c.log.filter(l=>kinds.includes(l.kind)&&(l.kind!=='hunt-start'||!c.hunting.some(h=>h.username===l.user))).map(l=>({at:l.at,text:moveText(l)}))].sort((a,b)=>b.at-a.at);
  for(const r of rows.slice(0,40)){const li=el('li');if(Number.isFinite(r.at))li.append(el('time',time(r.at)));li.append(el('span',r.text));list.append(li);}
  if(!rows.length)list.append(el('li','Todavía no hay movimientos.'));
 }else list.append(el('li','Los movimientos solo los ve la propia tribu.'));
}
$('scMinus').onclick=()=>{qty--;render();};
$('scPlus').onclick=()=>{qty++;render();};
$('scSave').onclick=()=>{if(kind==='fire')return;const n=qty;send({action:'eat',[kind==='water'?'water':'food']:n},(kind==='water'?'Has bebido ':'Has comido ')+n+' de '+(kind==='water'?'agua.':'pollo.'));};
async function load(){if(loading)return;loading=true;try{if(!id)throw Error('Abre el campamento desde tu partida de Survivor.');state=(await api()).match;render();}catch(e){notice(e.message);}finally{loading=false;}}
load();setInterval(()=>{if(!document.hidden&&!busy)load();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
