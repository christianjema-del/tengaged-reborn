// Teclado grande para Wheel of Fortune en móvil. Las letras del SWF miden unos 13 px en un teléfono.
// Cada tecla pulsa la letra original: girar, comprar vocales, resolver y puntuar siguen dentro del juego.
const STAGE={width:550,height:400};
const ROWS=['ABCDEFGHI','JKLMNOPQR','STUVWXYZ'];
const FIRST={x:372,y:143},STEP={x:19,y:33.25};
export function letterPosition(letter){
 const row=ROWS.findIndex(r=>r.includes(letter));
 if(row<0)throw Error('Letra no válida');
 return {x:FIRST.x+STEP.x*ROWS[row].indexOf(letter),y:FIRST.y+STEP.y*row};
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function prepare(canvas){
 // Un evento sintético no tiene puntero activo y setPointerCapture lanzaría un error.
 if(canvas.dataset.wofTouch)return;canvas.dataset.wofTouch='1';
 for(const name of ['setPointerCapture','releasePointerCapture']){const original=canvas[name];canvas[name]=function(id){try{return original.call(this,id);}catch{}};}
}
async function tap(player,point){
 const canvas=player.shadowRoot?.querySelector('canvas');if(!canvas)return;prepare(canvas);
 const box=canvas.getBoundingClientRect();
 const options={bubbles:true,composed:true,cancelable:true,view:window,clientX:box.left+point.x*box.width/STAGE.width,clientY:box.top+point.y*box.height/STAGE.height,pointerId:236,pointerType:'mouse',isPrimary:true,button:0,buttons:0};
 canvas.dispatchEvent(new PointerEvent('pointerenter',{...options,bubbles:false}));
 canvas.dispatchEvent(new PointerEvent('pointermove',options));
 await wait(100); // El SWF corre a 12 fotogramas por segundo.
 canvas.dispatchEvent(new PointerEvent('pointerdown',{...options,buttons:1}));
 await wait(100);
 canvas.dispatchEvent(new PointerEvent('pointerup',options));
 await wait(40);
}
export function installWofTouch(frame,player){
 const panel=document.createElement('section');panel.className='wof-touch';panel.setAttribute('aria-label','Teclado de Wheel of Fortune');
 const help=document.createElement('p');help.textContent='Toca la ruleta para girar. Usa estas teclas para elegir letras, comprar vocales y escribir la solución.';panel.append(help);
 let queue=Promise.resolve();
 for(const row of ROWS){const line=document.createElement('div');line.className='wof-touch-row';
  for(const letter of row){const key=document.createElement('button');key.type='button';key.textContent=letter;if('AEIOU'.includes(letter))key.className='wof-touch-vowel';key.addEventListener('click',()=>{queue=queue.then(()=>tap(player,letterPosition(letter))).catch(()=>{});});line.append(key);}
  panel.append(line);}
 frame.after(panel);
 return ()=>panel.remove();
}
