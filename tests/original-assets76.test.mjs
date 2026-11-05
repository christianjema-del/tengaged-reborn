import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {renderAvatar,normalizeAvatar} from '../avatar-art.js';
for(const set of ['f1','f2']){const settings=normalizeAvatar({originalSet:set,skin:'#123456',hairColor:'#654321'});assert.equal(settings.originalSet,set);const svg=renderAvatar(settings);assert.ok(svg.includes('data:image/png;base64,'));assert.ok(svg.includes('#123456'));assert.doesNotMatch(svg,/undefined/);assert.equal((svg.match(/<image /g)||[]).length,7,'piel y pelo se usan dos veces: sobre y bajo el cuello');assert.ok(svg.includes('scale(0.9)'));const purchased=renderAvatar(settings,{skin:'custom-skin',_fullBody:true});assert.ok(purchased.includes('custom-skin'));assert.ok(!purchased.includes('data:image/png;base64,'));}
assert.throws(()=>normalizeAvatar({originalSet:'bad'}));assert.equal(normalizeAvatar({}).originalSet,'f1');
for(const name of ['icon_participant_number','icon_weapon_3','icon_cornucopia_food','user_hidden','header_hunger'])assert.equal(readFileSync(new URL('../assets/regaged/games/hunger/'+name+'.gif',import.meta.url)).subarray(0,3).toString(),'GIF');
console.log('PASS original layers embedded without external URLs, validated optional selection, custom skins preserved and five original Hunger GIFs.');

{const settings=normalizeAvatar({});const svg=renderAvatar(settings,{skin:'data:image/png;base64,SKIN',hair:'data:image/png;base64,HAIR',shirt:'data:image/png;base64,SHIRT'});
assert.ok(svg.includes('translate(100 156) scale(0.9) translate(-100 -156)'),'cabeza al 90 % con la barbilla fija');assert.ok(svg.includes('scale(0.9 1)'),'la melena conserva su largo');
assert.ok(svg.indexOf('SHIRT')<svg.lastIndexOf('HAIR'),'el pelo queda sobre la ropa');assert.equal((svg.match(/SHIRT/g)||[]).length,2,'href y xlink de una sola capa de ropa');
const full=renderAvatar(settings,{skin:'data:image/png;base64,FULL',_fullBody:true});assert.ok(!full.includes('scale(0.9'),'los avatares de cuerpo entero no se tocan');
console.log('PASS cabeza al 90 %, melenas hasta el borde y cuerpo entero sin cambios');}
