import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    const actor = await getSessionUser(request, env.DB);
    if (!actor) return jsonError("Inicia sesión para continuar.", 401);
    if (!actor.is_admin || actor.username.toLowerCase() !== "admin1") return jsonError("No tienes permisos de administración.", 403);

    const body = await request.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const action = String(body.action || "");
    const reason = String(body.reason || "").trim().slice(0, 180);
    if (!username || !/^[A-Za-z0-9_]{3,24}$/.test(username)) return jsonError("Indica un nombre de usuario válido.", 400);

    const target = await env.DB.prepare("SELECT id, username FROM users WHERE LOWER(username)=LOWER(?) LIMIT 1").bind(username).first();
    if (!target) return jsonError("No existe ese usuario.", 404);
    if (target.id === actor.id && (action === "ban" || action === "unban")) return jsonError("No puedes suspender tu propia cuenta.", 400);

    let amount = null;
    let statements;
    if (action === "give_karma" || action === "give_t_money") {
      amount = Number(body.amount);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) return jsonError("La cantidad debe ser un número entero entre 1 y 1.000.000.", 400);
      const column = action === "give_karma" ? "karma" : "t_money";
      statements = [
        env.DB.prepare(`UPDATE users SET ${column}=COALESCE(${column},0)+? WHERE id=?`).bind(amount, target.id),
        env.DB.prepare("INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) VALUES(?,?,?,?,?)").bind(actor.id, target.id, action, amount, reason || null)
      ];
    } else if (action === "ban" || action === "unban") {
      const banned = action === "ban";
      if (banned && !reason) return jsonError("Escribe un motivo para el baneo.", 400);
      statements = [
        env.DB.prepare("UPDATE users SET is_banned=?, ban_reason=?, banned_at=? WHERE id=?").bind(banned ? 1 : 0, banned ? reason : null, banned ? new Date().toISOString() : null, target.id),
        ...(banned ? [
          env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(target.id),
          env.DB.prepare("DELETE FROM casting_players WHERE LOWER(username)=LOWER(?)").bind(target.username)
        ] : []),
        env.DB.prepare("INSERT INTO admin_audit_log(actor_user_id,target_user_id,action,amount,reason) VALUES(?,?,?,?,?)").bind(actor.id, target.id, action, null, reason || null)
      ];
      if (banned) {
        const gameTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='game_players'").first();
        if (gameTable) statements.splice(2, 0, env.DB.prepare("UPDATE game_players SET status='eliminated', eliminated_at=CURRENT_TIMESTAMP WHERE LOWER(username)=LOWER(?) AND status='active'").bind(target.username));
      }
    } else {
      return jsonError("Acción administrativa no reconocida.", 400);
    }

    await env.DB.batch(statements);
    const updated = await env.DB.prepare("SELECT username, karma, t_money, is_banned, ban_reason FROM users WHERE id=?").bind(target.id).first();
    return Response.json({ ok: true, message: "Cambios guardados.", user: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin action failed", error);
    return jsonError("No se pudo completar la acción.", 500);
  }
}
