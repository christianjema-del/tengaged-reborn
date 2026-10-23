import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  await ensureProfileSchema(env.DB);
  const user = await getSessionUser(request, env.DB);
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  return Response.json({ ok: true, user }, { headers: { "Cache-Control": "no-store" } });
}
