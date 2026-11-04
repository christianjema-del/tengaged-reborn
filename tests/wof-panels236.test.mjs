import assert from 'node:assert/strict';
import {WOF_PANELS,WOF_PANELS_PER_GAME,wofPanels} from '../functions/_shared/wof-panels236.js';
import {gameData} from '../functions/_shared/flash-data.js';
// Palabras que en castellano llevan tilde o Ñ: el juego no puede mostrarlas bien.
const ACCENTED=/\b(LEON|LIMON|ARBOL|AVION|AUTOBUS|MEDICO|PARIS|BERLIN|MADRE MIA|MAS|TAMBIEN|CAFE|SOFA|LAPIZ|PINA|ESPANA|MANANA|ANO|NINO|RIO|DIA|PAIS|PLATANO)\b/;
assert.ok(WOF_PANELS.length>=100,'banco suficiente');assert.ok(WOF_PANELS.length>=WOF_PANELS_PER_GAME);
const seen=new Set();
for(const {question,answer} of WOF_PANELS){
 assert.match(question,/^[A-Za-z ]+$/,'el titulo del SWF no tiene tildes, enes ni signos: '+question);
 assert.ok(question.length<=26,'el enunciado debe caber en una linea: '+question);
 assert.match(answer,/^[A-Z]+( [A-Z]+)*$/,'el panel solo admite A-Z: '+answer);
 assert.ok(answer.length<=30,'cabe en el panel: '+answer);
 assert.ok(answer.split(' ').every(w=>w.length<=12),'palabra demasiado larga: '+answer);
 assert.ok(/[BCDFGHJKLMNPQRSTVWXYZ]/.test(answer)&&/[AEIOU]/.test(answer),'consonantes y vocales: '+answer);
 assert.ok(!ACCENTED.test(answer),'lleva tilde en castellano: '+answer);
 assert.ok(!seen.has(answer),'respuesta repetida: '+answer);seen.add(answer);
 const words=answer.split(' ').filter(w=>w.length>3);assert.ok(!words.some(w=>question.toUpperCase().split(' ').includes(w)),'el enunciado no revela la respuesta: '+question);
}
const data=gameData('WOF',100);assert.equal(data.items.length,WOF_PANELS_PER_GAME);assert.equal(new Set(data.items.map(i=>i.answer)).size,WOF_PANELS_PER_GAME);assert.ok(data.items.every(i=>WOF_PANELS.some(p=>p.answer===i.answer&&p.question===i.question)));
assert.notDeepEqual(wofPanels(()=>0).map(p=>p.answer),wofPanels(()=>0.99).map(p=>p.answer));
assert.equal(gameData('WORDS',100).items.length,64);assert.equal(gameData('WORDS',100).items[0].answer,'TIGER');
console.log('PASS Wheel of Fortune: paneles en castellano compatibles con el SWF, sin repetir y en orden aleatorio');
