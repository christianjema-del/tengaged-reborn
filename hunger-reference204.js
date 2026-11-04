// Only images actually shared in this game's public chat are shown here.
const chat=document.getElementById('public-chat'),gallery=document.getElementById('hunger-image-gallery'),empty=document.getElementById('hunger-image-empty');
let signature='',queued=false;
function refresh(){
 queued=false;if(!chat||!gallery)return;
 const sources=[...new Set([...chat.querySelectorAll('.embedded-media img')].map(img=>img.currentSrc||img.src).filter(src=>/^https?:\/\//i.test(src)))].slice(0,3);
 const next=JSON.stringify(sources);if(next===signature)return;signature=next;
 gallery.replaceChildren(...sources.map(src=>{const a=document.createElement('a'),img=document.createElement('img');a.href=src;a.target='_blank';a.rel='noopener noreferrer';img.src=src;img.alt='Imagen compartida en esta partida';img.loading='lazy';a.append(img);return a;}));
 if(empty)empty.hidden=!!sources.length;
}
if(chat&&gallery){new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(refresh);}}).observe(chat,{childList:true,subtree:true});refresh();}
