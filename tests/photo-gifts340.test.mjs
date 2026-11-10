import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {renderAvatar} from '../avatar-art.js';
// V340: los GIF de DaisyJane, Ricardito (3), AntonioJ, Cristi (2), PauCubarsi, Fentanilo y MDMA, recortados a 140×161.
const src=readFileSync(new URL('../full-avatar115.js',import.meta.url),'utf8');
for(const [len,hash] of [[65226,872157832],[135190,122204576],[447678,4252054305],[434002,3276722645],[570502,1132412807],[47634,2253559386],[553630,224278942],[783874,4141580618],[655394,1328612017],[660490,3556596060]])assert.ok(src.includes('(data.length==='+len+'&&hash==='+hash+')'),'falta la huella '+len);
assert.ok(src.includes('(data.length===292302&&hash===3275557543)'),'se mantiene el de Bowsy');
const gif='data:image/gif;base64,'+Buffer.from('GIF89a'+'x'.repeat(40)).toString('base64');
const out=renderAvatar({},{skin:gif,hair:'data:image/png;base64,AAAA'});assert.equal((out.match(/<image /g)||[]).length,1,'un GIF de foto se ve solo, sin el avatar debajo');assert.match(out,/data-avatar-mode="photo"/);
const editor=readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8');assert.match(editor,/full-avatar115\.js\?v=340/);assert.match(editor,/avatar-art\.js\?v=340/);
assert.match(readFileSync(new URL('../avatar.html',import.meta.url),'utf8'),/avatar-editor\.js\?v=340/);
{const {decodeDesignImage}=await import('../functions/_shared/design-images.js');assert.match(readFileSync(new URL('../functions/_shared/design-images.js',import.meta.url),'utf8'),/value\.length>360000&&!isPhotoAvatar\(value\)/,'V341: los GIF aprobados grandes no chocan con el límite');assert.throws(()=>decodeDesignImage('data:image/png;base64,'+'A'.repeat(400000)),/demasiado grande/,'las demás imágenes grandes siguen rechazándose');}
console.log('PASS V340: 10 GIF nuevos en la lista de avatares de foto y el editor los muestra como foto completa');
