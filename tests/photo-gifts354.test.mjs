import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V354: GIF de RelsB (cuenta id 11, antes Bowsy), 140x161 como los demás avatares de foto.
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
assert.ok(src.includes('(data.length===740926&&hash===53064014)'),'falta la huella del GIF');
assert.match(readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8'),/full-avatar115\.js\?v=354/);assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=354/);
console.log('PASS V354: GIF de RelsB en la lista de avatares de foto');
