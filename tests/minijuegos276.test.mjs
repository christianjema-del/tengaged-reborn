import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8'),page=read('minijuegos.html'),js=read('minijuegos276.js'),api=read('functions/api/minigame-ranking.js');
assert.ok(!/<iframe/i.test(page),'sin marcos internos');assert.equal((page.match(/class="competition" href="\/minijuegos\.html\?juego=/g)||[]).length,10,'las diez pruebas abren en la misma página');
for(const id of ['title','notice','start','board','ranking','rankingMessage','rankings'])assert.match(page,new RegExp('id="'+id+'"'));
assert.match(api,/LIMIT 10`/,'el ranking devuelve diez');assert.match(js,/setAvatar\(img,p\.username\)/);assert.match(js,/slice\(0,10\)/);
assert.match(read('minijuego.html'),/location\.replace\('\/minijuegos\.html'/,'el enlace antiguo sigue funcionando');
console.log('PASS Minijuegos: una sola página, diez pruebas y Top 10 con avatar, nombre y resultado.');
