import {rememberBlogTop206,updateBlogTop206} from '../_shared/blog-top206.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {PUBLICATION_POINTS_SQL159} from '../_shared/publication-points159.js';
import {blogVotePower} from '../_shared/blog-vote-power.js';
import {context,mutation,fail,ok,text,number} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 const {db,me,url}=await context(request,env.DB);
 if(request.method==='GET'){
  const author=(url.searchParams.get('author')||'').slice(0,32),id=Number(url.searchParams.get('id'))||0,sort=url.searchParams.get('sort')||'latest',page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get('page'))||1))),size=Math.max(1,Math.min(40,Math.floor(Number(url.searchParams.get('page_size'))||15))),snapshot=Math.max(0,Math.floor(Number(url.searchParams.get('snapshot_id'))||0))||Number((await db.prepare('SELECT COALESCE(MAX(id),0) AS n FROM blog_posts').first()).n),commentPage=Math.max(1,Math.floor(Number(url.searchParams.get('comment_page'))||1)),q=(url.searchParams.get('q')||'').slice(0,80);
  const where="(?='' OR lower(p.author)=lower(?)) AND (?=0 OR p.id=?) AND (?='' OR instr(lower(p.title||' '||p.body),lower(?))>0) AND p.id<=?";
  const extra=sort==='today'?" AND p.created_at>=datetime('now','-24 hours')":sort==='previous'?" AND p.created_at<datetime('now','-3 days')":'';
  const args=[author,author,id,id,q,q,snapshot],order=['top','today'].includes(sort)?'score DESC,p.id DESC':'p.id DESC';
  const total=Number((await db.prepare('SELECT COUNT(*) AS n FROM blog_posts p WHERE '+where+extra).bind(...args).first()).n);
  const posts=(await db.prepare(`SELECT p.id,p.user_id,p.author,p.title,p.body,p.created_at,p.initial_points159 AS initial_points,
   (SELECT si.theme_code FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=p.user_id AND inv.is_equipped=1 AND si.category='Tarjetas de color' LIMIT 1) AS color_code,
   p.initial_points159+(SELECT COALESCE(SUM(weight),0) FROM blog_votes WHERE post_id=p.id AND value=1) AS plus_count,
   (SELECT COALESCE(SUM(weight),0) FROM blog_votes WHERE post_id=p.id AND value=-1) AS minus_count,
   p.initial_points159+COALESCE((SELECT SUM(value*weight) FROM blog_votes WHERE post_id=p.id),0) AS score,
   (SELECT COUNT(*) FROM blog_comments WHERE post_id=p.id AND hidden162=0) AS comments_count,
   COALESCE((SELECT value FROM blog_votes WHERE post_id=p.id AND user_id=?),0) AS my_vote,
   CASE WHEN p.created_at>=datetime('now','-3 days') THEN 1 ELSE 0 END AS voting_open
   FROM blog_posts p WHERE ${where+extra} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(me?.id||-1,...args,size,(page-1)*size).all()).results;
  const comments=id?(await db.prepare(`SELECT c.id,c.body,c.created_at,u.username AS author,c.user_id, CASE WHEN c.user_id=? OR EXISTS(SELECT 1 FROM blog_posts own WHERE own.id=c.post_id AND own.user_id=?) OR ?=1 THEN 1 ELSE 0 END AS can_hide,
  (SELECT COALESCE(SUM(weight),0) FROM blog_comment_votes WHERE comment_id=c.id AND value=1) AS plus_count,
  (SELECT COALESCE(SUM(weight),0) FROM blog_comment_votes WHERE comment_id=c.id AND value=-1) AS minus_count,
  COALESCE((SELECT value FROM blog_comment_votes WHERE comment_id=c.id AND user_id=?),0) AS my_vote
  FROM blog_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.hidden162=0 AND u.is_banned=0 ORDER BY c.id ASC LIMIT 100 OFFSET ?`).bind(me?.id||-1,me?.id||-1,me?.is_admin?1:0,me?.id||-1,id,(commentPage-1)*100).all()).results:[];
  const top=(await db.prepare(`SELECT p.id,p.initial_points159+COALESCE(SUM(v.value*v.weight),0) AS score FROM blog_posts p LEFT JOIN blog_votes v ON v.post_id=p.id WHERE p.created_at>=datetime('now','-24 hours') GROUP BY p.id ORDER BY score DESC,p.id DESC LIMIT 20`).all()).results;
  await rememberBlogTop206(db,top);
  const best=posts.length?(await db.prepare('SELECT post_id,best_rank FROM blog_top206 WHERE post_id IN ('+posts.map(()=>'?').join(',')+')').bind(...posts.map(p=>p.id)).all()).results:[];
  for(const p of posts){p.top_rank=top.findIndex(t=>t.id===p.id)+1;p.best_top_rank=best.find(t=>t.post_id===p.id)?.best_rank||0;}
  const recent=(await db.prepare("SELECT title,body FROM blog_posts WHERE created_at>=datetime('now','-24 hours') ORDER BY id DESC LIMIT 500").all()).results;
  const recentComments=(await db.prepare("SELECT body FROM blog_comments WHERE hidden162=0 AND created_at>=datetime('now','-24 hours') ORDER BY id DESC LIMIT 500").all()).results;
  const mentions=new Map();for(const text of [...recent.map(p=>p.title+' '+p.body),...recentComments.map(c=>c.body)])for(const name of new Set(text.match(/@[\p{L}\p{N}_-]+/gu)||[])){const k=name.slice(1).toLowerCase();mentions.set(k,(mentions.get(k)||0)+1);}
  const topics=new Map();for(const p of recent)for(const tag of new Set((p.title+' '+p.body).match(/#[\p{L}\p{N}_-]+/gu)||[])){const key=tag.toLowerCase();topics.set(key,(topics.get(key)||0)+1);}
  const trending=[];for(const [name,count] of [...mentions].sort((a,b)=>b[1]-a[1]).slice(0,5)){const u=await db.prepare('SELECT username FROM users WHERE lower(username)=? AND is_banned=0').bind(name).first();if(u)trending.push({username:u.username,count});}
  return ok({posts,comments,page,total,page_size:size,snapshot_id:snapshot,comment_page:commentPage,comments_total:id?Number((await db.prepare("SELECT COUNT(*) AS n FROM blog_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.hidden162=0 AND u.is_banned=0").bind(id).first()).n):0,trending,topics:[...topics].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tag,count])=>({tag,count})),vote_power:me?await blogVotePower(db,me.id):0});
 }
 if(!['POST','DELETE'].includes(request.method))return fail('Método no permitido.',405);
 const denied=mutation(request,me);if(denied)return denied;
 if(request.method==='DELETE'){
  const id=number(url.searchParams.get('id')),result=await db.prepare('DELETE FROM blog_posts WHERE id=? AND (user_id=? OR ?=1)').bind(id,me.id,me.is_admin?1:0).run();
  if(!result.meta.changes)return fail('No tienes permiso para borrar esta entrada.',403);
  await db.batch([db.prepare('DELETE FROM blog_comment_votes WHERE comment_id IN (SELECT id FROM blog_comments WHERE post_id=?)').bind(id),db.prepare('DELETE FROM blog_comments WHERE post_id=?').bind(id),db.prepare('DELETE FROM blog_votes WHERE post_id=?').bind(id)]);
  return ok({message:'Entrada eliminada.'});
 }
 const b=await request.json();
 if(b.action==='hide_comment'){
 const id=number(b.comment_id),c=await db.prepare('SELECT c.user_id,p.user_id AS post_owner FROM blog_comments c JOIN blog_posts p ON p.id=c.post_id WHERE c.id=?').bind(id).first();
 if(!c)return fail('Comentario no encontrado.',404);
 if(c.user_id!==me.id&&c.post_owner!==me.id&&!me.is_admin)return fail('No puedes ocultar este comentario.',403);
 await db.prepare('UPDATE blog_comments SET hidden162=1 WHERE id=?').bind(id).run();return ok({message:'Comentario ocultado.'});
 }
 if(b.action==='comment_vote'){
 const id=number(b.comment_id),c=await db.prepare('SELECT c.user_id FROM blog_comments c JOIN blog_posts p ON p.id=c.post_id WHERE c.id=? AND c.hidden162=0').bind(id).first();
 if(!c)return fail('Comentario no encontrado.',404);if(c.user_id===me.id)return fail('No puedes votar tu propio comentario.',403);
 return lockedVote162(db,'blog_comment_votes','comment_id',id,me,Number(b.value));
 }
 if(b.action==='vote'||b.action==='comment'){
  const id=number(b.post_id),post=await db.prepare("SELECT user_id,created_at>=datetime('now','-3 days') AS open FROM blog_posts WHERE id=?").bind(id).first();
  if(!post)return fail('Entrada no encontrada.',404);
  if(b.action==='comment'){
   const result=await db.prepare("INSERT INTO blog_comments(post_id,user_id,body) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM blog_comments WHERE user_id=? AND created_at>=datetime('now','-5 seconds'))").bind(id,me.id,text(b.body,1,2000),me.id).run();
   if(!result.meta.changes)return fail('Espera cinco segundos entre comentarios.',429);return ok({message:'Comentario publicado.'});
  }
  if(post.user_id===me.id)return fail('No puedes votar tu propia entrada.',403);if(!post.open)return fail('La votación de esta entrada ha terminado.',409);
  return lockedVote162(db,'blog_votes','post_id',id,me,Number(b.value));
 }
 const result=await db.prepare(`INSERT INTO blog_posts(user_id,author,title,body,initial_points159) VALUES(?,?,?,?,${PUBLICATION_POINTS_SQL159})`).bind(me.id,me.username,text(b.title,3,80),text(b.body,1,3000),me.id).run();return ok({id:result.meta.last_row_id,message:'Entrada publicada.'});
 }catch(e){return fail(e.message||'No se pudo completar la acción.');}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}

// Archived voting disables both controls after the first vote. Enforce that
// atomically in the server as well, including requests from stale clients.
async function lockedVote162(db,table,column,id,me,value){
 if(![-1,1].includes(value))return fail('El voto es definitivo: elige positivo o negativo.');
 const weight=await blogVotePower(db,me.id);
 const result=await db.prepare(`INSERT OR IGNORE INTO ${table}(${column},user_id,value,weight) VALUES(?,?,?,?)`).bind(id,me.id,value,weight).run();
 if(table==='blog_votes')await updateBlogTop206(db);
 const saved=await db.prepare(`SELECT value FROM ${table} WHERE ${column}=? AND user_id=?`).bind(id,me.id).first();
 if(!result.meta.changes&&saved.value!==value)return fail('Ya has votado. El voto no puede cambiarse ni retirarse.',409);
 const totals=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN value=1 THEN weight ELSE 0 END),0) AS plus_count,COALESCE(SUM(CASE WHEN value=-1 THEN weight ELSE 0 END),0) AS minus_count FROM ${table} WHERE ${column}=?`).bind(id).first();
 const initial=table==='blog_votes'?Number((await db.prepare('SELECT initial_points159 AS n FROM blog_posts WHERE id=?').bind(id).first())?.n||0):0;
 return ok({message:'Voto guardado.',locked:true,already_voted:!result.meta.changes,my_vote:saved.value,plus_count:totals.plus_count+initial,minus_count:totals.minus_count,score:initial+totals.plus_count-totals.minus_count});
}
