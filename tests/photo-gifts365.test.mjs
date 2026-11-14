import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V365: GIF para CamilaC (cuenta id 30), 140x161 como los demás avatares de foto.
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
assert.ok(src.includes('(data.length===417334&&hash===204605033)'),'falta la huella del GIF');
assert.match(readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8'),/full-avatar115\.js\?v=365/);assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=365/);
console.log('PASS V365: GIF de CamilaC en la lista de avatares de foto');
