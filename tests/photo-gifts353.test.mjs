import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V353: tercer GIF de Bowsy (Tenor, 140x161 como los demás avatares de foto).
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
assert.ok(src.includes('(data.length===570174&&hash===1651183593)'),'falta la huella del GIF');
assert.match(readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8'),/full-avatar115\.js\?v=3\d\d/);assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=3\d\d/);
console.log('PASS V353: GIF de Bowsy en la lista de avatares de foto');
