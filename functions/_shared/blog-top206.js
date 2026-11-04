import {schemaReady170,markSchema170} from './schema-ready170.js';
export async function rememberBlogTop206(db,top){
 if(!await schemaReady170(db,'blog-top206')){
  await db.prepare('CREATE TABLE IF NOT EXISTS blog_top206(post_id INTEGER PRIMARY KEY,best_rank INTEGER NOT NULL CHECK(best_rank BETWEEN 1 AND 20),achieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
  await markSchema170(db,'blog-top206');
 }
 const rows=top.slice(0,20).map((p,i)=>[p.id,i+1]);
 if(rows.length)await db.prepare('INSERT INTO blog_top206(post_id,best_rank) VALUES '+rows.map(()=>'(?,?)').join(',')+' ON CONFLICT(post_id) DO UPDATE SET best_rank=excluded.best_rank,achieved_at=CURRENT_TIMESTAMP WHERE excluded.best_rank<blog_top206.best_rank').bind(...rows.flat()).run();
}
export async function updateBlogTop206(db){
 const top=(await db.prepare("SELECT p.id,p.initial_points159+COALESCE(SUM(v.value*v.weight),0) AS score FROM blog_posts p LEFT JOIN blog_votes v ON v.post_id=p.id WHERE p.created_at>=datetime('now','-24 hours') GROUP BY p.id ORDER BY score DESC,p.id DESC LIMIT 20").all()).results;
 await rememberBlogTop206(db,top);return top;
}
