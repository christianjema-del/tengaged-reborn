import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureCommunityPlus} from '../_shared/community-plus.js';
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export async function onRequest(ctx){return withStorageGuard(ctx,async({request,env})=>{
 if(request.method!=='GET')return new Response('Método no permitido.',{status:405,headers:{Allow:'GET'}});
 await ensureCommunityPlus(env.DB);const url=new URL(request.url),author=(url.searchParams.get('author')||'').slice(0,32);
 const posts=(await env.DB.prepare("SELECT id,author,title,body,created_at FROM blog_posts WHERE (?='' OR lower(author)=lower(?)) ORDER BY id DESC LIMIT 40").bind(author,author).all()).results;
 const base=url.origin,link=author?base+'/blogs?author='+encodeURIComponent(author):base+'/posts';
 const items=posts.map(p=>'<item><title>'+xml(p.title)+'</title><link>'+xml(base+'/blogs?id='+p.id)+'</link><guid isPermaLink="true">'+xml(base+'/blogs?id='+p.id)+'</guid><dc:creator>'+xml(p.author)+'</dc:creator><pubDate>'+new Date(String(p.created_at).replace(' ','T')+(String(p.created_at).includes('T')?'':'Z')).toUTCString()+'</pubDate><description>'+xml(p.body)+'</description></item>').join('');
 return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>'+xml(author?'El blog de '+author:'Blogs de Tengaged Reborn')+'</title><link>'+xml(link)+'</link><description>Últimas entradas del blog</description><language>es</language>'+items+'</channel></rss>',{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'no-cache'}});
 });}
