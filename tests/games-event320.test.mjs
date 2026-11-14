import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('V320: Hunger #11 aparece como EVENTO en la sección de juegos',()=>{
 const src=readFileSync(new URL('../games-directory.js',import.meta.url),'utf8');
 const list=JSON.parse(src.match(/const EVENT_GAMES=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
 for(const k of ['hunger:4','hunger:11','duel:2','race:53'])assert.ok(list.includes(k),k);
 assert.match(src,/EVENT_GAMES\.includes\(g\.type\+':'\+Number\(g\.id\)\)/);
 assert.match(readFileSync(new URL('../games.html',import.meta.url),'utf8'),/games-directory\.js\?v=3\d\d/);
});
