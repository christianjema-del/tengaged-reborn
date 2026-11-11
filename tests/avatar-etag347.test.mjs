import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {revalidated347,avatarTag347} from '../functions/_shared/avatar-etag347.js';
// V347: los avatares se guardan en el navegador y solo se vuelven a descargar si cambian.
const gif=new Uint8Array([71,73,70,56,57,97,1,2,3]),req=h=>new Request('https://t.local/api/avatar?username=A',{headers:h||{}});
const first=await revalidated347(req(),gif,{'Content-Type':'image/gif','X-Avatar-Mode':'photo'});
assert.equal(first.status,200);const tag=first.headers.get('ETag');assert.match(tag,/^"a347-[0-9a-f]{32}"$/);assert.equal(first.headers.get('Cache-Control'),'private, no-cache');assert.equal(first.headers.get('X-Avatar-Mode'),'photo');assert.deepEqual(new Uint8Array(await first.arrayBuffer()),gif);
const again=await revalidated347(req({'If-None-Match':tag}),gif,{'Content-Type':'image/gif'});assert.equal(again.status,304,'mismo avatar: no se vuelve a mandar');assert.equal((await again.arrayBuffer()).byteLength,0);assert.equal(again.headers.get('ETag'),tag);
assert.equal((await revalidated347(req({'If-None-Match':'W/'+tag}),gif,{})).status,304,'también con W/');
const changed=await revalidated347(req({'If-None-Match':tag}),new Uint8Array([71,73,70,56,57,97,9]),{'Content-Type':'image/gif'});assert.equal(changed.status,200,'avatar nuevo: se descarga');assert.notEqual(changed.headers.get('ETag'),tag);
assert.notEqual(await avatarTag347(gif),await avatarTag347(new Uint8Array([1])));
assert.doesNotMatch(readFileSync(new URL('../functions/api/avatar.js',import.meta.url),'utf8').split('\n').filter(l=>l.includes("searchParams.get('format')==='json'")===false&&/return new Response\(.*image/.test(l)).join(''),/no-store/,'las imágenes ya no van con no-store');
assert.match(readFileSync(new URL('../avatar-display.js',import.meta.url),'utf8'),/cache:'no-cache'/,'el navegador revalida en vez de descargar siempre');
console.log('PASS V347: avatares con ETag; si no cambian, 304 sin volver a descargarlos');
