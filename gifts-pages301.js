// V301: números de página del paginador de regalos: primera, última y dos a cada lado de la actual.
export function pageList(page,total){
 if(total<=1)return [];const wanted=new Set([1,total]);for(let p=page-2;p<=page+2;p++)if(p>=1&&p<=total)wanted.add(p);
 const list=[...wanted].sort((a,b)=>a-b),out=[];for(const p of list){if(out.length&&p-out[out.length-1]>1)out.push('…');out.push(p);}return out;
}
