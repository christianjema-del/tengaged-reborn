// ÚNICO lanzador de minijuegos tanto para Casting como para Minijuegos.
// Nunca sustituir por una implementación alternativa (minigames.js).
import {play} from '/original-flash.js?v=245';
import {CASTING_MINIGAMES} from '/minigame-catalog.js?v=159';
export {CASTING_MINIGAMES};
export function launchCastingMinigame(container,kind,options={}){
 if(!Object.hasOwn(CASTING_MINIGAMES,kind))throw new Error('Minijuego de Casting desconocido');
 return play(container,kind,null,()=>{},options);
}
