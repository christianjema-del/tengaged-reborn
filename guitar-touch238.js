// Botones táctiles para Guitar. Envían las mismas teclas 1-5 que usa el SWF:
// aciertos, fallos y puntuación siguen resolviéndose dentro del juego.
const LANES=[['1','Digit1',49,'red'],['2','Digit2',50,'green'],['3','Digit3',51,'blue'],['4','Digit4',52,'yellow'],['5','Digit5',53,'orange']];
const keyEvent=(type,[key,code,keyCode])=>new KeyboardEvent(type,{key,code,keyCode,which:keyCode,bubbles:true,composed:true,cancelable:true});
export function installGuitarTouch(frame,player){
 const panel=document.createElement('section');panel.className='guitar-touch';panel.setAttribute('aria-label','Botones de Guitar');
 const help=document.createElement('p');help.textContent='Pulsa START en el tablero. Después toca cada color cuando la nota llegue a su aro.';panel.append(help);
 const row=document.createElement('div');row.className='guitar-touch-row';
 const abort=new AbortController(),options={signal:abort.signal};
 for(const lane of LANES){
  const button=document.createElement('button');button.type='button';button.className='guitar-touch-'+lane[3];button.textContent=lane[0];button.setAttribute('aria-label','Carril '+lane[0]);
  const release=()=>{if(!button.dataset.down)return;delete button.dataset.down;window.dispatchEvent(keyEvent('keyup',lane));};
  button.addEventListener('pointerdown',event=>{
   // Ruffle pierde el foco con cualquier pulsación fuera del reproductor y dejaría de oír las teclas.
   event.preventDefault();event.stopPropagation();
   try{button.setPointerCapture(event.pointerId);}catch{}
   button.dataset.down='1';window.dispatchEvent(keyEvent('keydown',lane));
  },options);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release,options);
  row.append(button);
 }
 panel.append(row);frame.after(panel);
 return ()=>{abort.abort();panel.remove();};
}
