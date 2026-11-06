// Tarjeta de vista previa para los enlaces compartidos: siempre el avatar de Randomize y el título de cada página.
const ORIGIN='https://tengaged-reborns.pages.dev',SITE='Tengaged Reborn',TEXT='Tu comunidad de realities online.',IMAGE=ORIGIN+'/assets/preview/randomize.png';
const GAMES={'/rookies':'Rookies','/frookies':'Frookies','/hunger':'Hunger Games','/duel':'El Duelo','/casting-game':'Casting'};
const clean=value=>String(value||'').replace(/\[foto:\d+\]/gi,' ').replace(/\s+/g,' ').trim();
const short=(value,max)=>value.length>max?value.slice(0,max-1).trimEnd()+'…':value;
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const numberOf=value=>{const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:0;};
async function userName(db,name){return (await db.prepare('SELECT username FROM users WHERE lower(username)=lower(?) AND is_banned=0').bind(String(name).slice(0,32)).first())?.username||null;}
async function blogPreview(db,url,parts){
 const id=numberOf(url.searchParams.get('id')||(parts[0]==='blog'?parts[2]:0));
 if(id){const post=await db.prepare('SELECT p.title,substr(p.body,1,400) AS body,p.author FROM blog_posts p JOIN users u ON u.id=p.user_id WHERE p.id=? AND u.is_banned=0').bind(id).first();if(post)return {title:clean(post.title),description:clean(post.body)||'Blog de '+post.author};}
 const author=url.searchParams.get('author')||(parts[0]==='blog'?parts[1]:'');if(author){const name=await userName(db,author);if(name)return {title:'El blog de '+name};}
 return null;
}
async function dynamicPreview(db,url){
 const path=url.pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/',parts=path.split('/').filter(Boolean).map(part=>{try{return decodeURIComponent(part);}catch{return part;}});
 if(path==='/blogs'||parts[0]==='blog'||parts[0]==='posts')return blogPreview(db,url,parts);
 if(path==='/profile'){const name=url.searchParams.get('username');const found=name?await userName(db,name):null;return found?{title:'Perfil de '+found}:null;}
 if(path==='/designs'){const id=numberOf(url.searchParams.get('id'));if(!id)return null;const design=await db.prepare('SELECT d.title,d.author FROM community_designs d WHERE d.id=? AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)').bind(id).first();return design?{title:clean(design.title),description:'Diseño de '+design.author}:null;}
 if(GAMES[path]){const id=numberOf(url.searchParams.get('id'));return id?{title:GAMES[path]+' #'+id}:null;}
 return null;
}
export async function linkPreview(db,url){try{return await dynamicPreview(db,url);}catch{return null;}}
export function previewTags(preview,pageTitle){
 const title=escapeHtml(short(clean(preview?.title)||clean(pageTitle)||SITE,110)),description=escapeHtml(short(clean(preview?.description)||TEXT,180));
 return [`<meta name="description" content="${description}">`,`<meta property="og:site_name" content="${SITE}">`,'<meta property="og:type" content="website">','<meta property="og:locale" content="es_ES">',`<meta property="og:title" content="${title}">`,`<meta property="og:description" content="${description}">`,`<meta property="og:image" content="${IMAGE}">`,'<meta property="og:image:type" content="image/png">','<meta property="og:image:width" content="630">','<meta property="og:image:height" content="630">','<meta property="og:image:alt" content="Avatar de Randomize">','<meta name="twitter:card" content="summary">',`<meta name="twitter:title" content="${title}">`,`<meta name="twitter:description" content="${description}">`,`<meta name="twitter:image" content="${IMAGE}">`].join('');
}
