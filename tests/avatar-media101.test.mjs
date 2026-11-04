import assert from 'node:assert/strict';import {avatarLayerImage} from '../functions/_shared/avatar-media.js';import {CRISTI_DESIGNS} from '../functions/_shared/cristi-assets100.js';import {renderAvatar} from '../avatar-art.js';
assert.equal(avatarLayerImage('data:image/png;base64,broken'),null);assert.equal(avatarLayerImage('<script>bad</script>'),null);assert.equal(avatarLayerImage(null),null);
for(const d of CRISTI_DESIGNS){assert.equal(avatarLayerImage(d.image_data),d.image_data);assert.equal(avatarLayerImage(d.image_data+'\n'),d.image_data);}
const svg=renderAvatar({},{shirt:CRISTI_DESIGNS[0].image_data});assert.ok(svg.includes('xmlns:xlink="http://www.w3.org/1999/xlink"'));assert.ok(svg.includes('xlink:href='));assert.ok(renderAvatar({skin:'#123456'}).includes('original-body-123456'));assert.ok(renderAvatar({skin:'#654321'}).includes('original-body-654321'));
console.log('PASS malformed layers isolated, valid imports preserved and SVG legacy hrefs / unique color filters');
