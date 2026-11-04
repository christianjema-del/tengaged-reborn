export function enableFriendDrag231(row,handle,name,move){
 row.dataset.friendName=name;row.draggable=true;
 row.ondragstart=e=>{e.dataTransfer.setData('text/x-tengaged-friend',name);e.dataTransfer.effectAllowed='move';row.classList.add('friend-dragging231');};
 row.ondragover=e=>{if(e.dataTransfer.types.includes('text/x-tengaged-friend'))e.preventDefault();};
 row.ondrop=e=>{e.preventDefault();move(e.dataTransfer.getData('text/x-tengaged-friend'),name);};
 row.ondragend=()=>row.classList.remove('friend-dragging231');
 let pointer=null,target=name;
 handle.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();pointer=e.pointerId;target=name;handle.setPointerCapture?.(pointer);row.classList.add('friend-dragging231');};
 handle.onpointermove=e=>{if(pointer!==e.pointerId)return;e.preventDefault();if(e.clientY<70)window.scrollBy?.(0,-12);else if(e.clientY>window.innerHeight-70)window.scrollBy?.(0,12);const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.friend-reorder-row');if(hit)target=hit.dataset.friendName;};
 handle.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=null;row.classList.remove('friend-dragging231');handle.releasePointerCapture?.(e.pointerId);move(name,target);};
 handle.onpointercancel=()=>{pointer=null;row.classList.remove('friend-dragging231');};
}
