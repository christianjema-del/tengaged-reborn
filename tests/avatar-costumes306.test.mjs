import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderAvatar,normalizeAvatar} from '../avatar-art.js';
import {hairOrnamentCostume,HAIR_ORNAMENT_COSTUMES} from '../avatar-costumes.js';
// V306: Stitch, bicho y Tiburón cubren el avatar entero.
assert.deepEqual(Object.keys(HAIR_ORNAMENT_COSTUMES).map(Number),[299,300,301]);
const art='data:image/png;base64,QQ==',settings=normalizeAvatar({hair:3});
const plain=renderAvatar(settings,{hair_ornament:art}),hood=renderAvatar(settings,{hair_ornament:art,_hairOrnamentCostume:hairOrnamentCostume(300)}),shark=renderAvatar(settings,{hair_ornament:art,_hairOrnamentCostume:hairOrnamentCostume(301)});
const count=(svg,needle)=>svg.split(needle).length-1;
assert.ok(count(plain,'data-original-layer="hair"')>0,'sin disfraz el pelo se dibuja');
assert.equal(count(hood,'data-original-layer="hair"'),0,'la capucha oculta el pelo');
assert.ok(count(shark,'data-original-layer="hair"')>0,'el tiburón no oculta el pelo');
for(const svg of [hood,shark]){assert.equal(count(svg,'data-owned-layer="hair_ornament"'),2,'cuerpo y cabeza');assert.ok(svg.lastIndexOf('data-owned-layer="hair_ornament"')>svg.lastIndexOf('avatarBodyClip)">'+'') ,'encima de todo');}
assert.ok(hood.indexOf('data-owned-layer="hair_ornament"')>hood.lastIndexOf('data-original-layer="shirt"'),'por encima de la ropa');
assert.equal(count(plain,'data-owned-layer="hair_ornament"'),1,'los adornos normales no cambian');
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
assert.match(read('functions/api/avatar.js'),/hairOrnamentCostume\(layers\.find/);assert.match(read('functions/api/try-on.js'),/hairOrnamentCostume\(/);assert.match(read('avatar-editor.js'),/overlays\._hairOrnamentCostume=hairOrnamentCostume\(selection\.hair_ornament\)/);
console.log('costumes ok');
