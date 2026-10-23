import { ensureProfileSchema, jsonError } from "../_shared/auth.js";

export async function onRequestGet({ env }) {
  try {
    await ensureProfileSchema(env.DB);
    const leaders = await env.DB.prepare(`
      SELECT u.username, u.karma, u.t_money, COALESCE(s.games_played,0) AS games_played,
             COALESCE(s.wins,0) AS wins, COALESCE(s.points,0) AS points
      FROM users u LEFT JOIN user_stats s ON LOWER(s.username)=LOWER(u.username)
      WHERE COALESCE(u.is_test_bot,0)=0
      ORDER BY COALESCE(s.wins,0) DESC, COALESCE(s.points,0) DESC, COALESCE(u.karma,0) DESC
      LIMIT 50
    `).all();
    return Response.json({ ok: true, leaders: leaders.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Hall of fame API failed", error);
    return jsonError("No se pudo cargar el Hall of Fame.", 500);
  }
}
