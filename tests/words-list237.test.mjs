import assert from 'node:assert/strict';
import {WORDS_LIST,WORDS_PER_GAME,wordsItems} from '../functions/_shared/words-list237.js';
import {gameData} from '../functions/_shared/flash-data.js';
assert.ok(WORDS_LIST.length>=400,'V343: unas 400 palabras');assert.ok(WORDS_LIST.filter(w=>w.answer.length>=9).length>=150,'V343: muchas de 9 letras o más');assert.ok(WORDS_LIST.length>=WORDS_PER_GAME);
assert.equal(new Set(WORDS_LIST.map(w=>w.answer)).size,WORDS_LIST.length,'sin repetidas');
for(const {answer} of WORDS_LIST){assert.match(answer,/^[A-Z]{4,14}$/,answer);assert.match(answer,/[AEIOU]/);assert.ok(!/^(DELFIN|FUTBOL|OTONO|AVION|LEON|ARBOL|RATON|CAMION)$/.test(answer),'lleva tilde o Ñ: '+answer);}
const data=gameData('WORDS',100);assert.equal(data.items.length,WORDS_PER_GAME);assert.equal(new Set(data.items.map(i=>i.answer)).size,WORDS_PER_GAME);
for(let i=0;i<20;i++)assert.ok(gameData('WORDS',100).items.filter(i=>i.answer.length>=9).length>=40,'V343: al menos 40 palabras largas por partida');
assert.notDeepEqual(wordsItems(()=>0).map(w=>w.answer),wordsItems(()=>0.99).map(w=>w.answer));
console.log('PASS Words: palabras en castellano compatibles con el SWF, sin repetir y en orden aleatorio');
