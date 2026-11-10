// V333: en PC, el dueño del perfil ordena a sus amigos arrastrando los avatares de la cuadrícula
// (como en el Tengaged original). Al soltar se guarda el orden sin pulsar nada más.
export const canDragFriends333=()=>!!globalThis.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
// Mueve «name» a la posición de «target» (antes o después) dentro de la lista completa.
export function moveFriend333(order,name,target,after=false){
 const list=order.slice(),from=list.indexOf(name);if(from<0||name===target)return list;
 list.splice(from,1);let to=target==null?list.length:list.indexOf(target);if(to<0)return order.slice();if(after)to++;
 list.splice(to,0,name);return list;
}
// Mueve «name» al principio de una página (15 amigos por página).
export function moveToPage333(order,name,page,perPage=15){
 const list=order.slice(),from=list.indexOf(name);if(from<0)return list;list.splice(from,1);
 const to=Math.min(list.length,Math.max(0,(page-1)*perPage));list.splice(to,0,name);return list;
}
let dragged=null;
export function enableGridSort333(grid,pagesNav,{onMove,onPage}){
 grid.classList.add('friend-grid-sortable333');
 const clear=()=>{for(const n of grid.querySelectorAll('.drop-before333,.drop-after333,.dragging333'))n.classList.remove('drop-before333','drop-after333','dragging333');for(const b of pagesNav?.querySelectorAll('.drop-page333')||[])b.classList.remove('drop-page333');};
 for(const item of grid.querySelectorAll('[data-friend]')){
  item.draggable=true;item.title=(item.title?item.title+' · ':'')+'Arrastra para cambiar su posición';
  item.addEventListener('dragstart',e=>{dragged=item.dataset.friend;item.classList.add('dragging333');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);}catch{}});
  item.addEventListener('dragend',()=>{dragged=null;clear();});
  item.addEventListener('dragover',e=>{if(!dragged||item.dataset.friend===dragged)return;e.preventDefault();const r=item.getBoundingClientRect(),after=e.clientX>r.left+r.width/2;item.classList.toggle('drop-after333',after);item.classList.toggle('drop-before333',!after);});
  item.addEventListener('dragleave',()=>item.classList.remove('drop-before333','drop-after333'));
  item.addEventListener('drop',e=>{if(!dragged)return;e.preventDefault();const after=item.classList.contains('drop-after333'),name=dragged;dragged=null;clear();onMove(name,item.dataset.friend,after);});
 }
 for(const b of pagesNav?.querySelectorAll('button[data-page]')||[]){
  b.addEventListener('dragover',e=>{if(!dragged)return;e.preventDefault();b.classList.add('drop-page333');});
  b.addEventListener('dragleave',()=>b.classList.remove('drop-page333'));
  b.addEventListener('drop',e=>{if(!dragged)return;e.preventDefault();const name=dragged;dragged=null;clear();onPage(name,Number(b.dataset.page));});
 }
}
