import {reconcilePrevious161} from '../_shared/casting-service.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,ok,fail,userByName} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 if(request.method!=='GET')return fail('Método no permitido.',405);
 await reconcilePrevious161(env.DB);const {db,me,url}=await context(request,env.DB),target=await userByName(db,url.searchParams.get('username')||me?.username);if(!target)return fail('Usuario no encontrado.',404);
 const self=target.id===me?.id,page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get('page'))||1)));
 let gifts=[],gift_count=0;
 if(await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='player_shop_gifts'").first()){
 const cols=(await db.prepare('PRAGMA table_info(player_shop_gifts)').all()).results;
 const message=cols.some(c=>c.name==='message')?'g.message':"''";
 gift_count=Number((await db.prepare('SELECT COUNT(*) AS n FROM player_shop_gifts WHERE recipient_id=?').bind(target.id).first()).n);
 const hasShops=cols.some(c=>c.name==='shop_id')&&!!await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='player_shops'").first();
 gifts=(await db.prepare(`SELECT d.id,d.title,d.layer_type,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,u.username AS sender,g.created_at,${message} AS message,${hasShops?'g.shop_id':'NULL'} AS shop_id,${hasShops?'sh.name':'NULL'} AS shop_name,${hasShops?'so.username':'NULL'} AS shop_owner FROM player_shop_gifts g JOIN community_designs d ON d.id=g.design_id JOIN users u ON u.id=g.buyer_id ${hasShops?'LEFT JOIN player_shops sh ON sh.id=g.shop_id LEFT JOIN users so ON so.id=sh.owner_id':''} WHERE g.recipient_id=? ORDER BY g.id DESC LIMIT 20 OFFSET ?`).bind(target.id,(page-1)*20).all()).results;
 }
 // V299: la página de regalos muestra tiendas abiertas para enviar un regalo («Envíame un regalo»).
 let shops=[];
 if(url.searchParams.get('view')==='gifts'&&await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='player_shops'").first()){
 const look=!!await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='player_shop_appearance'").first();
 shops=(await db.prepare(`SELECT sh.id,sh.name,o.username AS owner,${look?'CASE WHEN EXISTS(SELECT 1 FROM player_shop_appearance a WHERE a.shop_id=sh.id) THEN 1 ELSE 0 END':'0'} AS has_image FROM player_shops sh JOIN users o ON o.id=sh.owner_id WHERE sh.active=1 AND o.is_banned=0 ORDER BY random() LIMIT 8`).all()).results;
 }
 const groups=(await db.prepare(`SELECT g.id,g.name,g.owner_id FROM group_members m JOIN community_groups g ON g.id=m.group_id WHERE m.user_id=? AND m.status='accepted' AND (g.admission='open' OR ?=1) ORDER BY g.id DESC LIMIT 30`).bind(target.id,self?1:0).all()).results;
 // La mención puede estar en el título, en el texto o en un comentario visible del blog.
 const needle='@'+target.username,posts=(await db.prepare("SELECT p.id,p.title,p.author,p.title||' '||p.body AS body,p.created_at FROM blog_posts p JOIN users u ON u.id=p.user_id WHERE u.is_banned=0 AND (instr(lower(p.body),lower(?))>0 OR instr(lower(p.title),lower(?))>0) ORDER BY p.id DESC LIMIT 100").bind(needle,needle).all()).results;
 const replies=(await db.prepare("SELECT p.id,p.title,u.username AS author,c.body,c.created_at FROM blog_comments c JOIN blog_posts p ON p.id=c.post_id JOIN users u ON u.id=c.user_id WHERE c.hidden162=0 AND u.is_banned=0 AND instr(lower(c.body),lower(?))>0 ORDER BY c.id DESC LIMIT 100").bind(needle).all()).results;
 const named=row=>[...row.body.matchAll(/@([\p{L}\p{N}_.-]{1,32})/gu)].some(m=>m[1].replace(/[.-]+$/,'').toLowerCase()===target.username.toLowerCase());
 const seen=new Set(),mentions=[...posts,...replies].filter(named).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).filter(p=>!seen.has(p.id)&&seen.add(p.id)).slice(0,10).map(({body,...p})=>p);
 const colors=self?(await db.prepare("SELECT s.name,s.theme_code,i.purchased_at,i.is_equipped FROM user_inventory i JOIN shop_items s ON s.code=i.item_code WHERE i.user_id=? AND s.category='Tarjetas de color' ORDER BY i.purchased_at,s.min_karma").bind(target.id).all()).results:[];
 return ok({username:target.username,self,gifts,gift_count,page,shops,groups,mentions,colors});
 }catch(e){console.error('Profile extras',e);return fail('No se pudieron cargar los datos del perfil.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
