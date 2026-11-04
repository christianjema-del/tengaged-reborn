import {reconcilePrevious161} from '../_shared/casting-service.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,ok,fail,userByName} from '../_shared/community-plus.js';
async function handle141_onRequest({request,env}){try{
 if(request.method!=='GET')return fail('Método no permitido.',405);
 await reconcilePrevious161(env.DB);const {db,me,url}=await context(request,env.DB),target=await userByName(db,url.searchParams.get('username')||me?.username);if(!target)return fail('Usuario no encontrado.',404);
 const self=target.id===me?.id,page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get('page'))||1)));
 const owned_count=Number((await db.prepare("SELECT COUNT(*) AS n FROM user_inventory i JOIN community_designs d ON i.item_code='userdesign-'||d.id WHERE i.user_id=?").bind(target.id).first()).n);
 const owned=(await db.prepare(`SELECT d.id,d.title,d.author,d.layer_type,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,i.is_equipped,i.purchased_at FROM user_inventory i JOIN community_designs d ON i.item_code='userdesign-'||d.id WHERE i.user_id=? ORDER BY i.purchased_at DESC,d.id DESC LIMIT 20 OFFSET ?`).bind(target.id,(page-1)*20).all()).results;
 let gifts=[],gift_count=0;
 if(await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='player_shop_gifts'").first()){
 const cols=(await db.prepare('PRAGMA table_info(player_shop_gifts)').all()).results;
 const message=cols.some(c=>c.name==='message')?'g.message':"''";
 gift_count=Number((await db.prepare('SELECT COUNT(*) AS n FROM player_shop_gifts WHERE recipient_id=?').bind(target.id).first()).n);
 gifts=(await db.prepare(`SELECT d.id,d.title,d.layer_type,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,u.username AS sender,g.created_at,${message} AS message FROM player_shop_gifts g JOIN community_designs d ON d.id=g.design_id JOIN users u ON u.id=g.buyer_id WHERE g.recipient_id=? ORDER BY g.id DESC LIMIT 20 OFFSET ?`).bind(target.id,(page-1)*20).all()).results;
 }
 const groups=(await db.prepare(`SELECT g.id,g.name,g.owner_id FROM group_members m JOIN community_groups g ON g.id=m.group_id WHERE m.user_id=? AND m.status='accepted' AND (g.admission='open' OR ?=1) ORDER BY g.id DESC LIMIT 30`).bind(target.id,self?1:0).all()).results;
 const candidates=(await db.prepare("SELECT id,title,author,body,created_at FROM blog_posts WHERE instr(lower(body),lower(?))>0 ORDER BY id DESC LIMIT 100").bind('@'+target.username).all()).results;
 const mentions=candidates.filter(p=>[...p.body.matchAll(/@([A-Za-z0-9_.-]{1,32})/g)].some(m=>m[1].replace(/[.-]+$/,'').toLowerCase()===target.username.toLowerCase())).slice(0,10).map(({body,...p})=>p);
 const colors=self?(await db.prepare("SELECT s.name,s.theme_code,i.purchased_at,i.is_equipped FROM user_inventory i JOIN shop_items s ON s.code=i.item_code WHERE i.user_id=? AND s.category='Tarjetas de color' ORDER BY i.purchased_at,s.min_karma").bind(target.id).all()).results:[];
 return ok({username:target.username,self,owned,owned_count,gifts,gift_count,page,groups,mentions,colors});
 }catch(e){console.error('Profile extras',e);return fail('No se pudieron cargar los datos del perfil.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
