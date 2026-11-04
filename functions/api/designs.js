import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureDesignMarket,settleDesignAuctions} from '../_shared/design-market117.js';
import {PUBLICATION_POINTS_SQL159} from '../_shared/publication-points159.js';
import {blogVotePower} from '../_shared/blog-vote-power.js';
import {ensureAdminDesigns} from '../_shared/regaged-seed.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {DESIGN_THEMES,ensureCommunitySchema} from '../_shared/community.js';
import {decodeDesignImage} from '../_shared/design-images.js';
async function handle141_onRequest({request,env}){
 try{const db=env.DB;await ensureProfileSchema(db);await ensureCommunitySchema(db);const nextAuction=await ensureDesignMarket(db);await settleDesignAuctions(db);const user=await getSessionUser(request,db);
 if(request.method==='GET'){
 const installed=await ensureAdminDesigns(db,user);
 const url=new URL(request.url),id=Number(url.searchParams.get('id'))||0,owner=url.searchParams.get('owner')||'',gallery=url.searchParams.has('page'),page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get('page'))||1)));
 const rows=await db.prepare(`SELECT d.id,d.author,d.user_id,d.title,d.description,d.theme_code,d.layer_type,d.price,d.created_at,d.initial_points159 AS initial_points,EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id) AS withdrawn,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,
 CASE WHEN v.item_code IS NULL THEN 0 ELSE 1 END AS owned,COALESCE(v.is_equipped,0) AS is_equipped,CASE WHEN d.user_id=? THEN 1 ELSE 0 END AS is_owner,
 d.initial_points159+COALESCE((SELECT SUM(l.value*l.weight) FROM design_likes l WHERE l.design_id=d.id),0) AS likes,COALESCE((SELECT value FROM design_likes l WHERE l.design_id=d.id AND l.user_id=?),0) AS my_vote,CASE WHEN d.created_at>=datetime('now','-3 days') THEN 1 ELSE 0 END AS voting_open,(SELECT si.theme_code FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=d.user_id AND inv.is_equipped=1 AND si.category='Tarjetas de color' LIMIT 1) AS color_code,
 EXISTS(SELECT 1 FROM design_likes l WHERE l.design_id=d.id AND l.user_id=?) AS liked,
 (SELECT COUNT(*) FROM design_comments c WHERE c.design_id=d.id) AS comments_count
 FROM community_designs d LEFT JOIN user_inventory v ON v.user_id=? AND v.item_code=('userdesign-' || d.id)
 WHERE (NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id) OR (d.user_id=? AND (? > 0 OR ?=1))) AND (?=0 OR d.id=?) AND (?='' OR LOWER(d.author)=LOWER(?)) ORDER BY d.id DESC LIMIT ? OFFSET ?`).bind(user?.id||-1,user?.id||-1,user?.id||-1,user?.id||-1,user?.id||-1,id,url.searchParams.get('mine')==='1'?1:0,id,id,owner,owner,gallery?15:200,gallery?(page-1)*15:0).all();
 const total=gallery?Number((await db.prepare(`SELECT COUNT(*) n FROM community_designs d WHERE (NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id) OR (d.user_id=? AND (? > 0 OR ?=1))) AND (?=0 OR d.id=?) AND (?='' OR LOWER(d.author)=LOWER(?))`).bind(user?.id||-1,id,url.searchParams.get('mine')==='1'?1:0,id,id,owner,owner).first()).n):rows.results.length;
 const topDesigns=gallery?(await db.prepare(`SELECT d.id,d.author,d.user_id,d.title,d.description,d.theme_code,d.layer_type,d.price,d.created_at,d.initial_points159 AS initial_points,0 AS withdrawn,1 AS voting_open,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,CASE WHEN d.user_id=? THEN 1 ELSE 0 END AS is_owner,d.initial_points159+COALESCE((SELECT SUM(value*weight) FROM design_likes WHERE design_id=d.id),0) AS likes,(SELECT COUNT(*) FROM design_comments WHERE design_id=d.id) AS comments_count,(SELECT si.theme_code FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=d.user_id AND inv.is_equipped=1 AND si.category='Tarjetas de color' LIMIT 1) AS color_code FROM community_designs d WHERE d.created_at>=datetime('now','-3 days') AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id) ORDER BY likes DESC,d.id DESC LIMIT 15`).bind(user?.id||-1).all()).results:undefined;
 const activeCount=user?Number((await db.prepare("SELECT COUNT(*) n FROM community_designs d WHERE d.user_id=? AND d.created_at>=datetime('now','-3 days') AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)").bind(user.id).first()).n):0;
 const comments=id&&rows.results.length?(await db.prepare('SELECT id,author,body,created_at FROM design_comments WHERE design_id=? ORDER BY id DESC LIMIT 100').bind(id).all()).results:[];
 return Response.json({ok:true,designs:rows.results,comments,total,page,page_size:gallery?15:200,top_designs:topDesigns,vote_power:user?await blogVotePower(db,user.id):0,signed_in:!!user,next_auction_at:nextAuction,active_limit:4,active_count:activeCount,regaged_installed:installed},{headers:{'Cache-Control':'no-store'}});
 }
 if(request.method!=='POST')return jsonError('Método no permitido.',405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 if(!user)return jsonError('Inicia sesión para participar en los diseños.',401);
 const body=await request.json().catch(()=>({}));
 let editing=null;
 if(['edit','delete','restore'].includes(body.action)){
 const id=Number(body.design_id);if(!Number.isSafeInteger(id)||id<1)return jsonError('Diseño no válido.',400);
 editing=await db.prepare('SELECT * FROM community_designs WHERE id=?').bind(id).first();
 if(!editing)return jsonError('No existe ese diseño.',404);
 if(editing.user_id!==user.id)return jsonError('Solo el autor puede gestionar este diseño.',403);
 if(await db.prepare("SELECT id FROM design_auctions WHERE design_id=? AND status='open'").bind(id).first())return jsonError('Espera a que termine la subasta antes de modificar o retirar el diseño.',409);
 if(body.action==='delete'){await db.prepare('INSERT OR IGNORE INTO withdrawn_designs(design_id) VALUES(?)').bind(id).run();return Response.json({ok:true,message:'Diseño retirado. Puedes restaurarlo desde Mis diseños. Las compras anteriores se conservan.'});}
 if(body.action==='restore'){const restored=await db.prepare(`DELETE FROM withdrawn_designs WHERE design_id=? AND (EXISTS(SELECT 1 FROM community_designs WHERE id=? AND created_at<datetime('now','-3 days')) OR (SELECT COUNT(*) FROM community_designs d WHERE d.user_id=? AND d.created_at>=datetime('now','-3 days') AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id))<4)`).bind(id,id,user.id).run();if(!restored.meta.changes&&await db.prepare('SELECT design_id FROM withdrawn_designs WHERE design_id=?').bind(id).first())return jsonError('Ya tienes cuatro diseños activos. Retira uno antes de restaurar este.',409);return Response.json({ok:true,message:'Diseño restaurado.'});}
 }
 if(body.action&&!['edit','seed_demo','like','vote','comment','create'].includes(body.action))return jsonError('Acción no válida.',400);
 if(body.action==='seed_demo'){
  if(user.username.toLowerCase()!=='admin1'||!user.is_admin)return jsonError('Solo admin1 puede instalar estos diseños.',403);
  const created=await ensureAdminDesigns(db,user);
  return Response.json({ok:true,created,message:created?`${created} diseños nuevos incorporados.`:'Los 10 diseños ya están disponibles.'});
 }

 if(body.action==='like'||body.action==='vote'||body.action==='comment'){
 const id=Number(body.design_id);if(!Number.isSafeInteger(id)||id<1)return jsonError('Diseño no válido.',400);
 if(!await db.prepare('SELECT id FROM community_designs WHERE id=? AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=community_designs.id)').bind(id).first())return jsonError('No existe ese diseño.',404);
 if(body.action==='like'||body.action==='vote'){
 const target=await db.prepare("SELECT user_id,created_at>=datetime('now','-3 days') AS open FROM community_designs WHERE id=?").bind(id).first();if(target.user_id===user.id)return jsonError('No puedes votar tu propio diseño.',403);if(!target.open)return jsonError('La votación de este diseño ha terminado.',409);
 const liked=await db.prepare('SELECT value FROM design_likes WHERE design_id=? AND user_id=?').bind(id,user.id).first();const value=body.action==='like'?(liked?0:1):Number(body.value);if(![-1,0,1].includes(value))return jsonError('Voto no válido.',400);
 if(!value)await db.prepare('DELETE FROM design_likes WHERE design_id=? AND user_id=?').bind(id,user.id).run();else await db.prepare('INSERT INTO design_likes(design_id,user_id,value,weight) VALUES(?,?,?,?) ON CONFLICT(design_id,user_id) DO UPDATE SET value=excluded.value,weight=excluded.weight').bind(id,user.id,value,await blogVotePower(db,user.id)).run();return Response.json({ok:true,message:!value?'Valoración retirada.':'Valoración guardada.'});}
 const content=String(body.body||'').trim();if(!content||content.length>500)return jsonError('Escribe un comentario de 1 a 500 caracteres.',400);
 await db.prepare('INSERT INTO design_comments(design_id,user_id,author,body) VALUES(?,?,?,?)').bind(id,user.id,user.username,content).run();return Response.json({ok:true,message:'Comentario publicado.'},{status:201});
 }
 const title=String(body.title||'').trim(),description=String(body.description||'').trim(),theme=String(body.theme_code||''),price=Number(body.price||0);
 if(title.length<3||title.length>60||description.length>240||!DESIGN_THEMES.has(theme)||!Number.isSafeInteger(price)||price<0||price>100000)return jsonError('Revisa el título, la descripción y el precio (0–100.000 T$).',400);
 const layer=String(body.layer_type||'profile');if(!['profile','skin','shirt','eyes','mouth','hair','glasses','background'].includes(layer))return jsonError('Categoría no válida.',400);
 const image=body.image_data||(editing?.image_data)||null;if(layer!=='profile'&&!image)return jsonError('Sube una imagen para esta pieza del avatar.',400);try{decodeDesignImage(image);}catch(e){return jsonError(e.message,400);}
 if(editing){
 if(layer!==editing.layer_type && await db.prepare("SELECT user_id FROM user_inventory WHERE item_code=? AND user_id<>? LIMIT 1").bind('userdesign-'+editing.id,user.id).first())return jsonError('No puedes cambiar la categoría de una pieza que otros usuarios ya tienen.',409);
 await db.prepare('UPDATE community_designs SET title=?,description=?,theme_code=?,price=?,image_data=?,layer_type=? WHERE id=? AND user_id=?').bind(title,description,theme,price,image,layer,editing.id,user.id).run();
 return Response.json({ok:true,id:editing.id,message:'Diseño actualizado.'});
 }
 const result=await db.prepare(`INSERT INTO community_designs(user_id,author,title,description,theme_code,price,image_data,layer_type,initial_points159) SELECT ?,?,?,?,?,?,?,?,${PUBLICATION_POINTS_SQL159} WHERE (SELECT COUNT(*) FROM community_designs d WHERE d.user_id=? AND d.created_at>=datetime('now','-3 days') AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=d.id))<4`).bind(user.id,user.username,title,description,theme,price,image,layer,user.id,user.id).run();
 if(!result.meta.changes)return jsonError('Puedes tener un máximo de cuatro diseños activos. Espera a que termine la votación o retira uno.',409);
 return Response.json({ok:true,id:result.meta.last_row_id,message:'Diseño publicado para votación. Subirlo no lo añade al armario; debes comprarlo en tienda o ganar su subasta.'},{status:201});
 }catch(e){console.error('Designs',e);return jsonError('No se pudo completar la acción de diseños.',500);}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
