// V308: comer y beber de 1 en 1 de la reserva de tu tribu, con la lista de movimientos del campamento.
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const id=Number(params.get('id')),kind=params.get('kind')==='water'?'water':'food';
let state=null,busy=false,loading=false;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const time=at=>new Date(at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
if(id)$('scBack').href='/survivor.html?id='+id;
async function api(body){
 const r=await fetch('/api/survivor?id='+id,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo conectar con Survivor.');return d;
}
function notice(text){$('scNotice').textContent=text||'';$('scNotice').hidden=!text;}
// Cada movimiento del campamento contado como en la historia del juego.
export function moveText(l){
 const who=l.user;
 return {['hunt-start']:who+' ha salido a cazar.',hunt:who+' ha cazado comida'+(l.amount>0?' (+'+l.amount+' de pollo).':', pero la reserva ya estaba llena.'),
  ['bucket-start']:who+' ha sacado el cubo de agua.',bucket:who+' ha recogido agua con el cubo'+(l.amount>0?' (+'+l.amount+' de agua).':', pero la reserva ya estaba llena.'),
  eat:who+' ha comido '+Math.abs(l.amount)+' de pollo.',drink:who+' ha bebido '+Math.abs(l.amount)+' de agua.',fan:who+' ha avivado el fuego.'}[l.kind]||who+'.';
}
function choice(label,body,disabled,primary){const b=el('button',label,'survivorButton survivorEat'+(primary?' survivorEatMain':''));b.type='button';b.disabled=disabled||busy;b.onclick=()=>take(body);return b;}
async function take(body){
 const c=state?.camp;if(!c||busy)return;
 if(!c.fire){if(!confirm('El fuego está apagado. Tienes un 50 % de posibilidades de quedarte a 0 de pollo y agua y morir en el próximo cambio de día. ¿Seguir igualmente?'))return;body={...body,risk:true};}
 busy=true;render();
 try{const d=await api({action:'eat',...body});state=d.match;notice(d.result?.poisoned?'¡Mala suerte! Comiste con el fuego apagado y te has quedado a 0 de pollo y agua.':'');}
 catch(e){notice(e.message);}finally{busy=false;render();}
}
function render(){
 const s=state,me=s.me,c=s.camp,own=!!me&&me.status==='active'&&c&&me.tribe===c.tribe;
 $('scTitle').textContent=c?'Campamento de la Tribu '+c.tribe:'Campamento';
 if(c){
  const fire=$('scFire');fire.src='/assets/survivor/icon_game_campfire_'+(c.fire?3:1)+'.gif';fire.alt=fire.title=c.fire?'Fuego encendido':'Fuego apagado';
  const w=$('scWeather'),code={sun:3,cloudy:2,rain:1}[c.weather],label={sun:'Soleado',cloudy:'Nublado',rain:'Lluvia'}[c.weather];w.src='/assets/survivor/icon_game_weather_'+code+'.gif';w.alt=w.title=label;
  $('scWaterStock').textContent=c.water;$('scFoodStock').textContent=c.food;$('scMyWater').textContent=own?me.water:'';$('scMyFood').textContent=own?me.food:'';
 }
 const box=$('scChoices');box.replaceChildren();
 if(!c){$('scHint').textContent='El campamento se abre cuando empieza la partida.';}
 else if(!own){$('scHint').textContent=me?'Solo puedes comer y beber de la reserva de tu tribu mientras sigues en la partida.':'Solo los náufragos de esta tribu pueden comer y beber de su reserva.';}
 else{
  const food=choice('Comer 1 de pollo',{food:1},c.food<1||me.food>=100,kind==='food'),water=choice('Beber 1 de agua',{water:1},c.water<1||me.water>=100,kind==='water');
  box.append(...(kind==='water'?[water,food]:[food,water]));
  $('scHint').textContent=c.fire?'El fuego está encendido: puedes comer y beber sin riesgo. Tu máximo es 100 de cada.':'El fuego está apagado. Si comes o bebes ahora tienes un 50 % de posibilidades de quedarte a 0 y morir en el próximo cambio de día.';
  $('scHint').className=c.fire?'survivorNotice':'survivorWarning';
 }
 const list=$('scMoves');list.replaceChildren();
 if(c&&own){
  const rows=[...c.hunting.map(h=>({at:Infinity,text:h.username+' está cazando.'})),...(c.bucket?[{at:Infinity,text:c.bucket.username+' está recogiendo agua con el cubo.'}]:[]),...c.log.filter(l=>l.kind!=='hunt-start'||!c.hunting.some(h=>h.username===l.user)).map(l=>({at:l.at,text:moveText(l)}))].sort((a,b)=>b.at-a.at);
  for(const r of rows.slice(0,40)){const li=el('li');if(Number.isFinite(r.at))li.append(el('time',time(r.at)));li.append(el('span',r.text));list.append(li);}
  if(!rows.length)list.append(el('li','Todavía no hay movimientos en el campamento.'));
 }else list.append(el('li','Los movimientos solo los ve la propia tribu.'));
}
async function load(){if(loading)return;loading=true;try{if(!id)throw Error('Abre el campamento desde tu partida de Survivor.');state=(await api()).match;render();}catch(e){notice(e.message);}finally{loading=false;}}
load();setInterval(()=>{if(!document.hidden&&!busy)load();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
