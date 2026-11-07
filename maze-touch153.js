// Mobile input for the original Maze SWF; scoring, timing and maze data stay in Flash.
export function installMazeTouch(host,player){
 const media=window.matchMedia('(any-pointer: coarse) and (max-width: 1024px)');
 if(!media.matches)return ()=>{};
 const abort=new AbortController(),options={signal:abort.signal};
 const bar=document.createElement('div');bar.className='maze-touch-controls';bar.setAttribute('role','group');bar.setAttribute('aria-label','Mover la bola de Maze');
 const help=document.createElement('p');help.textContent='Arrastra desde la bola azul o mantén pulsadas las flechas.';help.className='maze-touch-help';
 const codes={ArrowUp:38,ArrowLeft:37,ArrowDown:40,ArrowRight:39};let held=null,repeat=null,drag=null;
 function emit(type,key){if(type==='keydown'){const runtime=typeof player.ruffle==='function'?player.ruffle():player;runtime.callExternalInterface('tengagedMazeMove153',codes[key]);}}
 function release(){if(repeat)clearInterval(repeat);repeat=null;if(held)emit('keyup',held);held=null;for(const b of bar.children)b.setAttribute('aria-pressed','false');}
 function press(key){if(held===key)return;release();if(!media.matches)return;held=key;emit('keydown',key);repeat=setInterval(()=>{if(held)emit('keydown',held,true);},85);}
 for(const [key,label,glyph] of [['ArrowUp','Arriba','↑'],['ArrowLeft','Izquierda','←'],['ArrowDown','Abajo','↓'],['ArrowRight','Derecha','→']]){
  const b=document.createElement('button');b.type='button';b.dataset.glyph=glyph;b.dataset.direction=key;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed','false');
  b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||!media.matches)return;e.preventDefault();e.stopPropagation();window.getSelection?.()?.removeAllRanges();drag=null;press(key);b.setAttribute('aria-pressed','true');try{b.setPointerCapture?.(e.pointerId);}catch{}},options);
  b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();press(key);}},options);b.addEventListener('keyup',release,options);b.addEventListener('lostpointercapture',release,options);bar.append(b);
 }
 // Una pulsación larga no debe seleccionar la flecha ni abrir el menú del navegador.
 for(const type of ['touchstart','contextmenu','selectstart','dragstart'])bar.addEventListener(type,e=>{if(e.cancelable)e.preventDefault();},{...options,passive:false});
 const frame=player.parentElement,oldTouchAction=frame.style.touchAction;frame.style.touchAction='none';
 frame.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&media.matches)drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};},{...options,capture:true});
 frame.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const x=e.clientX-drag.x,y=e.clientY-drag.y;if(Math.max(Math.abs(x),Math.abs(y))<7){if(drag.moved)release();return;}drag.moved=true;e.preventDefault();e.stopPropagation();press(Math.abs(x)>Math.abs(y)?x>0?'ArrowRight':'ArrowLeft':y>0?'ArrowDown':'ArrowUp');},{...options,capture:true,passive:false});
 function end(e){if(drag?.id===e.pointerId)drag=null;release();}
 window.addEventListener('pointerup',end,options);window.addEventListener('pointercancel',end,options);window.addEventListener('blur',release,options);document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;release();}},options);
 const change=()=>{bar.hidden=help.hidden=!media.matches;if(!media.matches){drag=null;release();}};media.addEventListener('change',change,options);
 host.append(help,bar);
 return ()=>{release();abort.abort();frame.style.touchAction=oldTouchAction;bar.remove();help.remove();};
}
