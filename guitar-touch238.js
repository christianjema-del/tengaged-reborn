// Botones táctiles para Guitar. Envían las mismas teclas 1-5 que usa el SWF:
// aciertos, fallos y puntuación siguen resolviéndose dentro del juego.
const LANES=[['1','Digit1',49,'red'],['2','Digit2',50,'green'],['3','Digit3',51,'blue'],['4','Digit4',52,'yellow'],['5','Digit5',53,'orange']];
const keyEvent=(type,[key,code,keyCode])=>new KeyboardEvent(type,{key,code,keyCode,which:keyCode,bubbles:true,composed:true,cancelable:true});
// Ruffle ignora las teclas si un toque fuera del reproductor le quitó el foco, y en un teléfono
// basta con rozar o desplazar la página. Por eso cada pulsación lo recupera con un toque en una
// esquina vacía del tablero.
function restoreFocus(player){
 const canvas=player.shadowRoot?.querySelector('canvas');if(!canvas)return;
 if(!canvas.dataset.guitarTouch){canvas.dataset.guitarTouch='1';for(const name of ['setPointerCapture','releasePointerCapture']){const original=canvas[name];canvas[name]=function(id){try{return original.call(this,id);}catch{}};}}
 const box=canvas.getBoundingClientRect(),options={bubbles:true,composed:true,cancelable:true,view:window,clientX:box.left+1,clientY:box.top+1,pointerId:238,pointerType:'mouse',isPrimary:true,button:0};
 canvas.dispatchEvent(new PointerEvent('pointerdown',{...options,buttons:1}));
 canvas.dispatchEvent(new PointerEvent('pointerup',{...options,buttons:0}));
}
export function installGuitarTouch(frame,player){
 const panel=document.createElement('section');panel.className='guitar-touch';panel.setAttribute('aria-label','Botones de Guitar');
 const help=document.createElement('p');help.textContent='Pulsa JUGAR en el tablero. Después toca cada color cuando la nota llegue a su aro.';panel.append(help);
 const row=document.createElement('div');row.className='guitar-touch-row';
 const abort=new AbortController(),options={signal:abort.signal};
 for(const lane of LANES){
  const button=document.createElement('button');button.type='button';button.className='guitar-touch-'+lane[3];button.textContent=lane[0];button.setAttribute('aria-label','Carril '+lane[0]);
  const release=()=>{if(!button.dataset.down)return;delete button.dataset.down;window.dispatchEvent(keyEvent('keyup',lane));};
  button.addEventListener('pointerdown',event=>{
   event.preventDefault();event.stopPropagation();
   try{button.setPointerCapture(event.pointerId);}catch{}
   button.dataset.down='1';restoreFocus(player);window.dispatchEvent(keyEvent('keydown',lane));
  },options);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release,options);
  row.append(button);
 }
 panel.append(row);frame.after(panel);
 return ()=>{abort.abort();panel.remove();};
}
