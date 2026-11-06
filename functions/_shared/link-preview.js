// Tarjeta de vista previa: cada enlace enseña lo que contiene. Sin imagen propia, el avatar de Randomize.
const ORIGIN='https://tengaged-reborns.pages.dev',SITE='Tengaged Reborn',TEXT='Tu comunidad de realities online.',RANDOMIZE={url:ORIGIN+'/assets/preview/randomize.png',type:'image/png',width:630,height:630,alt:'Avatar de Randomize'};
const GAMES={'/rookies':'Rookies','/frookies':'Frookies','/hunger':'Hunger Games','/duel':'El Duelo','/casting-game':'Casting'};
const gameImage=(name,width,height)=>({url:ORIGIN+'/assets/preview/'+name+'.jpg',type:'image/jpeg',width,height,alt:name});
const PAGE_IMAGES={'/rookies':gameImage('rookies',640,452),'/rookies-bets':gameImage('rookies',640,452),'/frookies':gameImage('frookies',640,448),'/frookies-challenge':gameImage('frookies',640,448),'/hunger':gameImage('hunger',640,448),'/duel':gameImage('duel',640,480),'/duel-challenge':gameImage('duel',640,480),'/casting':gameImage('casting',640,448),'/casting-game':gameImage('casting',640,448),'/casting-challenge':gameImage('casting',640,448),'/casting-vote':gameImage('casting',640,448),'/game':gameImage('casting',640,448),'/room':gameImage('casting',640,448)};
const clean=value=>String(value||'').replace(/\[foto:\d+\]/gi,' ').replace(/\s+/g,' ').trim();
const short=(value,max)=>value.length>max?value.slice(0,max-1).trimEnd()+'…':value;
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const numberOf=value=>{const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:0;};
const avatarReady=new WeakMap();
export function ensureAvatarPreviews(db){if(!avatarReady.has(db))avatarReady.set(db,db.prepare('CREATE TABLE IF NOT EXISTS avatar_previews(user_id INTEGER PRIMARY KEY,image TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run().catch(error=>{avatarReady.delete(db);throw error;}));return avatarReady.get(db);}
async function userName(db,name){return (await db.prepare('SELECT username FROM users WHERE lower(username)=lower(?) AND is_banned=0').bind(String(name).slice(0,32)).first())?.username||null;}
async function avatarImage(db,name){try{await ensureAvatarPreviews(db);const row=await db.prepare('SELECT a.updated_at FROM avatar_previews a JOIN users u ON u.id=a.user_id WHERE lower(u.username)=lower(?)').bind(name).first();return row?{url:ORIGIN+'/api/avatar-preview?username='+encodeURIComponent(name)+'&v='+encodeURIComponent(row.updated_at),type:'image/jpeg',width:400,height:460,alt:'Avatar de '+name}:null;}catch{return null;}}
async function blogPreview(db,url,parts){
 const id=numberOf(url.searchParams.get('id')||(parts[0]==='blog'?parts[2]:0));
 if(id){const post=await db.prepare('SELECT p.title,substr(p.body,1,400) AS body,p.author FROM blog_posts p JOIN users u ON u.id=p.user_id WHERE p.id=? AND u.is_banned=0').bind(id).first();if(post)return {title:clean(post.title),description:clean(post.body)||'Blog de '+post.author,image:await avatarImage(db,post.author)};}
 const author=url.searchParams.get('author')||(parts[0]==='blog'?parts[1]:'');if(author){const name=await userName(db,author);if(name)return {title:'El blog de '+name,image:await avatarImage(db,name)};}
 return null;
}
async function dynamicPreview(db,url){
 const path=url.pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/',parts=path.split('/').filter(Boolean).map(part=>{try{return decodeURIComponent(part);}catch{return part;}});
 if(path==='/blogs'||parts[0]==='blog'||parts[0]==='posts')return blogPreview(db,url,parts);
 if(path==='/profile'){const name=url.searchParams.get('username');const found=name?await userName(db,name):null;return found?{title:'Perfil de '+found,image:await avatarImage(db,found)}:null;}
 if(path==='/designs'){const id=numberOf(url.searchParams.get('id'));if(!id)return null;const design=await db.prepare('SELECT d.title,d.author,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image FROM community_designs d WHERE d.id=? AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)').bind(id).first();return design?{title:clean(design.title),description:'Diseño de '+design.author,image:design.has_image?{url:ORIGIN+'/api/design-image?id='+id,alt:clean(design.title)}:null}:null;}
 if(GAMES[path]){const id=numberOf(url.searchParams.get('id'));if(id)return {title:GAMES[path]+' #'+id,image:PAGE_IMAGES[path]};}
 return PAGE_IMAGES[path]?{image:PAGE_IMAGES[path]}:null;
}
export async function linkPreview(db,url){try{return await dynamicPreview(db,url);}catch{const path=url.pathname.replace(/\.html$/,'').replace(/\/+$/,'');return PAGE_IMAGES[path]?{image:PAGE_IMAGES[path]}:null;}}
export function previewTags(preview,pageTitle){
 const title=escapeHtml(short(clean(preview?.title)||clean(pageTitle)||SITE,110)),description=escapeHtml(short(clean(preview?.description)||TEXT,180)),image=preview?.image||RANDOMIZE,src=escapeHtml(image.url);
 return [`<meta name="description" content="${description}">`,`<meta property="og:site_name" content="${SITE}">`,'<meta property="og:type" content="website">','<meta property="og:locale" content="es_ES">',`<meta property="og:title" content="${title}">`,`<meta property="og:description" content="${description}">`,`<meta property="og:image" content="${src}">`,...(image.type?[`<meta property="og:image:type" content="${image.type}">`]:[]),...(image.width?[`<meta property="og:image:width" content="${image.width}">`,`<meta property="og:image:height" content="${image.height}">`]:[]),`<meta property="og:image:alt" content="${escapeHtml(image.alt||SITE)}">`,'<meta name="twitter:card" content="summary">',`<meta name="twitter:title" content="${title}">`,`<meta name="twitter:description" content="${description}">`,`<meta name="twitter:image" content="${src}">`].join('');
}
