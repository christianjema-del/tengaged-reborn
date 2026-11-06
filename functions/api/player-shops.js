import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureGiftNotifications} from '../_shared/system-account.js';
import {ensureAdminDesigns} from '../_shared/regaged-seed.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureCommunitySchema} from '../_shared/community.js';
import {decodeDesignImage} from '../_shared/design-images.js';
const PERIOD=48*3600;
const SHOP_PLACES=5;
const CYCLE_SOLD=`((SELECT COUNT(*) FROM player_shop_sales z WHERE z.shop_id=? AND z.created_at>=datetime(?,'unixepoch'))+(SELECT COUNT(*) FROM player_shop_gifts z WHERE z.shop_id=? AND z.created_at>=datetime(?,'unixepoch')))`;
const CYCLE_POSTED=`((SELECT COALESCE(SUM(st.quantity),0) FROM player_shop_stock st WHERE st.shop_id=? AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=st.design_id))+${CYCLE_SOLD})`;
async function schema(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS player_shop_appearance(shop_id INTEGER PRIMARY KEY,image_data TEXT NOT NULL)').run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shops(id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, active INTEGER NOT NULL DEFAULT 0)`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shop_stock(shop_id INTEGER NOT NULL,design_id INTEGER NOT NULL UNIQUE,quantity INTEGER NOT NULL DEFAULT 5,price INTEGER NOT NULL DEFAULT 20, PRIMARY KEY(shop_id,design_id))`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shop_cycles(id INTEGER PRIMARY KEY AUTOINCREMENT,opens_at INTEGER NOT NULL, ends_at INTEGER NOT NULL, settled INTEGER NOT NULL DEFAULT 0)`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shop_bids(cycle_id INTEGER NOT NULL,shop_id INTEGER NOT NULL,amount INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(cycle_id,shop_id))`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shop_sales(id INTEGER PRIMARY KEY AUTOINCREMENT,shop_id INTEGER NOT NULL,design_id INTEGER NOT NULL,buyer_id INTEGER NOT NULL,price INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 // A purchase is ONE SQL statement: either all five effects happen or none do.
 const saleGuard=`CREATE TRIGGER IF NOT EXISTS tengaged_shop_sale_guard
 BEFORE INSERT ON player_shop_sales BEGIN
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM player_shop_stock st JOIN player_shops sh ON sh.id=st.shop_id
   JOIN users buyer ON buyer.id=NEW.buyer_id
   WHERE st.shop_id=NEW.shop_id AND st.design_id=NEW.design_id
     AND sh.active=1 AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=NEW.design_id)
     AND st.quantity>0 AND st.price=NEW.price AND buyer.t_money>=NEW.price
     AND NOT EXISTS (SELECT 1 FROM user_inventory inv
                     WHERE inv.user_id=NEW.buyer_id AND inv.item_code='userdesign-'||NEW.design_id)
 ) THEN RAISE(ABORT,'Compra no disponible, saldo insuficiente o artículo ya adquirido') END;
 END`;

 const previousGuard=await db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='tengaged_shop_sale_guard'").first();
 if(previousGuard && (!previousGuard.sql.includes('withdrawn_designs')||previousGuard.sql.includes('sh.owner_id<>NEW.buyer_id'))){
   await db.batch([db.prepare('DROP TRIGGER IF EXISTS tengaged_shop_sale_guard'),db.prepare(saleGuard)]);
 }else await db.prepare(saleGuard).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_shop_sale_complete
 AFTER INSERT ON player_shop_sales BEGIN
 INSERT INTO user_inventory(user_id,item_code) VALUES(NEW.buyer_id,'userdesign-'||NEW.design_id);
 UPDATE users SET t_money=t_money-NEW.price WHERE id=NEW.buyer_id;
 UPDATE users SET t_money=t_money+NEW.price WHERE id=(SELECT owner_id FROM player_shops WHERE id=NEW.shop_id);
 UPDATE player_shop_stock SET quantity=quantity-1 WHERE shop_id=NEW.shop_id AND design_id=NEW.design_id;
 END`).run();
 // Gifts keep their recipient and all economic effects in one atomic statement.
 await db.prepare(`CREATE TABLE IF NOT EXISTS player_shop_gifts(
 id INTEGER PRIMARY KEY AUTOINCREMENT,shop_id INTEGER NOT NULL,design_id INTEGER NOT NULL,
 buyer_id INTEGER NOT NULL,recipient_id INTEGER NOT NULL,price INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 try{await db.prepare("ALTER TABLE player_shop_gifts ADD COLUMN message TEXT NOT NULL DEFAULT ''").run();}
 catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
 const giftGuard=`CREATE TRIGGER IF NOT EXISTS tengaged_shop_gift_guard
 BEFORE INSERT ON player_shop_gifts BEGIN
 SELECT CASE WHEN NOT EXISTS(
 SELECT 1 FROM player_shop_stock st JOIN player_shops sh ON sh.id=st.shop_id
 JOIN users buyer ON buyer.id=NEW.buyer_id JOIN users recipient ON recipient.id=NEW.recipient_id
 WHERE st.shop_id=NEW.shop_id AND st.design_id=NEW.design_id
 AND sh.active=1 AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=NEW.design_id)
 AND NEW.buyer_id<>NEW.recipient_id AND buyer.is_banned=0 AND recipient.is_banned=0
 AND st.quantity>0 AND st.price=NEW.price AND buyer.t_money>=NEW.price
 AND NOT EXISTS(SELECT 1 FROM user_inventory inv WHERE inv.user_id=NEW.recipient_id
 AND inv.item_code='userdesign-'||NEW.design_id)
 ) THEN RAISE(ABORT,'Regalo no disponible') END;
 END`;

 const previousGiftGuard=await db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='tengaged_shop_gift_guard'").first();
 if(previousGiftGuard && (!previousGiftGuard.sql.includes('withdrawn_designs')||previousGiftGuard.sql.includes('sh.owner_id<>NEW.buyer_id')||previousGiftGuard.sql.includes('sh.owner_id<>NEW.recipient_id'))){
   await db.batch([db.prepare('DROP TRIGGER IF EXISTS tengaged_shop_gift_guard'),db.prepare(giftGuard)]);
 }else await db.prepare(giftGuard).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_shop_gift_complete
 AFTER INSERT ON player_shop_gifts BEGIN
 INSERT INTO user_inventory(user_id,item_code) VALUES(NEW.recipient_id,'userdesign-'||NEW.design_id);
 UPDATE users SET t_money=t_money-NEW.price WHERE id=NEW.buyer_id;
 UPDATE users SET t_money=t_money+NEW.price WHERE id=(SELECT owner_id FROM player_shops WHERE id=NEW.shop_id);
 UPDATE player_shop_stock SET quantity=quantity-1 WHERE shop_id=NEW.shop_id AND design_id=NEW.design_id;
 END`).run();
 // A bid is only a promise: it is charged when the shop wins a place, never while bidding.
 const oldBidTriggers=(await db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND (name IN ('tengaged_shop_bid_insert_charge','tengaged_shop_bid_update_charge') OR (name='tengaged_shop_bid_update_guard' AND sql LIKE '%NEW.amount-OLD.amount%'))").all()).results||[];
 if(oldBidTriggers.length)await db.batch(oldBidTriggers.map(t=>db.prepare('DROP TRIGGER IF EXISTS '+t.name)));
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_shop_bid_insert_guard
 BEFORE INSERT ON player_shop_bids BEGIN
 SELECT CASE WHEN NEW.amount<1 OR NOT EXISTS (
 SELECT 1 FROM player_shops sh JOIN users u ON u.id=sh.owner_id
 JOIN player_shop_cycles c ON c.id=NEW.cycle_id
 WHERE sh.id=NEW.shop_id AND u.t_money>=NEW.amount AND c.settled=0
 AND c.ends_at>CAST(strftime('%s','now') AS INTEGER)
 ) THEN RAISE(ABORT,'Puja no válida o saldo insuficiente') END;
 END`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_shop_bid_update_guard
 BEFORE UPDATE OF amount ON player_shop_bids BEGIN
 SELECT CASE WHEN NEW.amount<=OLD.amount OR NEW.shop_id<>OLD.shop_id
 OR NEW.cycle_id<>OLD.cycle_id OR NOT EXISTS(
 SELECT 1 FROM player_shops sh JOIN users u ON u.id=sh.owner_id
 JOIN player_shop_cycles c ON c.id=NEW.cycle_id
 WHERE sh.id=NEW.shop_id AND u.t_money>=NEW.amount AND c.settled=0
 AND c.ends_at>CAST(strftime('%s','now') AS INTEGER)
 ) THEN RAISE(ABORT,'Nueva puja no válida o saldo insuficiente') END;
 END`).run();
}
async function settleCycle(db,c){
 // Places go to the five highest bids whose owner can still pay; only they are charged.
 // Everything runs in one batch and only while the round is unsettled, so nobody pays twice.
 const open='(SELECT settled FROM player_shop_cycles WHERE id=?)=0';
 const bids=(await db.prepare(`SELECT b.shop_id,b.amount,s.owner_id,u.t_money FROM player_shop_bids b JOIN player_shops s ON s.id=b.shop_id JOIN users u ON u.id=s.owner_id WHERE b.cycle_id=? ORDER BY b.amount DESC,b.updated_at ASC`).bind(c.id).all()).results||[];
 const winners=bids.filter(b=>Number(b.t_money)>=Number(b.amount)).slice(0,SHOP_PLACES),steps=[db.prepare(`UPDATE player_shops SET active=0 WHERE ${open}`).bind(c.id)];
 for(const w of winners)steps.push(
  db.prepare(`UPDATE player_shops SET active=1 WHERE id=? AND ${open} AND (SELECT t_money FROM users WHERE id=?)>=?`).bind(w.shop_id,c.id,w.owner_id,w.amount),
  db.prepare(`UPDATE users SET t_money=t_money-? WHERE id=? AND t_money>=? AND ${open}`).bind(w.amount,w.owner_id,w.amount,c.id));
 steps.push(db.prepare('UPDATE player_shop_cycles SET settled=1 WHERE id=?').bind(c.id));
 await db.batch(steps);
}
async function cycle(db){
 let now=Math.floor(Date.now()/1000), c=await db.prepare('SELECT * FROM player_shop_cycles ORDER BY id DESC LIMIT 1').first();
 if(!c){await db.prepare('INSERT INTO player_shop_cycles(opens_at,ends_at) VALUES(?,?)').bind(now,now+PERIOD).run(); c=await db.prepare('SELECT * FROM player_shop_cycles ORDER BY id DESC LIMIT 1').first();}
 for(let i=0;i<20&&now>=c.ends_at;i++){
  if(!c.settled)await settleCycle(db,c);
  await db.prepare('INSERT INTO player_shop_cycles(opens_at,ends_at) VALUES(?,?)').bind(c.ends_at,c.ends_at+PERIOD).run();
  c=await db.prepare('SELECT * FROM player_shop_cycles ORDER BY id DESC LIMIT 1').first();
 }
 return c;
}
async function handle141_onRequest({request,env}){
 try{
  const db=env.DB;await ensureProfileSchema(db);await ensureCommunitySchema(db);await schema(db);await ensureGiftNotifications(db);const c=await cycle(db),u=await getSessionUser(request,db);
  if(request.method==='GET'){
   const imageID=Number(new URL(request.url).searchParams.get('image'));
   if(imageID){
    if(!Number.isSafeInteger(imageID)||imageID<1)return new Response('Imagen no encontrada',{status:404});
    const row=await db.prepare('SELECT image_data FROM player_shop_appearance WHERE shop_id=?').bind(imageID).first();
    const image=decodeDesignImage(row?.image_data);if(!image)return new Response('Imagen no encontrada',{status:404});
    return new Response(image.bytes,{headers:{'Content-Type':image.type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});
   }
   // GET sólo consulta: no instala diseños ni mueve dinero.
   const shops=await db.prepare(`SELECT s.id,s.owner_id,s.name,s.description,s.created_at,s.active,u.username AS owner,EXISTS(SELECT 1 FROM player_shop_appearance a WHERE a.shop_id=s.id) AS has_logo,COALESCE(b.amount,0) AS bid,
   (SELECT COUNT(*) FROM player_shop_stock x WHERE x.shop_id=s.id AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=x.design_id)) AS products,
   ((SELECT COALESCE(SUM(z.price),0) FROM player_shop_sales z WHERE z.shop_id=s.id)+(SELECT COALESCE(SUM(z.price),0) FROM player_shop_gifts z WHERE z.shop_id=s.id)) AS lifetime_value,
   ((SELECT COALESCE(SUM(z.price),0) FROM player_shop_sales z WHERE z.shop_id=s.id AND z.created_at>=datetime(?,'unixepoch'))+(SELECT COALESCE(SUM(z.price),0) FROM player_shop_gifts z WHERE z.shop_id=s.id AND z.created_at>=datetime(?,'unixepoch'))) AS cycle_value,
   ((SELECT COUNT(*) FROM player_shop_sales z WHERE z.shop_id=s.id)+(SELECT COUNT(*) FROM player_shop_gifts z WHERE z.shop_id=s.id)) AS sales
   FROM player_shops s JOIN users u ON u.id=s.owner_id LEFT JOIN player_shop_bids b ON b.shop_id=s.id AND b.cycle_id=? ORDER BY s.active DESC,bid DESC,s.id`).bind(c.opens_at,c.opens_at,c.id).all();
   const products=await db.prepare(`SELECT st.shop_id,st.design_id,st.quantity,st.price,d.title,d.description,d.theme_code,d.layer_type,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,d.author FROM player_shop_stock st JOIN community_designs d ON d.id=st.design_id AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=d.id) ORDER BY st.shop_id,st.design_id DESC`).all();
   const mine=u?await db.prepare('SELECT id FROM player_shops WHERE owner_id=?').bind(u.id).first():null;
   const balance=u?await db.prepare('SELECT t_money FROM users WHERE id=?').bind(u.id).first():null;
   const recent_sales=mine?(await db.prepare(`SELECT z.price,z.created_at,d.title,buyer.username AS buyer,NULL AS recipient
     FROM player_shop_sales z JOIN community_designs d ON d.id=z.design_id JOIN users buyer ON buyer.id=z.buyer_id WHERE z.shop_id=?
     UNION ALL SELECT z.price,z.created_at,d.title,buyer.username AS buyer,recipient.username AS recipient
     FROM player_shop_gifts z JOIN community_designs d ON d.id=z.design_id
     JOIN users buyer ON buyer.id=z.buyer_id JOIN users recipient ON recipient.id=z.recipient_id WHERE z.shop_id=?
     ORDER BY 2 DESC LIMIT 30`).bind(mine.id,mine.id).all()).results:[];
   const stock_posted=mine?Number((await db.prepare(`SELECT ${CYCLE_POSTED} AS posted`).bind(mine.id,mine.id,c.opens_at,mine.id,c.opens_at).first()).posted):0;
   const my_sold=mine?(await db.prepare(`SELECT design_id,COUNT(*) AS sold FROM (SELECT design_id FROM player_shop_sales WHERE shop_id=? UNION ALL SELECT design_id FROM player_shop_gifts WHERE shop_id=?) GROUP BY design_id`).bind(mine.id,mine.id).all()).results:[];
   const public_gifts=(await db.prepare(`SELECT z.id,z.shop_id,z.design_id,z.created_at,z.message,d.title,
     CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,d.theme_code,
     buyer.username AS buyer,recipient.username AS recipient,s.name AS shop_name,owner.username AS shop_owner
     FROM player_shop_gifts z JOIN community_designs d ON d.id=z.design_id
     JOIN player_shops s ON s.id=z.shop_id JOIN users owner ON owner.id=s.owner_id
     JOIN users buyer ON buyer.id=z.buyer_id JOIN users recipient ON recipient.id=z.recipient_id
     WHERE buyer.is_banned=0 AND recipient.is_banned=0 AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)
     ORDER BY z.created_at DESC,z.id DESC LIMIT 10`).all()).results||[];
   const public_sales=(await db.prepare(`SELECT z.id,z.shop_id,z.design_id,z.created_at,d.title,
     CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,d.theme_code,
     buyer.username AS buyer,s.name AS shop_name,owner.username AS shop_owner
     FROM player_shop_sales z JOIN community_designs d ON d.id=z.design_id
     JOIN player_shops s ON s.id=z.shop_id JOIN users owner ON owner.id=s.owner_id JOIN users buyer ON buyer.id=z.buyer_id
     WHERE buyer.is_banned=0 AND NOT EXISTS(SELECT 1 FROM withdrawn_designs w WHERE w.design_id=d.id)
     ORDER BY z.created_at DESC,z.id DESC LIMIT 10`).all()).results||[];
   const inventory=u?(await db.prepare("SELECT item_code FROM user_inventory WHERE user_id=?").bind(u.id).all()).results.map(x=>x.item_code):[];
   return Response.json({ok:true,shops:shops.results||[],products:products.results||[],cycle:{id:c.id,ends_at:c.ends_at,opens_at:c.opens_at,slots:5},mine:mine?.id||null,balance:Number(balance?.t_money||0),recent_sales,stock_posted,my_sold,public_gifts,public_sales,inventory,signed_in:!!u},{headers:{'Cache-Control':'no-store'}});
  }
  if(request.method!=='POST')return jsonError('Método no permitido.',405);
  if(!u)return jsonError('Inicia sesión para administrar tu tienda.',401);
  const origin=request.headers.get('Origin');
  if(origin&&origin!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
  const body=await request.json().catch(()=>({})),act=String(body.action||'');
  if(act==='admin_close_cycle'){
   if(u.username.toLowerCase()!=='admin1'||!u.is_admin)return jsonError('Acción exclusiva de admin1.',403);
   const bids=await db.prepare('SELECT COUNT(*) AS total FROM player_shop_bids WHERE cycle_id=?').bind(c.id).first();
   if(!Number(bids?.total||0))return jsonError('No hay pujas todavía. Crea una tienda y realiza una puja antes de cerrar.',409);
   await db.prepare('UPDATE player_shop_cycles SET ends_at=? WHERE id=? AND settled=0').bind(Math.floor(Date.now()/1000)-1,c.id).run();
   await cycle(db);
   return Response.json({ok:true,message:'Ronda de prueba cerrada. Se asignaron los escaparates y comenzó un nuevo ciclo de 48 horas.'});
  }

  if(act==='admin_setup_first_shop'){
   if(u.username.toLowerCase()!=='admin1'||!u.is_admin)return jsonError('Solo admin1 puede preparar esta tienda de prueba.',403);
   await ensureAdminDesigns(db,u);
   let first=await db.prepare('SELECT id FROM player_shops WHERE owner_id=?').bind(u.id).first();
   if(!first){
     await db.prepare("INSERT OR IGNORE INTO player_shops(owner_id,name,description) VALUES(?,?,?)")
       .bind(u.id,'Tienda de admin1','Primera tienda de pruebas de Tengaged Reborn').run();
     first=await db.prepare('SELECT id FROM player_shops WHERE owner_id=?').bind(u.id).first();
   }
   const designs=(await db.prepare(`SELECT id FROM community_designs
     WHERE user_id=? AND title LIKE '[REGAGED]%' ORDER BY id LIMIT 3`).bind(u.id).all()).results;
   if(!designs.length)return jsonError('No se encontraron los diseños de Tengaged Reborn para preparar la tienda.',409);
   let added=0;
   for(const design of designs){
     const result=await db.prepare(`INSERT OR IGNORE INTO player_shop_stock(shop_id,design_id,quantity,price)
       VALUES(?,?,5,10)`).bind(first.id,design.id).run();
     added+=Number(result.meta?.changes||0);
   }
   return Response.json({ok:true,shop_id:first.id,added,
     message:'Tienda preparada con '+added+' productos nuevos. Para abrir las compras, puja al menos 1 T$ y cierra la ronda de prueba. No se ha modificado ningún saldo.'});
  }
  if(act==='create'){
   const name=String(body.name||'').trim(),desc=String(body.description||'').trim();
   if(name.length<3||name.length>40||desc.length>250)return jsonError('Nombre de 3 a 40 caracteres y descripción de hasta 250.',400);
   const prior=await db.prepare('SELECT id FROM player_shops WHERE owner_id=?').bind(u.id).first();if(prior)return jsonError('Ya tienes una tienda.',409);
   await db.prepare('INSERT INTO player_shops(owner_id,name,description) VALUES(?,?,?)').bind(u.id,name,desc).run();
   return Response.json({ok:true,message:'Tienda creada. Añade diseños y puja para obtener un escaparate destacado.'},{status:201});
  }
  const shop=await db.prepare('SELECT id FROM player_shops WHERE owner_id=?').bind(u.id).first();
  if(act==='purchase'||act==='gift'){
   const id=Number(body.design_id),target=Number(body.shop_id);if(!Number.isSafeInteger(id)||!Number.isSafeInteger(target))return jsonError('Producto no válido.',400);
   const item=await db.prepare('SELECT st.shop_id,st.design_id,st.price,st.quantity,s.owner_id,s.active FROM player_shop_stock st JOIN player_shops s ON s.id=st.shop_id WHERE st.shop_id=? AND st.design_id=?').bind(target,id).first();
   if(!item)return jsonError('Producto no encontrado.',404);
   if(!item.active)return jsonError('Esta tienda aún no tiene escaparate activo. Su propietario debe pujar y obtener un puesto para abrir las ventas.',409);
   if(item.quantity<1)return jsonError('Este artículo está agotado.',409);
   if(act==='gift'){
     const giftMessage=String(body.message||'').trim();if(giftMessage.length>300)return jsonError('La dedicatoria no puede superar 300 caracteres.',400);
     const name=String(body.recipient||'').trim();
     if(!name||name.length>80)return jsonError('Escribe el nombre del destinatario.',400);
     const recipient=await db.prepare('SELECT id,username,is_banned,is_system FROM users WHERE username=? COLLATE NOCASE').bind(name).first();
     if(!recipient||recipient.is_banned||recipient.is_system)return jsonError('No se encontró un destinatario disponible con ese nombre.',404);
     if(recipient.id===u.id)return jsonError('Para ti utiliza Comprar.',400);
     if(await db.prepare('SELECT 1 AS yes FROM user_inventory WHERE user_id=? AND item_code=?').bind(recipient.id,'userdesign-'+id).first())return jsonError('Esta persona ya tiene el diseño.',409);
     const funds=await db.prepare('SELECT t_money FROM users WHERE id=?').bind(u.id).first();
     if(Number(funds.t_money)<item.price)return jsonError('Saldo insuficiente para enviar este regalo.',409);
     try{
       await db.prepare(`INSERT INTO player_shop_gifts(shop_id,design_id,buyer_id,recipient_id,price,message)
       SELECT shop_id,design_id,?,?,price,? FROM player_shop_stock WHERE shop_id=? AND design_id=?`)
       .bind(u.id,recipient.id,giftMessage,target,id).run();
     }catch(error){return jsonError('No se pudo enviar el regalo. Comprueba saldo, existencias y si el destinatario ya tiene el diseño.',409);}
     return Response.json({ok:true,message:'Regalo enviado a '+recipient.username+'. El diseño está en su inventario.'});
   }
   const code='userdesign-'+id;
   if(await db.prepare('SELECT 1 AS yes FROM user_inventory WHERE user_id=? AND item_code=?').bind(u.id,code).first())return jsonError('Ya tienes este diseño.',409);
   try {
     await db.prepare(`INSERT INTO player_shop_sales(shop_id,design_id,buyer_id,price)
       SELECT st.shop_id,st.design_id,?,st.price
       FROM player_shop_stock st
       WHERE st.shop_id=? AND st.design_id=?`).bind(u.id,target,id).run();
   } catch (error) {
     return jsonError('La compra no pudo completarse: comprueba saldo, disponibilidad y si ya tienes este diseño.',409);
   }
   return Response.json({ok:true,message:'Compra realizada y diseño añadido a tu inventario.'});
  }
  if(!shop)return jsonError('Primero debes crear tu tienda.',403);
  if(act==='set_logo'){
   const image=body.image_data||null;
   if(!image){await db.prepare('DELETE FROM player_shop_appearance WHERE shop_id=?').bind(shop.id).run();return Response.json({ok:true,message:'Imagen de tienda retirada.'});}
   try{decodeDesignImage(image);}catch(error){return jsonError(error.message,400);}
   await db.prepare('INSERT INTO player_shop_appearance(shop_id,image_data) VALUES(?,?) ON CONFLICT(shop_id) DO UPDATE SET image_data=excluded.image_data').bind(shop.id,image).run();
   return Response.json({ok:true,message:'Imagen de tienda actualizada.'});
  }
  if(act==='edit'){
   const name=String(body.name||'').trim(),desc=String(body.description||'').trim();if(name.length<3||name.length>40||desc.length>250)return jsonError('Datos de tienda no válidos.',400);
   await db.prepare('UPDATE player_shops SET name=?,description=? WHERE id=?').bind(name,desc,shop.id).run();return Response.json({ok:true,message:'Tienda actualizada.'});
  }
  if(act==='stock'){
   const id=Number(body.design_id),qty=Number(body.quantity),price=Number(body.price);
   if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(qty)||qty<1||!Number.isInteger(price)||price<0||price>100000)return jsonError('Elige diseño, precio y existencias válidos.',400);
   const own=await db.prepare('SELECT id FROM community_designs WHERE id=? AND user_id=? AND NOT EXISTS(SELECT 1 FROM withdrawn_designs WHERE design_id=community_designs.id)').bind(id,u.id).first();if(!own)return jsonError('Solo puedes vender tus propios diseños.',403);
   await db.prepare('INSERT INTO player_shop_stock(shop_id,design_id,quantity,price) VALUES(?,?,?,?) ON CONFLICT(shop_id,design_id) DO UPDATE SET quantity=quantity+excluded.quantity,price=excluded.price').bind(shop.id,id,qty,price).run();
   return Response.json({ok:true,message:'Stock añadido.'});
  }
  if(act==='remove'){
   const id=Number(body.design_id);await db.prepare('DELETE FROM player_shop_stock WHERE shop_id=? AND design_id=?').bind(shop.id,id).run();return Response.json({ok:true,message:'Diseño retirado del escaparate.'});
  }
  if(act==='bid'){
   const amount=Number(body.amount);if(!Number.isInteger(amount)||amount<1||amount>100000)return jsonError('Puja de 1 a 100.000 T$.',400);
   const last=await db.prepare('SELECT amount FROM player_shop_bids WHERE cycle_id=? AND shop_id=?').bind(c.id,shop.id).first(),previous=Number(last?.amount||0);
   if(amount<=previous)return jsonError('La puja total debe superar la anterior.',400);
   try {
     if(last){
       await db.prepare('UPDATE player_shop_bids SET amount=?,updated_at=CURRENT_TIMESTAMP WHERE cycle_id=? AND shop_id=? AND amount<?').bind(amount,c.id,shop.id,amount).run();
     } else {
       await db.prepare('INSERT INTO player_shop_bids(cycle_id,shop_id,amount) VALUES(?,?,?)').bind(c.id,shop.id,amount).run();
     }
   } catch (error) {
     return jsonError('No se pudo registrar la puja. Comprueba tu saldo y la ronda activa.',409);
   }
   return Response.json({ok:true,message:'Puja registrada. Solo se te cobrará si tu tienda sube al escaparate.'});
  }
  return jsonError('Acción desconocida.',400);
 }catch(e){console.error('Player shops',e);return jsonError('No se pudo completar la operación de tienda.',500);}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
