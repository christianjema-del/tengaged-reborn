import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V352: dos GIF más para Cristi (140×161, como los demás avatares de foto).
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
for(const [len,hash] of [[692186,1911013883],[567330,2345211243]])assert.ok(src.includes('(data.length==='+len+'&&hash==='+hash+')'),'falta la huella '+len);
assert.match(readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8'),/full-avatar115\.js\?v=352/);assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=352/);
console.log('PASS V352: GIF de Cristi en la lista de avatares de foto');
