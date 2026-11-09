// V320: cartel del evento «El Vasallaje» (Hunger Games #11) en la página de la arena.
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const clock=ms=>new Date(ms).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'});
export function waitingText320(ev,now){
 if(!ev)return null;const left=ev.startAt-now;
 if(left<=0)return 'El Vasallaje está empezando…';
 const h=Math.floor(left/3600000),m=Math.floor(left%3600000/60000);
 return 'El Vasallaje empieza hoy a las '+clock(ev.startAt)+' (hora española). Faltan '+(h?h+' h ':'')+m+' min.';
}
export function renderEvent320(root,ev,phase){
 root.hidden=!ev;if(!ev){root.replaceChildren();return;}
 const key=JSON.stringify([ev.started,ev.day,ev.today?.title,ev.fog,ev.final,phase]);if(root.dataset.key===key)return;root.dataset.key=key;
 const head=el('p',null,'event320-head');head.append(el('span','EVENTO','game-event177'),el('strong',' '+ev.name));
 const today=el('p',null,'event320-today');
 if(phase==='finished')today.textContent='El evento ha terminado. ¡Gracias por participar!';
 else if(ev.today){today.append(el('strong',(ev.final?'Final':'Día '+ev.day)+' · '+ev.today.title+': '),document.createTextNode(ev.today.text));}
 else if(!ev.started)today.textContent='Empieza hoy a las '+clock(ev.startAt)+' (hora española). Cada día del evento trae un giro distinto y hay premios para los 19 supervivientes.';
 else today.textContent='Hoy se juega con las reglas normales. El Duelo de campeones llega cuando queden 3 tributos.';
 const list=el('ul',null,'event320-days');
 for(const d of ev.days)list.append(el('li',(d.day?'Día '+d.day:'Final')+' · '+d.title+': '+d.text));
 const prizes=el('details',null,'event320-prizes');prizes.append(el('summary','Premios del evento'));
 const ol=el('ol');ev.prizes.forEach(([k,t],i)=>ol.append(el('li',(i+1)+'º · '+k+'K · '+t+' T$')));prizes.append(ol);
 const rules=el('details',null,'event320-rules');rules.append(el('summary','Los giros del Vasallaje'),list);
 root.replaceChildren(head,today,rules,prizes);
}
