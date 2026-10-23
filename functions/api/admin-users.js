import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    const admin = await getSessionUser(request, env.DB);
    if (!admin || !admin.is_admin || admin.username.toLowerCase() !== "admin1") return jsonError("Solo admin1 puede consultar la lista.", 403);

    const query = String(new URL(request.url).searchParams.get("q") || "").trim().slice(0, 24);
    const users = await env.DB.prepare(`
      SELECT u.id, u.username, u.karma, u.t_money, u.is_banned, u.is_test_bot,
             COALESCE(s.games_played,0) AS games_played, COALESCE(s.created_at,'') AS created_at
      FROM users u LEFT JOIN user_stats s ON LOWER(s.username)=LOWER(u.username)
      WHERE (?='' OR LOWER(u.username) LIKE LOWER(?))
      ORDER BY u.id DESC LIMIT 100
    `).bind(query, `%${query}%`).all();
    return Response.json({ ok: true, users: users.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin user list failed", error);
    return jsonError("No se pudieron cargar los usuarios.", 500);
  }
}
