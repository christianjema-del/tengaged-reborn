import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";

export async function onRequest({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);
    if (request.method === "GET") {
      const user = await getSessionUser(request, env.DB);
      const items = await env.DB.prepare(`
        SELECT i.code, i.name, i.category, i.description, i.price, i.theme_code,
               CASE WHEN v.item_code IS NULL THEN 0 ELSE 1 END AS owned,
               COALESCE(v.is_equipped,0) AS is_equipped
        FROM shop_items i LEFT JOIN user_inventory v ON v.item_code=i.code AND v.user_id=?
        ORDER BY i.category, i.price, i.code
      `).bind(user?.id || -1).all();
      const account = user ? await env.DB.prepare("SELECT t_money FROM users WHERE id=?").bind(user.id).first() : null;
      return Response.json({ ok: true, balance: Number(account?.t_money) || 0, items: items.results, signed_in: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method === "POST") {
      const user = await getSessionUser(request, env.DB);
      if (!user) return jsonError("Inicia sesión para usar la tienda.", 401);
      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "");
      const code = String(body.item_code || "");
      const item = await env.DB.prepare("SELECT code, name, category, price FROM shop_items WHERE code=?").bind(code).first();
      if (!item) return jsonError("No existe ese artículo.", 404);

      if (action === "equip") {
        const owned = await env.DB.prepare("SELECT item_code FROM user_inventory WHERE user_id=? AND item_code=?").bind(user.id, code).first();
        if (!owned) return jsonError("Primero debes comprar este artículo.", 403);
        await env.DB.prepare(`UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT code FROM shop_items WHERE category=?)`).bind(user.id, item.category).run();
        await env.DB.prepare("UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?").bind(user.id, code).run();
        return Response.json({ ok: true, message: "Diseño equipado." });
      }

      if (action !== "buy") return jsonError("Acción de tienda no reconocida.", 400);
      const owned = await env.DB.prepare("SELECT item_code FROM user_inventory WHERE user_id=? AND item_code=?").bind(user.id, code).first();
      if (owned) return jsonError("Ya tienes este artículo.", 409);
      const inserted = await env.DB.prepare(`
        INSERT INTO user_inventory(user_id,item_code)
        SELECT ?,? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND t_money>=?)
      `).bind(user.id, code, user.id, item.price).run();
      if (!inserted.meta.changes) return jsonError("No tienes suficientes T$.", 400);
      const charged = await env.DB.prepare("UPDATE users SET t_money=t_money-? WHERE id=? AND t_money>=?").bind(item.price, user.id, item.price).run();
      if (!charged.meta.changes) {
        await env.DB.prepare("DELETE FROM user_inventory WHERE user_id=? AND item_code=?").bind(user.id, code).run();
        return jsonError("No tienes suficientes T$.", 400);
      }
      return Response.json({ ok: true, message: "Artículo comprado.", balance: undefined }, { status: 201 });
    }
    return jsonError("Método no permitido.", 405);
  } catch (error) {
    console.error("Shop API failed", error);
    return jsonError("No se pudo completar la acción de la tienda.", 500);
  }
}
