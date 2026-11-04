import assert from 'node:assert/strict';
import {renderAvatar} from '../avatar-art.js';
import {PHOTO_AVATAR_DATA} from '../functions/_shared/photo-assets115.js';
import {isPhotoAvatar} from '../full-avatar115.js';
assert.ok(isPhotoAvatar(PHOTO_AVATAR_DATA));assert.equal(isPhotoAvatar('data:image/png;base64,YQ=='),false);
const result=renderAvatar({},{skin:PHOTO_AVATAR_DATA,eyes:'eyes-hidden',mouth:'mouth-hidden',hair:'hair-hidden',shirt:'shirt-hidden',glasses:'glasses-hidden',background:'background-hidden'});
assert.equal((result.match(/<image /g)||[]).length,1);assert.ok(!result.includes('-hidden'));assert.match(result,/viewBox="0 0 200 230"/);assert.match(result,/preserveAspectRatio="xMidYMid slice"/);
console.log('PASS full photo suppresses all other layers without changing avatar canvas dimensions.');
