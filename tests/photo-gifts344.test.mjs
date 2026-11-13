import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V344: GIF de Peach y segundo GIF de Bowsy, recortados a 140×161.
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
for(const [len,hash] of [[623986,2546443790],[549726,2914441622]])assert.ok(src.includes('(data.length==='+len+'&&hash==='+hash+')'),'falta la huella '+len);
const editor=readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8');assert.match(editor,/full-avatar115\.js\?v=3\d\d/);assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=3\d\d/);
console.log('PASS V344: GIF de Peach y Bowsy en la lista de avatares de foto');
