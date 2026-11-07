// Mismos archivos SWF utilizados por Casting y por Minijuegos, embebidos con Ruffle.
const FILES={wheel:'Wof',numbers:'Numbers',deal:'Deal',match:'MatchThree',guitar:'Guitar',endurance:'Endurance',maze:'Maze',snow:'StarFlakes292',words:'Words',line:'LineBalls'};
const LABELS={wheel:'Wheel of Fortune',numbers:'Numbers',deal:'Deal or No Deal',match:'Match Three',guitar:'Guitar',endurance:'Endurance',maze:'Maze',snow:'Snow Flakes',words:'Words',line:'Line Balls'};
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function loadRuffle(){
 if(window.RufflePlayer?.newest)return Promise.resolve();
 if(window.__ruffleLoading)return window.__ruffleLoading;
 if(typeof WebAssembly==='undefined')return Promise.reject(Error('Este navegador no admite WebAssembly, necesario para las pruebas. Actualiza el navegador para jugar.'));
 window.RufflePlayer=window.RufflePlayer||{};
 window.RufflePlayer.config={...(window.RufflePlayer.config||{}),autoplay:'on',unmuteOverlay:'visible',warnOnUnsupportedContent:true,contextMenu:'off'};
 const script=document.createElement('script');script.src='/vendor/ruffle/ruffle.js?v=0.7.1-tg117';script.async=true;
 let resolveLoad,rejectLoad,settled=false;
 const task=new Promise((resolve,reject)=>{resolveLoad=resolve;rejectLoad=reject;});window.__ruffleLoading=task;
 const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);script.onload=null;script.onerror=null;if(error){if(window.__ruffleLoading===task)window.__ruffleLoading=null;script.remove();rejectLoad(error);}else resolveLoad();};
 const timer=setTimeout(()=>finish(Error('La carga del reproductor ha tardado demasiado. Revisa la conexión y pulsa Reintentar desafío.')),30000);
 script.onload=()=>finish(window.RufflePlayer?.newest?null:Error('No se pudo iniciar el reproductor. Pulsa Reintentar desafío.'));
 script.onerror=()=>finish(Error('No se pudo cargar el reproductor local. Pulsa Reintentar desafío.'));
 document.head.append(script);return task;
}
function withLoadDeadline(task,onTimeout){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{try{onTimeout();}finally{reject(Error('El minijuego ha tardado demasiado en cargar. Pulsa Reintentar desafío.'));}},60000);Promise.resolve(task).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
export async function play(host,kind,questions,done,options={}){
 if(!options.competitive&&!options.hunger&&!options.standalone){const user=window.TengagedUser||await window.TengagedSession?.catch(()=>null);if(user)options={...options,standalone:true,contextId:0};}

 host.replaceChildren();const file=FILES[kind];if(!file)throw Error('Juego no reconocido');
 const mobileMaze=kind==='maze'&&window.matchMedia?.('(any-pointer: coarse) and (max-width: 1024px)').matches;
 const mobileWheel=kind==='wheel'&&window.matchMedia?.('(any-pointer: coarse) and (max-width: 1024px)').matches;
 const mobileGuitar=kind==='guitar'&&window.matchMedia?.('(any-pointer: coarse) and (max-width: 1024px)').matches;
 const title=make('h3',LABELS[kind]);host.append(title);
 const note=make('p',options.duel?'Prueba de El Duelo. Pulsa dentro del tablero para controlarlo.':options.frookies?'Prueba de PoV. Pulsa dentro del tablero para controlarlo.':options.hunger?'Combate de Hunger · Minijuego original de Casting. Pulsa dentro del tablero para controlarlo.':'Prueba de Casting. Pulsa dentro del tablero para controlarla.');host.append(note);
 const container=make('div');container.className='original-flash-frame';host.append(container);
 const diag=make('p','');diag.setAttribute('role','status');
 const status=make('p','Cargando el juego original…');status.dataset.flashStatus='true';status.setAttribute('role','status');host.append(status);
 const instructions=make('p',options.hunger?'Al terminar se registrará y confirmará tu puntuación automáticamente. Mantén esta página abierta hasta ver el resultado.':options.standalone?'Al finalizar, el juego enviará la puntuación al ranking. Mantén esta página abierta.':options.competitive?'Tu resultado se guarda automáticamente al terminar. Mantén esta página abierta.':'Modo de práctica: los resultados no afectan a ninguna partida.');host.append(instructions);
 const form=make('form');form.className='flash-manual-score';const label=make('label','Puntuación (0–100) para prueba de integración: ');const input=make('input');input.type='number';input.min='0';input.max='100';input.step='1';input.required=true;label.append(input);const button=make('button','Finalizar y registrar puntuación de prueba');button.type='submit';button.disabled=true;form.append(label,button);// La puntuación manual queda deshabilitada hasta verificar la comunicación de extremo a extremo.
 // No mostrar controles de puntuación manual ni minijuegos alternativos.
 if(options.demo){instructions.textContent='Modo de prueba: la partida está finalizada; las puntuaciones no se guardan ni afectan a la clasificación.';}
 let submitted=false;form.onsubmit=e=>{e.preventDefault();if(submitted)return;const score=Number(input.value);if(!Number.isInteger(score)||score<0||score>100)return;submitted=true;button.disabled=true;done({score});};
 try{await loadRuffle();if(!host.isConnected)return;
 const player=window.RufflePlayer.newest().createPlayer();player.style.width='100%';player.style.height='100%';
 container.replaceChildren(player);
 // Regaged pasa estos parámetros mediante FlashVars. Su servidor usa IDs propios;
 // aquí se usa un ID local de prueba, sin suplantar ninguna cuenta de Regaged.
 // The SWFs declare subcontextId as Number; a composite id becomes NaN.
 const fightIndex=options.hunger?Number(String(options.fightId).split('-').at(-1)):null;
 if(options.hunger&&(!Number.isSafeInteger(fightIndex)||fightIndex<1))throw Error('Identificador de combate inválido.');
 const contextId=Number.isSafeInteger(Number(options.contextId)) && Number(options.contextId)>=0 ? Number(options.contextId) : 0;
 const runtime=typeof player.ruffle==='function'?player.ruffle():player;
 await withLoadDeadline(runtime.load({
   url:'/original-games/swf/'+(mobileMaze?'MazeTouch153':file)+'.swf',
   autoplay:'on',unmuteOverlay:'visible',contextMenu:'off',allowScriptAccess:!!mobileMaze,
   parameters:{context:'game',contextId:String(contextId),subcontext:options.duel?'duel':options.frookies?'frookies':options.hunger?'hunger':options.standalone?'minigame':options.competitive?'casting':'regaged',subcontextId:options.hunger?String(fightIndex):options.competitive?String(options.round):'0'}
 }),()=>player.remove());
 status.textContent=options.hunger?'':options.standalone?'Jugando · el resultado se registrará al terminar si el juego logra comunicarse con el servidor.':options.competitive?'Esperando el inicio del minijuego…':'Minijuego cargado. Los puntos de práctica no se guardan.';
 diag.textContent=options.competitive?'Prueba oficial de la ronda '+options.round+'. Todos los participantes juegan al mismo minijuego.':'';
 let disposeTouch=null;
 if(mobileMaze){
  try{if(!document.querySelector('link[data-maze-touch]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/maze-touch153.css?v=292';style.dataset.mazeTouch='true';document.head.append(style);}const {installMazeTouch}=await import('/maze-touch153.js?v=292');disposeTouch=installMazeTouch(host,player);}catch(error){console.warn('Maze touch controls:',error);}
 }
 if(mobileWheel){
  try{if(!document.querySelector('link[data-wof-touch]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/wof-touch236.css?v=236';style.dataset.wofTouch='true';document.head.append(style);}const {installWofTouch}=await import('/wof-touch236.js?v=236');disposeTouch=installWofTouch(container,player);}catch(error){console.warn('Wheel touch keys:',error);}
 }
 if(mobileGuitar){
  try{if(!document.querySelector('link[data-guitar-touch]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/guitar-touch238.css?v=245';style.dataset.guitarTouch='true';document.head.append(style);}const {installGuitarTouch}=await import('/guitar-touch238.js?v=245');disposeTouch=installGuitarTouch(container,player);}catch(error){console.warn('Guitar touch buttons:',error);}
 }
 return ()=>{disposeTouch?.();player.remove();};
 }catch(err){status.textContent='No se pudo abrir el juego original: '+(err?.message||err);button.disabled=true;throw err;}
}
