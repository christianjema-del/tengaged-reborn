import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('V314: el resultado de la prueba es el recuadro azul de 2014 en todos los juegos',()=>{
 const js=read('challenge-finished314.js'),css=read('challenge-finished314.css');
 assert.match(js,/'Felicidades\.'/);assert.match(js,/' Has terminado tu prueba'/);assert.match(js,/'puntos'/);
 assert.match(css,/#dce8f1/);assert.ok(!/#468058/.test(css));
 for(const f of ['survivor-challenge303.js','casting-challenge.js','frookies-challenge.js','duel-challenge217.js']){const s=read(f);assert.match(s,/showFinished\(\$\('challengeResult'\)/,f);assert.ok(!s.includes('Resultado guardado:'),f);}
 for(const f of ['survivor-challenge.html','casting-challenge.html','frookies-challenge.html','duel-challenge.html','hunger.html'])assert.match(read(f),/challenge-finished314\.css\?v=316/,f);
 assert.match(read('hunger-page.js'),/finishedTitle\(\$\('challenge-result-title'\)\)/);
});
test('V315: las páginas abiertas se recargan solas con versión nueva, pero nunca en mitad de un minijuego',()=>{
 const s=read('shell.js');assert.match(s,/TgVersionWatch314/);assert.match(s,/fetch\('\/api\/health'/);assert.match(s,/original-flash-frame/);assert.match(s,/240000/);
 for(const f of fs.readdirSync(new URL('..',import.meta.url)).filter(f=>f.endsWith('.html'))){const h=read(f);if(h.includes('/shell.js'))assert.match(h,/\/shell\.js\?v=314/,f);}
});
