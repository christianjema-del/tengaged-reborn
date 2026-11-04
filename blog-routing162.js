export function blogRoute162(href){
 const url=new URL(href),parts=url.pathname.split('/').filter(Boolean).map(p=>{try{return decodeURIComponent(p);}catch{return p;}}),params=new URLSearchParams(url.search);
 if(parts[0]==='blog'&&parts[1]){params.set('author',parts[1]);if(/^\d+$/.test(parts[2]||''))params.set('id',parts[2]);}
 if(parts[0]==='posts'&&parts[1]==='topic'&&parts[2])params.set('q','#'+parts[2]);
 return params;
}
// Use the actual Pages document route: no HTML-extension redirect can discard the entry.
export function blogHref162(post){return '/blogs?id='+encodeURIComponent(post.id);}
export const authorHref162=name=>'/blogs?author='+encodeURIComponent(name);
