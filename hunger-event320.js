// V320/V322: cartel del evento «El Vasallaje» (Hunger Games #11) con el diseño de la web.
// admin1 ve un botón para empezar el día siguiente del evento.
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const clock=ms=>new Date(ms).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
const prize=([k,t])=>k+'K · '+t+' T$';
export function waitingText320(ev,now){
 if(!ev)return null;const left=ev.startAt-now;
 if(left<=0)return 'El Vasallaje está empezando…';
 const h=Math.floor(left/3600000),m=Math.floor(left%3600000/60000);
 return 'El Vasallaje empieza hoy a las '+clock(ev.startAt)+' (hora española). Faltan '+(h?h+' h ':'')+m+' min.';
}
function status(ev){
 if(ev.finished)return 'El evento ha terminado. ¡Gracias por participar!';
 if(!ev.started)return 'Empieza hoy a las '+clock(ev.startAt)+' (hora española). admin1 decide cuándo empieza cada día siguiente.';
 if(ev.final)return 'Final en juego: quedan 3 tributos o menos.';
 if(ev.feastAt)return 'El Festín empieza a las '+clock(ev.feastAt)+'.';
 if(ev.fog)return 'Hay niebla tóxica en el bosque hasta las '+clock(ev.fogUntil)+'.';
 return 'Día '+ev.day+' en juego desde las '+clock(ev.dayAt||ev.startAt)+'. admin1 decide cuándo empieza el siguiente.';
}
export function renderEvent320(root,ev,phase,{onAdvance,busy}={}){
 root.hidden=!ev;if(!ev){root.replaceChildren();root.dataset.key='';return;}
 const key=JSON.stringify([ev.started,ev.day,ev.dayAt,ev.fog,ev.feastAt,ev.final,ev.finished,ev.canAdvance,!!busy,phase]);if(root.dataset.key===key)return;root.dataset.key=key;
 const head=el('header',null,'event320-header');head.append(el('span','EVENTO','game-event177'),el('h2',ev.name),el('small',ev.started&&!ev.finished?(ev.final?'Final':'Día '+ev.day+' de 3'):''));
 const state=el('p',status(ev),'event320-status');
 const days=el('ol',null,'event320-days');
 for(const d of ev.days){
  const final=d.day===0,current=ev.started&&!ev.finished&&(final?ev.final:!ev.final&&d.day===ev.day),done=ev.finished||(!final&&ev.started&&d.day<ev.day);
  const li=el('li',null,current?'event320-current':done?'event320-done':'');
  li.append(el('span',final?'F':String(d.day),'event320-num'));
  const body=el('div');const title=el('strong',(final?'Final':'Día '+d.day)+' · '+d.title);body.append(title);
  if(current)body.append(el('em','HOY','event320-tag'));else if(done)body.append(el('em','HECHO','event320-tag event320-tag-done'));
  body.append(el('p',d.text));li.append(body);days.append(li);
 }
 const prizes=el('section',null,'event320-prizes');prizes.append(el('h3','Premios'));
 const podium=el('div',null,'event320-podium');ev.prizes.slice(0,3).forEach((p,i)=>{const box=el('div',null,'event320-place event320-place'+(i+1));box.append(el('b',(i+1)+'º'),el('span',prize(p)));podium.append(box);});
 const more=el('details',null,'event320-more');more.append(el('summary','Ver del 4º al '+ev.prizes.length+'º'));
 const table=el('table',null,'event320-table'),tb=el('tbody');ev.prizes.slice(3).forEach((p,i)=>{const tr=el('tr');tr.append(el('td',(i+4)+'º'),el('td',prize(p)));tb.append(tr);});table.append(tb);more.append(table);
 prizes.append(podium,more);
 const columns=el('div',null,'event320-columns');columns.append(days,prizes);
 const parts=[head,state,columns];
 if(ev.canAdvance&&ev.next&&onAdvance){
  const bar=el('div',null,'event320-admin'),b=el('button','Empezar día '+ev.next.day+' · '+ev.next.title,'yellow-action');b.type='button';b.disabled=!!busy;b.onclick=()=>onAdvance(ev.next);
  bar.append(b,el('small','Solo lo ves tú (admin1). Se anuncia al momento en los comentarios.'));parts.push(bar);
 }
 root.replaceChildren(...parts);
}
