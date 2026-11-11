// V347: los avatares llevan una huella (ETag). El navegador guarda la imagen y solo pregunta si ha cambiado:
// si es la misma, el servidor contesta 304 sin volver a mandar la imagen (los GIF pesan 400-600 KB).
// «private, no-cache» = cada vez se comprueba, así un avatar nuevo se ve al momento, pero sin descargarlo de nuevo.
export async function avatarTag347(bytes){const d=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));return '"a347-'+[...d.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('')+'"';}
export async function revalidated347(request,bytes,headers){
 const tag=await avatarTag347(bytes),base={...headers,'ETag':tag,'Cache-Control':'private, no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
 const sent=String(request.headers.get('If-None-Match')||'').split(',').map(t=>t.trim().replace(/^W\//,''));
 if(sent.includes(tag)){const {['Content-Type']:_,...rest}=base;return new Response(null,{status:304,headers:rest});}
 return new Response(bytes,{headers:base});
}
