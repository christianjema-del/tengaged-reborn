export function publicationDate159(raw){
 if(raw==null||raw==='')return '';
 const value=String(raw),date=new Date(value.includes('T')?value:value.replace(' ','T')+'Z');
 if(!Number.isFinite(date.getTime()))return '';
 const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
 return months[date.getUTCMonth()]+' '+date.getUTCDate()+', '+date.getUTCFullYear();
}
