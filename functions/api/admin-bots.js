import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";

const BOT_NAMES = ["bot_cereza", "bot_manzana", "bot_llave", "bot_luna"];

function randomHex(length = 12) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    const admin = await getSessionUser(request, env.DB);
    if (!admin || !admin.is_admin || admin.username.toLowerCase() !== "admin1") {
      return jsonError("Solo admin1 puede crear cuentas de prueba.", 403);
    }

    const credentials = [];
    for (const base of BOT_NAMES) {
      let username = base;
      let suffix = 0;
      while (await env.DB.prepare("SELECT id FROM users WHERE LOWER(username)=LOWER(?)").bind(username).first()) {
        suffix += 1;
        username = `${base}_${suffix}`;
      }
      const password = randomHex(10);
      const passwordHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
      const hash = [...new Uint8Array(passwordHash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
      const email = `${username}@bots.tengaged.local`;
      const result = await env.DB.prepare("INSERT INTO users(username,email,password_hash,is_test_bot,karma,t_money) VALUES(?,?,?,1,10,100)")
        .bind(username, email, hash).run();
      credentials.push({ username, password, id: result.meta.last_row_id, t_money: 100, karma: 10 });
    }

    return Response.json({ ok: true, message: "Se crearon cuentas de prueba. Guarda las contraseñas ahora; no se volverán a mostrar.", accounts: credentials }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Test account creation failed", error);
    return jsonError("No se pudieron crear las cuentas de prueba.", 500);
  }
}
