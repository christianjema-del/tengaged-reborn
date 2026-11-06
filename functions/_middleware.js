import {linkPreview,previewTags} from './_shared/link-preview.js';
// Solo corre en las páginas listadas en _routes.json; imágenes, estilos y scripts siguen siendo estáticos.
export async function onRequest({request,env,next}){
 const response=await next();
 if(!['GET','HEAD'].includes(request.method)||!(response.headers.get('content-type')||'').includes('text/html'))return response;
 const preview=await linkPreview(env.DB,new URL(request.url));let pageTitle='';
 return new HTMLRewriter().on('title',{text(chunk){pageTitle+=chunk.text;}}).on('head',{element(head){head.onEndTag(end=>{end.before(previewTags(preview,pageTitle),{html:true});});}}).transform(response);
}
