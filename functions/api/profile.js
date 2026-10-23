import { ensureProfileSchema, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";
import { getSessionUser } from "../_shared/auth.js";
import { ensureCastingSchema } from "../_shared/casting.js";

export async function onRequest({ request, env }) {
  if (!env.DB) return jsonError("La base de datos no está disponible.", 503);
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);
    await ensureCastingSchema(env.DB);
    if (request.method === "PUT") {
      const viewer = await getSessionUser(request, env.DB);
      if (!viewer) return jsonError("Inicia sesión para editar el perfil.", 401);
      const body = await request.json().catch(() => ({}));
      const bio = String(body.bio || "").trim();
      if (bio.length > 300) return jsonError("La descripción no puede superar 300 caracteres.", 400);
      await env.DB.prepare("UPDATE users SET bio=? WHERE id=?").bind(bio, viewer.id).run();
      return Response.json({ ok: true, message: "Perfil actualizado." });
    }
    if (request.method !== "GET") return jsonError("Método no permitido.", 405);
    const username = String(new URL(request.url).searchParams.get("username") || "").trim();
    if (!username) return jsonError("Falta el usuario.", 400);

    let profile = await env.DB.prepare(`
      SELECT u.username, u.karma, u.t_money, u.is_admin, u.is_banned, u.is_test_bot, u.ban_reason, u.bio,
             s.games_played, s.wins, s.points, s.created_at, equipped.theme_code, avatar.theme_code AS avatar_code,
             COALESCE((SELECT r.keys FROM casting_resources r WHERE r.casting_id=1 AND LOWER(r.username)=LOWER(u.username)),0) AS casting_keys,
             COALESCE((SELECT r.apples FROM casting_resources r WHERE r.casting_id=1 AND LOWER(r.username)=LOWER(u.username)),0) AS casting_apples,
             COALESCE((SELECT r.health FROM casting_resources r WHERE r.casting_id=1 AND LOWER(r.username)=LOWER(u.username)),0) AS casting_health
      FROM users u
      LEFT JOIN user_stats s ON LOWER(s.username) = LOWER(u.username)
      LEFT JOIN user_inventory inventory ON inventory.user_id=u.id AND inventory.is_equipped=1
        AND inventory.item_code IN (SELECT code FROM shop_items WHERE category='Diseños de perfil')
      LEFT JOIN shop_items equipped ON equipped.code=inventory.item_code AND equipped.category='Diseños de perfil'
      LEFT JOIN user_inventory avatar_inventory ON avatar_inventory.user_id=u.id AND avatar_inventory.is_equipped=1
      LEFT JOIN shop_items avatar ON avatar.code=avatar_inventory.item_code AND avatar.category='Avatares'
      WHERE LOWER(u.username) = LOWER(?)
      LIMIT 1
    `).bind(username).first();

    // Older casting entries can predate registered user accounts. Keep their
    // public profile links working using the participant record and its game
    // resources; registered accounts always take precedence above.
    if (!profile) {
      const participant = await env.DB.prepare(`
        SELECT p.username, p.joined_at,
               COALESCE(r.keys,0) AS casting_keys,
               COALESCE(r.apples,3) AS casting_apples,
               COALESCE(r.health,100) AS casting_health
        FROM casting_players p
        LEFT JOIN casting_resources r
          ON r.casting_id=p.casting_id AND LOWER(r.username)=LOWER(p.username)
        WHERE p.casting_id=1 AND LOWER(p.username)=LOWER(?)
        ORDER BY p.id DESC LIMIT 1
      `).bind(username).first();
      if (!participant) return jsonError("No existe ese perfil.", 404);
      profile = {
        ...participant,
        karma: 0, t_money: 0, is_admin: 0, is_banned: 0,
        is_test_bot: 0, ban_reason: null, bio: "", theme_code: null,
        avatar_code: null, games_played: 0, wins: 0, points: 0,
        created_at: participant.joined_at
      };
    }
    return Response.json({
      ok: true,
      profile: {
        username: profile.username,
        karma: Number(profile.karma) || 0,
        t_money: Number(profile.t_money) || 0,
        is_admin: Boolean(profile.is_admin),
        is_test_bot: Boolean(profile.is_test_bot),
        is_banned: Boolean(profile.is_banned),
        ban_reason: profile.is_banned ? (profile.ban_reason || "Sin motivo especificado") : null,
        bio: profile.bio || "",
        theme_code: profile.theme_code || "default",
        avatar_code: profile.avatar_code || "default",
        casting_keys: Number(profile.casting_keys) || 0,
        casting_apples: Number(profile.casting_apples) || 0,
        casting_health: Number(profile.casting_health) || 0,
        games_played: Number(profile.games_played) || 0,
        wins: Number(profile.wins) || 0,
        points: Number(profile.points) || 0,
        created_at: profile.created_at || null
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile lookup failed", error);
    return jsonError("No se pudo cargar el perfil.", 500);
  }
}
