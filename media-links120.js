// Only recognized media providers can create embeds. Message HTML remains plain text.
export function mediaLink(value){let url;try{url=new URL(value.startsWith('www.')?'https://'+value:value);}catch{return null;}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;const host=url.hostname.toLowerCase();let id;
 if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be','www.youtu.be'].includes(host)){
  id=host.endsWith('youtu.be')?url.pathname.split('/')[1]:url.searchParams.get('v')||(/^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)||[])[1];if(!/^[\w-]{11}$/.test(id||''))return null;
  const raw=url.searchParams.get('t')||url.searchParams.get('start')||'',matches=/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);const start=/^\d+$/.test(raw)?Number(raw):matches?Number(matches[1]||0)*3600+Number(matches[2]||0)*60+Number(matches[3]||0):0;
  return {kind:'youtube',src:'https://www.youtube-nocookie.com/embed/'+id+(start>0&&start<86400?'?start='+start:''),href:'https://www.youtube.com/watch?v='+id,title:'Vídeo de YouTube'};
 }
 if(['giphy.com','www.giphy.com'].includes(host)){
  const match=/^\/(?:gifs|stickers|embed)\/([^/]+)\/?$/.exec(url.pathname);if(!match)return null;id=match[1].split('-').at(-1);if(!/^[a-zA-Z0-9]{2,80}$/.test(id))return null;return {kind:'giphy',src:'https://giphy.com/embed/'+id,href:'https://giphy.com/gifs/'+id,title:'GIF de Giphy'};
 }
 if(/^(?:media[0-4]?|i)\.giphy\.com$/.test(host)){
  const match=/\/(?:media\/)?(?:v1\.[^/]+\/)?([a-zA-Z0-9]{2,80})\/(?:giphy|source|[\w-]+)\.(gif|webp)$/i.exec(url.pathname)||/^\/([a-zA-Z0-9]{2,80})\.gif$/i.exec(url.pathname);if(!match)return null;id=match[1];return {kind:'gif',src:'https://media.giphy.com/media/'+id+'/giphy.gif',href:'https://giphy.com/gifs/'+id,title:'GIF de Giphy'};
 }return null;
}
export function enhanceMedia(container){if(container.closest('script,style,textarea,input,[contenteditable=true],.embedded-media'))return;let count=container.querySelectorAll('.embedded-media').length;const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){if(count>=6)break;if(node.parentElement?.closest('a,button,script,style,textarea,input,.embedded-media'))continue;const raw=node.nodeValue||'',pattern=/(?:https?:\/\/|www\.)[^\s<>"']+/gi;let match,index=0,fragment=null;
  while((match=pattern.exec(raw))&&count<6){const original=match[0],clean=original.replace(/[.,!;:?)\]}]+$/,'');const media=mediaLink(clean);if(!media){
   if(container.id!=='bioText')continue;
   let external;try{external=new URL(clean.startsWith('www.')?'https://'+clean:clean);}catch{continue;}
   if(!['https:','http:'].includes(external.protocol)||external.username||external.password)continue;
   if(!fragment)fragment=document.createDocumentFragment();fragment.append(document.createTextNode(raw.slice(index,match.index)));
   const a=document.createElement('a');a.href=external.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=clean;fragment.append(a,document.createTextNode(original.slice(clean.length)));count++;index=match.index+original.length;continue;
  }if(!fragment)fragment=document.createDocumentFragment();fragment.append(document.createTextNode(raw.slice(index,match.index)));const wrapper=document.createElement('span');wrapper.className='embedded-media embedded-'+media.kind;
   const content=document.createElement(media.kind==='gif'?'img':'iframe');content.src=media.src;content.loading='lazy';content.referrerPolicy='strict-origin-when-cross-origin';if(media.kind==='gif'){content.alt=media.title;content.decoding='async';}else{content.title=media.title;content.setAttribute('allow','accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');content.setAttribute('allowfullscreen','');content.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');}
   const fallback=document.createElement('a');fallback.href=media.href;fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent=media.kind==='youtube'?'Ver en YouTube ↗':'Ver en Giphy ↗';fallback.className='embedded-media-fallback';wrapper.append(content,fallback);fragment.append(wrapper,document.createTextNode(original.slice(clean.length)));count++;index=match.index+original.length;
  }
  if(fragment){fragment.append(document.createTextNode(raw.slice(index)));node.replaceWith(fragment);container.classList.add('has-embedded-media');}
 }
}
if(typeof document!=='undefined'){
 const targets='main #bioText,main p,main .blog-full-body,main .mail-message-body,main .message-body,main .post-body';const excluded='script,style,textarea,input,[contenteditable=true],.embedded-media';const pending=new Set();let queued=false;
 function enqueue(node){const element=node.nodeType===1?node:node.parentElement;if(!element||element.closest(excluded))return;const closest=element.closest(targets);if(closest)pending.add(closest);if(node.nodeType===1)for(const item of node.querySelectorAll(targets))pending.add(item);if(!queued){queued=true;queueMicrotask(()=>{queued=false;for(const item of pending)if(item.isConnected)enhanceMedia(item);pending.clear();});}}
 enqueue(document.documentElement);new MutationObserver(records=>{for(const record of records)if(record.type==='characterData')enqueue(record.target);else for(const node of record.addedNodes)enqueue(node);}).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
}
