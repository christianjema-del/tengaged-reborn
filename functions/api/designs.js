import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { DESIGN_THEMES, ensureCommunitySchema } from "../_shared/community.js";

export async function onRequest({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);
    if (request.method === "GET") {
      const result = await env.DB.prepare("SELECT id, author, title, description, theme_code, created_at FROM community_designs ORDER BY id DESC LIMIT 60").all();
      return Response.json({ ok: true, designs: result.results }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method === "POST") {
      const user = await getSessionUser(request, env.DB);
      if (!user) return jsonError("Inicia sesión para compartir un diseño.", 401);
      const body = await request.json().catch(() => ({}));
      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();
      const theme = String(body.theme_code || "");
      if (title.length < 3 || title.length > 60 || description.length > 240 || !DESIGN_THEMES.has(theme)) return jsonError("Completa un título válido y selecciona uno de los diseños disponibles.", 400);
      const result = await env.DB.prepare("INSERT INTO community_designs(user_id,author,title,description,theme_code) VALUES(?,?,?,?,?)").bind(user.id, user.username, title, description, theme).run();
      return Response.json({ ok: true, id: result.meta.last_row_id, message: "Diseño compartido." }, { status: 201 });
    }
    return jsonError("Método no permitido.", 405);
  } catch (error) {
    console.error("Designs API failed", error);
    return jsonError("No se pudieron cargar los diseños.", 500);
  }
}
