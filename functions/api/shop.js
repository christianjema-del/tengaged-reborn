import {withStorageGuard} from '../_shared/storage-guard141.js';
import {COLOR_LEVEL_BY_CODE} from '../../color-level-catalog.js';
import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";

import {legacyAvatar} from '../../avatar-art.js';
import {ensureAvatar} from '../_shared/avatar-settings.js';

async function handle141_onRequest({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);
    await ensureAvatar(env.DB);
    if (request.method === "GET") {
      const user = await getSessionUser(request, env.DB);
      const items = await env.DB.prepare(`
        SELECT i.code, i.name, i.category, i.description, i.price, i.theme_code, i.min_karma,
               CASE WHEN v.item_code IS NULL THEN 0 ELSE 1 END AS owned,
               COALESCE(v.is_equipped,0) AS is_equipped
        FROM shop_items i LEFT JOIN user_inventory v ON v.item_code=i.code AND v.user_id=?
        ORDER BY i.category, i.price, i.code
      `).bind(user?.id || -1).all();
      const account = user ? await env.DB.prepare("SELECT t_money, karma FROM users WHERE id=?").bind(user.id).first() : null;
      return Response.json({ ok: true, balance: Number(account?.t_money) || 0, karma: Number(account?.karma) || 0, items: items.results, signed_in: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method === "POST") {
      if(request.headers.get("Origin")!==new URL(request.url).origin)return jsonError("Origen no permitido.",403);
      const user = await getSessionUser(request, env.DB);
      if (!user) return jsonError("Inicia sesión para usar la tienda.", 401);
      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "");
      const code = String(body.item_code || "");
      if(action==='buy_design')return jsonError('Los diseños se compran en una tienda activa o ganando su subasta.',403);
      if(action==='equip_design'){
        if(!/^userdesign-[1-9][0-9]*$/.test(code))return jsonError('Diseño no válido.',400);
        const design=await env.DB.prepare("SELECT id,layer_type FROM community_designs WHERE ('userdesign-' || id)=? AND EXISTS(SELECT 1 FROM user_inventory WHERE user_id=? AND item_code=?)").bind(code,user.id,code).first();
        if(!design)return jsonError('Primero debes obtener este diseño.',403);
        if(design.layer_type!=='profile'){
          await env.DB.batch([
            env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT 'userdesign-' || id FROM community_designs WHERE layer_type=?)").bind(user.id,design.layer_type),
            env.DB.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(?,?)').bind(user.id,code),
            env.DB.prepare('UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?').bind(user.id,code),
            env.DB.prepare('INSERT INTO user_avatar_layers(user_id,layer_type,design_id) VALUES(?,?,?) ON CONFLICT(user_id,layer_type) DO UPDATE SET design_id=excluded.design_id').bind(user.id,design.layer_type,design.id)
          ]);return Response.json({ok:true,message:'Pieza equipada en tu avatar.'});
        }
        await env.DB.batch([
          env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND (item_code IN (SELECT 'userdesign-' || id FROM community_designs WHERE layer_type='profile') OR item_code IN (SELECT code FROM shop_items WHERE category='Diseños de perfil'))").bind(user.id),
          env.DB.prepare('INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(?,?)').bind(user.id,code),
          env.DB.prepare('UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?').bind(user.id,code)
        ]);
        return Response.json({ok:true,message:'Diseño equipado. Puedes verlo en Mi perfil.'});
      }
      const item = await env.DB.prepare("SELECT code, name, category, price, min_karma, theme_code FROM shop_items WHERE code=?").bind(code).first();
      if (!item) return jsonError("No existe ese artículo.", 404);

      if(action==='wear_white'){
        if(code!=='color-card-white')return jsonError('Tarjeta no válida.',400);
        await env.DB.batch([
          env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT code FROM shop_items WHERE category='Tarjetas de color')").bind(user.id),
          env.DB.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(?,'color-card-white')").bind(user.id),
          env.DB.prepare("UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code='color-card-white'").bind(user.id)
        ]);return Response.json({ok:true,message:'Tarjeta blanca equipada.'});
      }
      if (action === "equip") {
        const owned = await env.DB.prepare("SELECT item_code FROM user_inventory WHERE user_id=? AND item_code=?").bind(user.id, code).first();
        if (!owned) return jsonError("Primero debes comprar este artículo.", 403);
        await env.DB.batch([
          env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND (item_code IN (SELECT code FROM shop_items WHERE category=?) OR (?='Diseños de perfil' AND item_code IN (SELECT 'userdesign-' || id FROM community_designs WHERE layer_type='profile')))").bind(user.id,item.category,item.category),
          env.DB.prepare("UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?").bind(user.id,code)
        ]);
        if(item.category==='Avatares')await env.DB.prepare('INSERT INTO user_avatar_settings(user_id,settings) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings,updated_at=CURRENT_TIMESTAMP').bind(user.id,JSON.stringify(legacyAvatar(item.theme_code))).run();
        return Response.json({ ok: true, message: "Diseño equipado." });
      }

      if (action !== "buy") return jsonError("Acción de tienda no reconocida.", 400);
      const owned = await env.DB.prepare("SELECT item_code FROM user_inventory WHERE user_id=? AND item_code=?").bind(user.id, code).first();
      if (owned) return jsonError("Ya tienes este artículo.", 409);
      const level=item.category==='Tarjetas de color'?COLOR_LEVEL_BY_CODE[item.theme_code]:null;
      const previous=level?.previous||null;
      if(previous&&!await env.DB.prepare('SELECT item_code FROM user_inventory WHERE user_id=? AND item_code=?').bind(user.id,previous).first())return jsonError('Compra primero la tarjeta de color anterior.',409);
      const buyer = await env.DB.prepare("SELECT karma FROM users WHERE id=?").bind(user.id).first();
      if ((Number(buyer?.karma)||0) < (Number(item.min_karma)||0)) return jsonError(`Necesitas ${Number(item.min_karma).toLocaleString("es-ES")} karma para comprarlo.`,403);
      const purchase=await env.DB.batch([
        env.DB.prepare(`INSERT OR IGNORE INTO user_inventory(user_id,item_code)
          SELECT ?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND t_money>=? AND karma>=?) AND (? IS NULL OR EXISTS(SELECT 1 FROM user_inventory WHERE user_id=? AND item_code=?))`).bind(user.id,code,user.id,item.price,item.min_karma||0,previous,user.id,previous),
        env.DB.prepare('UPDATE users SET t_money=t_money-? WHERE id=? AND changes()=1').bind(item.price,user.id),
        ...(level?[env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND changes()=1 AND item_code IN (SELECT code FROM shop_items WHERE category='Tarjetas de color')").bind(user.id),env.DB.prepare('UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?').bind(user.id,code)]:[])
      ]);
      if(!purchase[0].meta.changes)return jsonError('Ya tienes el artículo o no tienes suficiente saldo.',409);
      const balance = await env.DB.prepare("SELECT t_money FROM users WHERE id=?").bind(user.id).first();
      return Response.json({ ok: true, message: "Artículo comprado.", balance: Number(balance?.t_money)||0 }, { status: 201 });
    }
    return jsonError("Método no permitido.", 405);
  } catch (error) {
    console.error("Shop API failed", error);
    return jsonError("No se pudo completar la acción de la tienda.", 500);
  }
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
