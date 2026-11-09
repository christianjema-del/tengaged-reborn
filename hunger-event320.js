// V320/V322/V325: cartel del evento «El Vasallaje» (Hunger Games #11) con el diseño de la web.
// V325: cuenta atrás en directo (segundo a segundo) y recuadro rediseñado.
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const clock=ms=>new Date(ms).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
const prize=([k,t])=>k+'K · '+t+' T$';
let nowFn=()=>Date.now(),ticker=null;
const pad=n=>String(n).padStart(2,'0');
export function parts320(ms){const t=Math.max(0,Math.floor(ms/1000));return {h:Math.floor(t/3600),m:Math.floor(t%3600/60),s:t%60};}
export function waitingText320(ev,now){
 if(!ev)return null;const left=ev.startAt-now;
 if(left<=0)return 'El Vasallaje está empezando…';
 const {h,m}=parts320(left);
 return 'El Vasallaje empieza hoy a las '+clock(ev.startAt)+' (hora española). Faltan '+(h?h+' h ':'')+m+' min.';
}
function tick(){
 for(const box of document.querySelectorAll('[data-countdown320]')){
  const left=Number(box.dataset.countdown320)-nowFn(),{h,m,s}=parts320(left);
  const set=(k,v)=>{const n=box.querySelector('[data-unit="'+k+'"]');if(n&&n.textContent!==v)n.textContent=v;};
  set('h',pad(h));set('m',pad(m));set('s',pad(s));
  box.classList.toggle('event320-zero',left<=0);
  const label=box.querySelector('.event320-count-label');if(label&&left<=0&&box.dataset.doneText)label.textContent=box.dataset.doneText;
 }
}
function countdown(label,target,doneText){
 const box=el('div',null,'event320-count');box.dataset.countdown320=String(target);if(doneText)box.dataset.doneText=doneText;
 box.append(el('span',label,'event320-count-label'));const digits=el('div',null,'event320-digits');
 for(const [k,name] of [['h','horas'],['m','min'],['s','seg']]){const cell=el('span',null,'event320-cell');cell.append(el('b','00'),el('small',name));cell.firstChild.dataset.unit=k;digits.append(cell);if(k!=='s')digits.append(el('i',':','event320-colon'));}
 box.append(digits);return box;
}
function status(ev){
 if(ev.finished)return 'El evento ha terminado. ¡Gracias por participar!';
 if(!ev.started)return 'Empieza hoy a las '+clock(ev.startAt)+' (hora española). admin1 decide cuándo empieza cada día siguiente.';
 if(ev.final)return 'Final en juego: quedan 3 tributos o menos.';
 if(ev.feastAt)return 'El Festín empieza a las '+clock(ev.feastAt)+'. ¡Entra en la Cornucopia!';
 if(ev.fog)return 'Hay niebla tóxica en el bosque hasta las '+clock(ev.fogUntil)+'. Refúgiate en la Cornucopia.';
 return 'Día '+ev.day+' en juego desde las '+clock(ev.dayAt||ev.startAt)+'. admin1 decide cuándo empieza el siguiente.';
}
function timer(ev){
 if(ev.finished)return null;
 if(!ev.started)return countdown('Empieza en',ev.startAt,'¡Empieza ya!');
 if(ev.feastAt)return countdown('El Festín en',ev.feastAt,'¡Festín!');
 if(ev.fog)return countdown('Fin de la niebla en',ev.fogUntil,'Niebla disipada');
 const live=el('div',null,'event320-count event320-live');live.append(el('span','En juego','event320-count-label'),el('strong',ev.final?'Final':'Día '+ev.day+' de 3'));return live;
}
export function renderEvent320(root,ev,phase,{onAdvance,busy,now}={}){
 if(now)nowFn=now;
 root.hidden=!ev;if(!ev){root.replaceChildren();root.dataset.key='';return;}
 if(!ticker){ticker=setInterval(tick,1000);}
 const key=JSON.stringify([ev.started,ev.day,ev.dayAt,ev.fog,ev.fogUntil,ev.feastAt,ev.final,ev.finished,ev.canAdvance,!!busy,phase]);if(root.dataset.key===key){tick();return;}root.dataset.key=key;
 // Cabecera azul con el título y la cuenta atrás.
 const head=el('header',null,'event320-header'),title=el('div',null,'event320-title');
 const line=el('div',null,'event320-name');line.append(el('span','EVENTO','game-event177'),el('h2',ev.name));
 title.append(line,el('p','Hunger Games #11 · Evento especial','event320-sub'));
 head.append(title);const t=timer(ev);if(t)head.append(t);
 const state=el('p',status(ev),'event320-status');
 // Los días, como tarjetas.
 const days=el('ol',null,'event320-days');
 for(const d of ev.days){
  const final=d.day===0,current=ev.started&&!ev.finished&&(final?ev.final:!ev.final&&d.day===ev.day),done=ev.finished||(!final&&ev.started&&d.day<ev.day);
  const li=el('li',null,'event320-day'+(current?' event320-current':done?' event320-done':''));
  const top=el('div',null,'event320-day-top');top.append(el('span',final?'Final':'Día '+d.day,'event320-num'));
  if(current)top.append(el('em','HOY','event320-tag'));else if(done)top.append(el('em','HECHO','event320-tag event320-tag-done'));
  li.append(top,el('strong',d.title),el('p',d.text));days.append(li);
 }
 // Premios: podio y tabla.
 const prizes=el('section',null,'event320-prizes');prizes.append(el('h3','Premios del evento'));
 const podium=el('div',null,'event320-podium');
 for(const i of [1,0,2]){const p=ev.prizes[i];if(!p)continue;const box=el('div',null,'event320-place event320-place'+(i+1));box.append(el('span',(i+1)+'º','event320-medal'),el('b',p[0]+'K'),el('small',p[1]+' T$'));podium.append(box);}
 const more=el('details',null,'event320-more');more.append(el('summary','Ver premios del 4º al '+ev.prizes.length+'º'));
 const table=el('table',null,'event320-table'),tb=el('tbody');ev.prizes.slice(3).forEach((p,i)=>{const tr=el('tr');tr.append(el('td',(i+4)+'º'),el('td',prize(p)));tb.append(tr);});table.append(tb);more.append(table);
 prizes.append(podium,more);
 const body=el('div',null,'event320-body');body.append(state,days,prizes);
 const parts=[head,body];
 if(ev.canAdvance&&ev.next&&onAdvance){
  const bar=el('div',null,'event320-admin'),b=el('button','Empezar día '+ev.next.day+' · '+ev.next.title,'yellow-action');b.type='button';b.disabled=!!busy;b.onclick=()=>onAdvance(ev.next);
  bar.append(el('strong','Panel de admin1'),b,el('small','Solo lo ves tú. Se anuncia al momento en los comentarios.'));parts.push(bar);
 }
 root.replaceChildren(...parts);tick();
}
