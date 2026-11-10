import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
// V342: insignia de rol junto al nombre del perfil: Administrador (rosa, corona) y Moderador (azul, escudo).
assert.match(read('functions/api/profile.js'),/is_moderator: Boolean\(profile\.is_moderator\)/,'el perfil público dice si es moderador');
const html=read('profile.html');assert.match(html,/role-badge342\.css\?v=342/);assert.match(html,/dataset\.role=profile\.is_admin\?"admin":"mod"/);assert.match(html,/toggle\("hidden", !profile\.is_admin&&!profile\.is_moderator\)/);
const css=read('role-badge342.css');assert.match(css,/#roleBadge#roleBadge\[data-role=mod\]/);assert.match(css,/#ff536d/);assert.match(css,/#roleBadge#roleBadge\.hidden\{display:none!important\}/);
console.log('PASS V342: insignia de Administrador renovada y Moderador visible en su perfil');
