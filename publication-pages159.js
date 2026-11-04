// Numbered publication pages, with bounded controls for long archives.
export function pages(page,total,size,href){
 const nav=document.createElement('nav');nav.className='publication-pages159';nav.setAttribute('aria-label','Páginas de publicaciones');
 const count=Math.max(1,Math.ceil(total/size)),current=Math.max(1,Math.min(count,Number(page)||1));
 const visible=[...new Set([1,2,3,current-1,current,current+1,count])].filter(n=>n>=1&&n<=count).sort((a,b)=>a-b);let previous=0;
 for(const n of visible){if(previous&&n>previous+1){const gap=document.createElement('span');gap.textContent='…';nav.append(gap);}const item=document.createElement(n===current?'span':'a');item.textContent=String(n);if(n===current)item.setAttribute('aria-current','page');else item.href=href(n);item.setAttribute('aria-label','Página '+n);nav.append(item);previous=n;}
 return nav;
}
