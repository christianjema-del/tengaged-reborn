// Ten original browser minigames for Casting. No Regaged assets or source are copied.
const E=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const rand=n=>Math.floor(Math.random()*n);
export function play(host,kind,questions,done){
 host.replaceChildren(E('h3',({wheel:'Ruleta de palabras',numbers:'Numbers',deal:'Trato o no trato',match:'Match Three',guitar:'Guitar',endurance:'Endurance',maze:'Maze',snow:'Snow Flakes',words:'Words',line:'Line Balls'})[kind]));
 const area=E('div',null,'mini-area');host.append(area);let ended=false;const timers=[];const finish=(score,answers)=>{if(ended)return;ended=true;timers.forEach(clearInterval);area.replaceChildren(E('p','Prueba terminada. Guardando resultado…'));done(answers?{answers}:{score:Math.max(0,Math.min(100,Math.round(score)))})};
 const btn=(parent,label,fn)=>{const b=E('button',label,'mini-button');b.type='button';b.onclick=fn;parent.append(b);return b};
 const txt=(value)=>area.append(E('p',value));
 const ticker=(fn,ms)=>{const t=setInterval(()=>{if(!ended)fn()},ms);timers.push(t)};
 const scoreLabel=E('p','Puntos: 0');area.append(scoreLabel);
 if(['wheel','numbers','words'].includes(kind)){
  const answers=[];let i=0;function next(){area.replaceChildren(scoreLabel);if(i>=5){finish(0,answers);return}txt(`Pregunta ${i+1}/5: ${questions[i]}`);const input=E('input');input.placeholder='Tu respuesta';input.autocomplete='off';area.append(input);const send=()=>{if(!input.value.trim())return;answers.push(input.value.trim());i++;next()};btn(area,'Responder',send);input.onkeydown=e=>{if(e.key==='Enter')send()};if(kind==='wheel')txt('Resuelve las palabras de la ruleta.');input.focus()}next();return;
 }
 if(kind==='deal'){
  let remaining=[5,10,15,20,25,30,40,50,60,70,80,100].sort(()=>Math.random()-.5);let opened=0;let bank=0;const openedSet=new Set();
  const grid=E('div',null,'mini-grid');area.append(grid);const offer=E('p');area.append(offer);
  remaining.forEach((value,i)=>btn(grid,'Maletín '+(i+1),e=>{if(e.target.disabled)return;e.target.disabled=true;e.target.textContent=value+' puntos';opened++;openedSet.add(i);bank+=value;scoreLabel.textContent='Maletines abiertos: '+opened;if(opened>=6){grid.querySelectorAll('button').forEach(b=>b.disabled=true);offer.textContent='Oferta del banco: '+Math.round(bank/6)+' puntos';btn(area,'Aceptar oferta',()=>finish(bank/6));btn(area,'Rechazar y arriesgar',()=>finish(remaining.filter((_,j)=>!openedSet.has(j)).reduce((a,b)=>Math.max(a,b),0)))} }));return;
 }
 if(kind==='match'){
  let board=Array.from({length:36},()=>rand(5)),score=0,moves=0,selected=-1;const grid=E('div',null,'mini-grid six');area.append(grid);
  function draw(){grid.replaceChildren();board.forEach((v,i)=>btn(grid,['🔴','🔵','🟢','🟡','🟣'][v],()=>{if(selected<0){selected=i;return}const j=selected;selected=-1;if(Math.abs(Math.floor(i/6)-Math.floor(j/6))+Math.abs(i%6-j%6)!==1)return;[board[i],board[j]]=[board[j],board[i]];let matches=new Set();for(let k=0;k<36;k++){let run=0;for(let n=k;n<36&&Math.floor(n/6)===Math.floor(k/6)&&board[n]===board[k];n++)run++;if(run>=3)for(let n=k;n<k+run;n++)matches.add(n);run=0;for(let n=k;n<36&&board[n]===board[k];n+=6)run++;if(run>=3)for(let n=k;n<k+run*6;n+=6)matches.add(n)}score+=matches.size*3;matches.forEach(n=>board[n]=rand(5));moves++;scoreLabel.textContent=`Puntos: ${score} · Movimientos: ${moves}/12`;draw();if(moves===12)finish(score)}))}draw();return;
 }
 if(kind==='guitar'){
  txt('Pulsa F, G, Espacio, H o J cuando aparezca la nota. 20 notas.');let i=0,score=0,active='';const note=E('div','♪','mini-note');area.append(note);const keys=['F','G','ESPACIO','H','J'];const controls=E('div',null,'mini-grid');area.append(controls);const press=k=>{if(ended||!active)return;if(k===active)score+=5;active='';scoreLabel.textContent=`Puntos: ${score} · Notas: ${i}/20`};keys.forEach(k=>btn(controls,k,()=>press(k)));const keyHandler=e=>press(e.code==='Space'?'ESPACIO':e.key.toUpperCase());document.addEventListener('keydown',keyHandler);const tick=setInterval(()=>{if(ended){clearInterval(tick);document.removeEventListener('keydown',keyHandler);return}active=keys[rand(5)];note.textContent='♪ '+active;i++;if(i>20){clearInterval(tick);document.removeEventListener('keydown',keyHandler);finish(score)}},750);timers.push(tick);return;
 }
 if(kind==='endurance'){
  txt('Sigue el objetivo móvil con el ratón o el dedo durante 15 segundos.');const field=E('div',null,'mini-field');area.append(field);const target=E('div','●','mini-target');field.append(target);let points=0,t=0,on=false;field.onpointermove=e=>{const r=target.getBoundingClientRect();on=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};ticker(()=>{target.style.left=rand(85)+'%';target.style.top=rand(75)+'%';if(on)points+=3;t++;scoreLabel.textContent='Puntos: '+points;if(t>=30)finish(points)},500);return;
 }
 if(kind==='maze'){
  txt('Llega a la bandera. Usa flechas o los botones.');const walls=new Set([12,13,14,22,24,25,34,35,36,42,48,52,56,58,64,66,72,74,76,84,86,87,92]);let pos=0,steps=0;const grid=E('div',null,'mini-grid ten');area.append(grid);const goal=99;const move=(dx,dy)=>{const x=pos%10+dx,y=Math.floor(pos/10)+dy;if(x<0||x>9||y<0||y>9)return;const p=y*10+x;if(walls.has(p))return;pos=p;steps++;draw();if(pos===goal)finish(Math.max(20,100-steps))};function draw(){grid.replaceChildren();for(let i=0;i<100;i++)grid.append(E('span',i===pos?'🧑':i===goal?'🏁':walls.has(i)?'⬛':'·','mini-cell'))}draw();const nav=E('div',null,'mini-grid');area.append(nav);[['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]].forEach(([s,x,y])=>btn(nav,s,()=>move(x,y)));const key=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(m){e.preventDefault();move(...m)}};document.addEventListener('keydown',key);ticker(()=>{if(ended)document.removeEventListener('keydown',key)},500);btn(area,'Finalizar recorrido',()=>finish(pos===goal?80:Math.floor(pos/2)));return;
 }
 if(kind==='snow'){
  txt('Atrapa los copos antes de que desaparezcan. 20 oportunidades.');const field=E('div',null,'mini-field');area.append(field);let score=0,t=0;function spawn(){const flake=E('button','❄️','mini-flake');flake.type='button';flake.style.left=rand(85)+'%';flake.style.top=rand(75)+'%';flake.onclick=()=>{score+=5;flake.remove();scoreLabel.textContent='Puntos: '+score};field.append(flake);setTimeout(()=>flake.remove(),1350);t++;if(t===20) setTimeout(()=>finish(score),1450)}spawn();ticker(()=>{if(t<20)spawn()},650);return;
 }
 if(kind==='line'){
  txt('Une dos bolas iguales contiguas. Selecciona dos piezas; 15 movimientos.');let board=Array.from({length:25},()=>rand(4)),selected=-1,moves=0,score=0;const grid=E('div',null,'mini-grid five');area.append(grid);function draw(){grid.replaceChildren();board.forEach((v,i)=>btn(grid,['🔴','🔵','🟢','🟡'][v],()=>{if(selected<0){selected=i;return}let j=selected;selected=-1;if(board[i]===board[j]&&Math.abs(i%5-j%5)+Math.abs(Math.floor(i/5)-Math.floor(j/5))===1){score+=7;board[i]=rand(4);board[j]=rand(4)}moves++;scoreLabel.textContent=`Puntos: ${score} · Turnos: ${moves}/15`;draw();if(moves===15)finish(score)}))}draw();return;
 }
}
