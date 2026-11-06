import {mafiaSeat231} from '../_shared/mafia-seat231.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {sameOrigin} from '../_shared/social.js';
import {ensureMafias231,reconcileMafia231,canCreateMafia231,admissionVotes231,presidentVotes231,pointExpr231,validUser231} from '../_shared/mafias231.js';
async function handle({request,env}){try{
 const db=env.DB;if(!db)return jsonError('Base de datos no disponible.',503);await ensureProfileSchema(db);await ensureCommunitySchema(db);await ensureMafias231(db);
 const me=await getSessionUser(request,db),url=new URL(request.url),id=Number(url.searchParams.get('id'))||0;
 const canCreate=await canCreateMafia231(db,me);let notice='';
 if(request.method==='POST'){
 if(!me)return jsonError('Inicia sesión.',401);if(me.is_system||me.is_test_bot)return jsonError('Esta cuenta no puede participar.',403);if(!sameOrigin(request))return jsonError('Origen no permitido.',403);
 const b=await request.json(),action=String(b.action||''),mid=Number(b.mafia_id)||id;
 const own=await db.prepare('SELECT * FROM mafia_members WHERE user_id=?').bind(me.id).first();
 const mafia=mid?await db.prepare('SELECT * FROM mafias WHERE id=?').bind(mid).first():null;
 if(action==='start_seat'||action==='guess_seat'){const result=await mafiaSeat231(db,me,b);notice=action==='guess_seat'?(result.result==='robada'?'¡Has robado la estrella para tu mafia!':'No has acertado. Podrás volver a intentarlo dentro de una hora.'):'Juego de mafias iniciado.';
 }else if(action==='create'){
 if(own)return jsonError('Ya perteneces a una mafia o eres aspirante.',409);if(!canCreate)return jsonError('Necesitas el nivel Estrella de TV para crear una mafia.',403);
 const name=String(b.name||'').trim(),description=String(b.description||'').trim();if(name.length<3||name.length>32||! /^[\p{L}\p{N} #_+.-]+$/u.test(name)||description.length>8000)return jsonError('Nombre de 3 a 32 caracteres y descripción de hasta 8000.',400);
 await db.prepare('INSERT INTO mafias(name,description,founder_id) VALUES(?,?,?)').bind(name,description,me.id).run();
 }else if(action==='join'){
 if(own)return jsonError('Solo puedes pertenecer o aspirar a una mafia.',409);if(!mafia)return jsonError('Mafia no encontrada.',404);
 await db.prepare("INSERT INTO mafia_members(user_id,mafia_id,role) VALUES(?,?,'aspirant')").bind(me.id,mid).run();
 }else if(action==='leave'){
 if(!own)return jsonError('No perteneces a ninguna mafia.',400);
 await db.batch([db.prepare('DELETE FROM mafia_votes231 WHERE mafia_id=? AND (voter_id=? OR target_id=?)').bind(own.mafia_id,me.id,me.id),db.prepare('DELETE FROM mafia_raffle231 WHERE mafia_id=? AND user_id=?').bind(own.mafia_id,me.id),db.prepare('DELETE FROM mafia_members WHERE user_id=?').bind(me.id)]);
 await reconcileMafia231(db,own.mafia_id);
 await db.batch([db.prepare("DELETE FROM mafias WHERE id=? AND NOT EXISTS(SELECT 1 FROM mafia_members WHERE mafia_id=? AND role<>'aspirant')").bind(own.mafia_id,own.mafia_id),db.prepare('DELETE FROM mafia_members WHERE mafia_id=? AND NOT EXISTS(SELECT 1 FROM mafias WHERE id=?)').bind(own.mafia_id,own.mafia_id)]);
 }else{
 if(!mafia)return jsonError('Mafia no encontrada.',404);
 if(action==='vote'){
 if(!own||own.mafia_id!==mid||own.role==='aspirant')return jsonError('Solo los miembros pueden dar estrellas.',403);
 const target=Number(b.target_id),present=await db.prepare('SELECT 1 FROM mafia_members m JOIN users u ON u.id=m.user_id WHERE m.mafia_id=? AND m.user_id=? AND '+validUser231).bind(mid,target).first();if(!present)return jsonError('Usuario no disponible en esta mafia.',404);
 if(b.support===false)await db.prepare('DELETE FROM mafia_votes231 WHERE mafia_id=? AND voter_id=? AND target_id=?').bind(mid,me.id,target).run();
 else await db.prepare("INSERT OR IGNORE INTO mafia_votes231(mafia_id,voter_id,target_id) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM mafia_members WHERE user_id=? AND mafia_id=? AND role<>'aspirant')").bind(mid,me.id,target,me.id,mid).run();
 await reconcileMafia231(db,mid);
 }else if(action==='comment'){
 const text=String(b.body||'').trim(),privateRoom=b.private===true;if(!text||text.length>2000)return jsonError('Escribe un comentario de 1 a 2000 caracteres.',400);
 if(privateRoom&&(!own||own.mafia_id!==mid||own.role==='aspirant'))return jsonError('El chat privado es solo para miembros.',403);
 await db.prepare('INSERT INTO mafia_comments231(mafia_id,user_id,body,private) SELECT ?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM mafia_members WHERE user_id=? AND mafia_id=? AND role<>\'aspirant\')').bind(mid,me.id,text,Number(privateRoom),Number(privateRoom),me.id,mid).run();
 }else if(action==='edit'){
 const description=String(b.description||'').trim(),motto=String(b.motto||'').trim(),emblem=String(b.emblem??mafia.emblem231);
 if(description.length>8000||motto.length>160||emblem.length>300000||(emblem&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(emblem)))return jsonError('Descripción, lema o imagen no válidos. Imagen PNG, JPEG o WebP de hasta 200 KB.',400);
 const result=await db.prepare("UPDATE mafias SET description=?,motto231=?,emblem231=? WHERE id=? AND EXISTS(SELECT 1 FROM mafia_members WHERE user_id=? AND mafia_id=? AND role='leader')").bind(description,motto,emblem,mid,me.id,mid).run();if(!result.meta.changes)return jsonError('Solo el presidente puede editar la mafia.',403);
 }else if(action==='raffle'){
 if(!own||own.mafia_id!==mid||own.role==='aspirant')return jsonError('Solo los miembros pueden inscribirse.',403);
 const week=Math.floor((Date.now()+3*86400000)/(7*86400000));await db.prepare("INSERT OR IGNORE INTO mafia_raffle231(week,mafia_id,user_id) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM mafia_members WHERE user_id=? AND mafia_id=? AND role<>'aspirant')").bind(week,mid,me.id,me.id,mid).run();
 }else return jsonError('Acción no válida.',400);
 }
 }else if(request.method!=='GET')return jsonError('Método no permitido.',405);
 const username=url.searchParams.get('username'),target=username?await db.prepare('SELECT id FROM users WHERE LOWER(username)=LOWER(?)').bind(username).first():me;
 const membership=target?await db.prepare('SELECT m.id,m.name,m.description,m.emblem231,mm.role,(SELECT COUNT(*) FROM mafia_votes231 v WHERE v.mafia_id=m.id AND v.target_id=mm.user_id AND EXISTS(SELECT 1 FROM mafia_members q WHERE q.user_id=v.voter_id AND q.mafia_id=m.id)) AS votes FROM mafia_members mm JOIN mafias m ON m.id=mm.mafia_id WHERE mm.user_id=?').bind(target.id).first():null;
 const own=me?await db.prepare('SELECT * FROM mafia_members WHERE user_id=?').bind(me.id).first():null;
 const all=(await db.prepare(`SELECT m.id,m.name,m.description,m.motto231,m.emblem231,m.created_at,u.username AS founder,COUNT(p.id) AS members,COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN ${pointExpr231.replaceAll('u.id','p.id')} ELSE 0 END),0) AS points FROM mafias m JOIN users u ON u.id=m.founder_id LEFT JOIN mafia_members mm ON mm.mafia_id=m.id AND mm.role<>'aspirant' LEFT JOIN users p ON p.id=mm.user_id AND COALESCE(p.is_banned,0)=0 AND COALESCE(p.is_system,0)=0 AND COALESCE(p.is_test_bot,0)=0 GROUP BY m.id ORDER BY points DESC,members DESC,m.id`).all()).results;
 const page=Math.max(1,Math.floor(Number(url.searchParams.get('page'))||1)),recent=[...all].sort((a,b)=>b.id-a.id).slice(0,20);
 let detail=null;
 if(id){const m=all.find(m=>m.id===id);if(!m)return jsonError('Mafia no encontrada.',404);const canReadPrivate=!!own&&own.mafia_id===id&&own.role!=='aspirant';
 const people=(await db.prepare(`SELECT u.id,u.username,mm.role,COUNT(v.voter_id) AS votes,EXISTS(SELECT 1 FROM mafia_votes231 q WHERE q.mafia_id=mm.mafia_id AND q.target_id=u.id AND q.voter_id=?) AS supported FROM mafia_members mm JOIN users u ON u.id=mm.user_id LEFT JOIN mafia_votes231 v ON v.mafia_id=mm.mafia_id AND v.target_id=u.id AND EXISTS(SELECT 1 FROM mafia_members a JOIN users vu ON vu.id=a.user_id WHERE a.user_id=v.voter_id AND a.mafia_id=v.mafia_id AND a.role<>'aspirant' AND COALESCE(vu.is_banned,0)=0) WHERE mm.mafia_id=? AND ${validUser231} GROUP BY u.id ORDER BY votes DESC,mm.joined_at,u.id`).bind(me?.id||-1,id).all()).results;
 const publicComments=(await db.prepare(`SELECT c.id,c.body,c.created_at,u.username FROM mafia_comments231 c JOIN users u ON u.id=c.user_id WHERE c.mafia_id=? AND c.private=0 AND ${validUser231} ORDER BY c.id DESC LIMIT 50`).bind(id).all()).results;
 const privateComments=canReadPrivate?(await db.prepare(`SELECT c.id,c.body,c.created_at,u.username FROM mafia_comments231 c JOIN users u ON u.id=c.user_id WHERE c.mafia_id=? AND c.private=1 AND ${validUser231} ORDER BY c.id DESC LIMIT 50`).bind(id).all()).results:[];
 const blogTables=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('blog_votes','blog_comments')").all()).results.map(t=>t.name));
 const weights=blogTables.has('blog_votes')&&(await db.prepare('PRAGMA table_info(blog_votes)').all()).results.some(c=>c.name==='weight');
 const score="COALESCE(b.initial_points159,0)"+(blogTables.has('blog_votes')?"+COALESCE((SELECT SUM(v.value"+(weights?"*v.weight":"")+") FROM blog_votes v WHERE v.post_id=b.id),0)":"");
 const hiddenComments=blogTables.has('blog_comments')&&(await db.prepare('PRAGMA table_info(blog_comments)').all()).results.some(c=>c.name==='hidden162');
 const count=blogTables.has('blog_comments')?"(SELECT COUNT(*) FROM blog_comments c WHERE c.post_id=b.id"+(hiddenComments?" AND COALESCE(c.hidden162,0)=0":"")+")":"0";
 const blogs=(await db.prepare(`SELECT b.id,b.title,b.author,b.created_at,SUBSTR(b.body,1,350) AS excerpt,${score} AS score,${count} AS comments_count FROM blog_posts b JOIN mafia_members mm ON mm.user_id=b.user_id JOIN users u ON u.id=b.user_id WHERE mm.mafia_id=? AND mm.role<>'aspirant' AND ${validUser231} ORDER BY b.created_at DESC,b.id DESC LIMIT 5`).bind(id).all()).results;

 const week=Math.floor((Date.now()+3*86400000)/(7*86400000));
 const winners=(await db.prepare('SELECT w.week,u.username FROM mafia_raffle_winners231 w JOIN users u ON u.id=w.user_id WHERE w.mafia_id=? ORDER BY w.week DESC LIMIT 10').bind(id).all()).results;
 const joinedRaffle=!!(me&&await db.prepare('SELECT 1 FROM mafia_raffle231 WHERE week=? AND mafia_id=? AND user_id=?').bind(week,id,me.id).first());
 detail={...m,people,publicComments,privateComments,canReadPrivate,blogs,requiredVotes:admissionVotes231(people.filter(p=>p.role!=='aspirant').length),presidentVotes:presidentVotes231(people.filter(p=>p.role!=='aspirant').length),isPresident:own?.mafia_id===id&&own.role==='leader',canVote:canReadPrivate,raffle:{joined:joinedRaffle,endsAt:(week+1)*7*86400000-3*86400000,winners,starsAvailable:false}};
 }
 const seat=await mafiaSeat231(db,me);
 return Response.json({ok:true,notice,seat,mafias:all.slice((page-1)*15,page*15),total:all.length,page,pageSize:15,recent,membership,loggedIn:!!me,myMafiaId:own?.mafia_id||null,myRole:own?.role||null,canCreate,detail},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Mafias',e);return jsonError(/UNIQUE|MAFIA_ALREADY_MEMBER/.test(String(e))?'Ya perteneces a una mafia o el nombre está en uso.':'No se pudo completar la operación. Inténtalo de nuevo.',409);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
