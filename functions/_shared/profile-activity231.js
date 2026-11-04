// Fuentes públicas independientes: una tabla antigua ausente no anula el perfil.
export async function profileActivity231(db,target,page=1,size=15){
 const parts=[],args=[];
 const tables=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name));
 const cols=async name=>new Set((await db.prepare('PRAGMA table_info('+name+')').all()).results.map(x=>x.name));
 if(tables.has('blog_posts')){
  parts.push("SELECT 'blog' AS kind,b.id AS ref,b.title AS label,b.created_at AS at FROM blog_posts b WHERE b.user_id=?");args.push(target.id);
  if(tables.has('blog_comments')){const c=await cols('blog_comments');parts.push("SELECT 'comment',b.id,b.title,c.created_at FROM blog_comments c JOIN blog_posts b ON b.id=c.post_id WHERE c.user_id=?"+(c.has('hidden162')?' AND COALESCE(c.hidden162,0)=0':''));args.push(target.id);}
 }
 if(tables.has('community_groups')){const gc=await cols('community_groups');if(gc.has('admission')){
  if(tables.has('group_members')){const c=await cols('group_members'),date=c.has('created_at')?'m.created_at':c.has('joined_at')?'m.joined_at':null;if(date&&c.has('status')){parts.push(`SELECT 'group',g.id,g.name,${date} FROM group_members m JOIN community_groups g ON g.id=m.group_id WHERE m.user_id=? AND m.status='accepted' AND g.admission='open'`);args.push(target.id);}}
  if(tables.has('group_topics')){const c=await cols('group_topics');if(c.has('user_id')&&c.has('created_at')){parts.push("SELECT 'topic',g.id,t.title,t.created_at FROM group_topics t JOIN community_groups g ON g.id=t.group_id WHERE t.user_id=? AND g.admission='open'");args.push(target.id);}}
  if(tables.has('group_replies')&&tables.has('group_topics')){const c=await cols('group_replies');if(c.has('user_id')&&c.has('created_at')){parts.push("SELECT 'reply',g.id,t.title,r.created_at FROM group_replies r JOIN group_topics t ON t.id=r.topic_id JOIN community_groups g ON g.id=t.group_id WHERE r.user_id=? AND g.admission='open'");args.push(target.id);}}
 }}
 if(tables.has('design_comments')&&tables.has('community_designs')){parts.push("SELECT 'design_comment',d.id,d.title,c.created_at FROM design_comments c JOIN community_designs d ON d.id=c.design_id WHERE c.user_id=?"+(tables.has('withdrawn_designs')?' AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)':''));args.push(target.id);}
 if(tables.has('user_game_history')){parts.push("SELECT 'game',game_id,game_type,joined_at FROM user_game_history WHERE LOWER(username)=LOWER(?)");args.push(target.username);}
 if(!parts.length)return {activity:[],total:0,activity_error:null};
 const union='SELECT NULL AS kind,NULL AS ref,NULL AS label,NULL AS at WHERE 0 UNION ALL '+parts.join(' UNION ALL '),total=Number((await db.prepare('SELECT COUNT(*) AS n FROM ('+union+')').bind(...args).first()).n);
 const activity=(await db.prepare('SELECT * FROM ('+union+') ORDER BY at DESC,kind,ref DESC LIMIT ? OFFSET ?').bind(...args,size,(page-1)*size).all()).results;
 return {activity,total,activity_error:null};
}
