import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeAvatar,renderAvatar,avatarOptions,skinPalette,featurePalette} from '../avatar-art.js';
import {ORIGINAL_AVATAR_ASSET_COUNT147,originalLayer147,originalLayerPath147} from '../original-avatar147.js';
import fs from 'node:fs';
test('all 223 authentic assets and every shape use canonical canvas',()=>{
 assert.equal(ORIGINAL_AVATAR_ASSET_COUNT147,223);
 for(let body=0;body<4;body++)for(const [slot,count] of Object.entries(avatarOptions))for(let i=0;i<count;i++){
  const s=normalizeAvatar({body,[slot]:i}),svg=renderAvatar(s);assert.match(svg,/viewBox="0 0 200 230"/);assert.ok(!svg.includes('<path'));assert.ok(!svg.includes('undefined'));assert.ok(!svg.includes('feFlood'));
  if(slot==='body'||slot!=='glasses'||i){const data=originalLayer147(s,slot);assert.ok(Buffer.from(data.split(',')[1],'base64').subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));assert.ok(fs.existsSync(new URL('../assets/regaged/'+originalLayerPath147(s,slot),import.meta.url)));}
 }
});
test('owned designs override layers in original stacking order',()=>{
 const svg=renderAvatar({},{skin:'owned-skin',shirt:'owned-shirt',mouth:'owned-mouth',eyes:'owned-eyes',glasses:'owned-glasses',hair:'owned-hair'});let last=-1;for(const slot of ['skin','shirt','mouth','eyes','glasses','hair']){const i=svg.indexOf('data-owned-layer="'+slot+'"');assert.ok(i>last);last=i;}assert.ok(!svg.includes('data-original-layer="body"'));const full=renderAvatar({},{skin:'full',_fullBody:true});assert.ok(!full.includes('data-original-layer'));
});
test('reference defaults, palette and strict settings remain stable',()=>{const s=normalizeAvatar({});assert.equal(s.eyes,1);assert.equal(s.mouth,1);assert.equal(s.hair,8);assert.equal(s.background,'#d7e7f4');assert.equal(skinPalette.length,15);assert.equal(featurePalette.length,16);assert.equal(normalizeAvatar({body:3}).body,3);assert.throws(()=>normalizeAvatar({body:4}));assert.throws(()=>normalizeAvatar({skin:'bad'}));});
