// Teclado grande para Words en móvil. Las letras del SWF miden unos 20 px en un teléfono y es fácil pisar la de al lado.
// La versión móvil del SWF (WordsTouch296) coloca siempre las 26 letras en las mismas casillas, sin los huecos «*» aleatorios.
// Cada tecla pulsa la letra original dentro del juego: puntuación, tiempo y envío del resultado no cambian.
const STAGE={width:550,height:400};
export const ROWS=['ABCDEFGHI','JKLMNOPQR','STUVWXYZ'];
export const FIRST={x:129,y:263},STEP={x:36,y:51};
export function letterPosition(letter){
 const row=ROWS.findIndex(r=>r.includes(letter));
 if(row<0)throw Error('Letra no válida');
 return {x:FIRST.x+STEP.x*ROWS[row].indexOf(letter),y:FIRST.y+STEP.y*row};
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function prepare(canvas){
 // Un evento sintético no tiene puntero activo y setPointerCapture lanzaría un error.
 if(canvas.dataset.wordsTouch)return;canvas.dataset.wordsTouch='1';
 for(const name of ['setPointerCapture','releasePointerCapture']){const original=canvas[name];canvas[name]=function(id){try{return original.call(this,id);}catch{}};}
}
async function tap(player,point){
 const canvas=player.shadowRoot?.querySelector('canvas');if(!canvas)return;prepare(canvas);
 const box=canvas.getBoundingClientRect();
 const options={bubbles:true,composed:true,cancelable:true,view:window,clientX:box.left+point.x*box.width/STAGE.width,clientY:box.top+point.y*box.height/STAGE.height,pointerId:296,pointerType:'mouse',isPrimary:true,button:0,buttons:0};
 canvas.dispatchEvent(new PointerEvent('pointerenter',{...options,bubbles:false}));
 canvas.dispatchEvent(new PointerEvent('pointermove',options));
 await wait(100); // El SWF corre a 12 fotogramas por segundo.
 canvas.dispatchEvent(new PointerEvent('pointerdown',{...options,buttons:1}));
 await wait(100);
 canvas.dispatchEvent(new PointerEvent('pointerup',options));
 await wait(40);
}
export function installWordsTouch(frame,player){
 const panel=document.createElement('section');panel.className='words-touch';panel.setAttribute('aria-label','Teclado de Words');
 const help=document.createElement('p');help.textContent='Pulsa JUGAR en el tablero. Después usa estas teclas grandes para elegir las letras.';panel.append(help);
 let queue=Promise.resolve();
 for(const row of ROWS){const line=document.createElement('div');line.className='words-touch-row';
  for(const letter of row){const key=document.createElement('button');key.type='button';key.textContent=letter;if('AEIOU'.includes(letter))key.className='words-touch-vowel';
   key.addEventListener('click',()=>{queue=queue.then(()=>tap(player,letterPosition(letter))).catch(()=>{});});line.append(key);}
  panel.append(line);}
 for(const type of ['contextmenu','selectstart','dragstart'])panel.addEventListener(type,event=>event.preventDefault());
 frame.after(panel);
 return ()=>panel.remove();
}
