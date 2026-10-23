import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";

export async function onRequest({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);
    if (request.method === "GET") {
      const posts = await env.DB.prepare(`SELECT id, author, title, body, created_at FROM blog_posts ORDER BY id DESC LIMIT 50`).all();
      return Response.json({ ok: true, posts: posts.results }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method === "POST") {
      const user = await getSessionUser(request, env.DB);
      if (!user) return jsonError("Inicia sesión para publicar.", 401);
      const body = await request.json().catch(() => ({}));
      const title = String(body.title || "").trim();
      const content = String(body.body || "").trim();
      if (title.length < 3 || title.length > 80 || content.length < 1 || content.length > 3000) return jsonError("El título debe tener entre 3 y 80 caracteres y el texto no puede superar 3.000.", 400);
      const result = await env.DB.prepare("INSERT INTO blog_posts(user_id,author,title,body) VALUES(?,?,?,?)").bind(user.id, user.username, title, content).run();
      return Response.json({ ok: true, id: result.meta.last_row_id, message: "Entrada publicada." }, { status: 201 });
    }
    if (request.method === "DELETE") {
      const user = await getSessionUser(request, env.DB);
      if (!user) return jsonError("Inicia sesión para continuar.", 401);
      const id = Number(new URL(request.url).searchParams.get("id"));
      if (!Number.isSafeInteger(id) || id < 1) return jsonError("Entrada no válida.", 400);
      const result = await env.DB.prepare("DELETE FROM blog_posts WHERE id=? AND (user_id=? OR ?=1)").bind(id, user.id, user.is_admin ? 1 : 0).run();
      if (!result.meta.changes) return jsonError("No tienes permiso para borrar esa entrada.", 403);
      return Response.json({ ok: true, message: "Entrada eliminada." });
    }
    return jsonError("Método no permitido.", 405);
  } catch (error) {
    console.error("Blog API failed", error);
    return jsonError("No se pudo completar la acción del blog.", 500);
  }
}
