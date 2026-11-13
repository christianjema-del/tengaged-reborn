import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// V355: en la biografía, los vídeos se ven como vídeo y los enlaces externos funcionan.
class Node{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=[...n];}setAttribute(k,v){this.attrs[k]=v;}}
globalThis.document={createElement:t=>new Node(t.toUpperCase()),createTextNode:t=>({text:t})};
const {richText,youtubeId,vimeoId}=await import('../rich-profile.js');
assert.equal(youtubeId('https://www.youtube.com/watch?v=L_C1EB0qoPY&list=RDL_C1EB0qoPY&start_radio=1'),'L_C1EB0qoPY','el enlace de RelsB');
for(const u of ['https://youtu.be/L_C1EB0qoPY','https://m.youtube.com/watch?v=L_C1EB0qoPY','https://www.youtube.com/shorts/L_C1EB0qoPY','https://music.youtube.com/watch?v=L_C1EB0qoPY'])assert.equal(youtubeId(u),'L_C1EB0qoPY',u);
for(const u of ['https://youtube.com.evil.test/watch?v=L_C1EB0qoPY','https://www.youtube.com/watch?v=<script>','https://evil.test/?v=L_C1EB0qoPY','javascript:alert(1)'])assert.equal(youtubeId(u),null,u);
assert.equal(vimeoId('https://vimeo.com/123456789'),'123456789');assert.equal(vimeoId('https://vimeo.com.evil.test/123456789'),null);
const root=new Node('DIV');richText(root,'Mi canción: https://www.youtube.com/watch?v=L_C1EB0qoPY&list=RDL_C1EB0qoPY&start_radio=1');
const box=root.children.find(n=>n.className==='bio-video');assert.ok(box,'se ve el vídeo');const f=box.children[0];assert.equal(f.tagName,'IFRAME');assert.equal(f.src,'https://www.youtube-nocookie.com/embed/L_C1EB0qoPY');assert.ok(!root.children.some(n=>n.tagName==='A'),'y no el enlace');
const gif=new Node('DIV');richText(gif,'https://i.pinimg.com/originals/6e/97/b4/6e97b4038c199cdc0773ccb9d2e3ec87.gif');assert.equal(gif.children.find(n=>n.tagName==='IMG')?.src,'https://i.pinimg.com/originals/6e/97/b4/6e97b4038c199cdc0773ccb9d2e3ec87.gif','el GIF de PauCubarsi sigue viéndose');
const vid=new Node('DIV');richText(vid,'https://example.com/clip.mp4');assert.equal(vid.children.find(n=>n.tagName==='VIDEO')?.controls,true,'vídeo directo');
const link=new Node('DIV');richText(link,'Mira http://example.com/pagina, mola');const a=link.children.find(n=>n.tagName==='A');assert.equal(a.href,'http://example.com/pagina','http también enlaza');assert.equal(a.target,'_blank');assert.match(a.rel,/noopener/);assert.ok(link.children.some(n=>n.text===','),'la coma no entra en el enlace');
const evil=new Node('DIV');richText(evil,'javascript:alert(1) "><img src=x onerror=alert(1)>');assert.ok(!evil.children.some(n=>n.tagName),'nada ejecutable');
assert.match(readFileSync(new URL('../profile.html',import.meta.url),'utf8'),/rich-profile\.js\?v=355[\s\S]*|profile-bio355\.css\?v=355/);
console.log('PASS V355: vídeos de YouTube/Vimeo/mp4 e imágenes se ven en la biografía; los demás enlaces funcionan');
