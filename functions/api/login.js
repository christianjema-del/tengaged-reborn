import { ensureProfileSchema, ADMIN_USERNAME } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim(); const password = String(body.password || '');
  await ensureProfileSchema(env.DB);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hex = [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const u = await env.DB.prepare('SELECT id,username,karma,is_admin,is_banned,t_money FROM users WHERE username=? AND password_hash=?').bind(username,hex).first();
  if (!u) return Response.json({error:'Usuario o contraseña incorrectos'}, {status:401});
  if (u.is_banned) return Response.json({error:'Esta cuenta está suspendida. Contacta con administración.'}, {status:403});
  // Bootstrap the named owner account only after its existing password has
  // been verified. The browser can never grant itself administrator access.
  if (u.username.toLowerCase() === ADMIN_USERNAME) {
    await env.DB.prepare('UPDATE users SET is_admin=1 WHERE id=?').bind(u.id).run();
    u.is_admin = 1;
  }
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...tokenBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  const th = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const thx=[...new Uint8Array(th)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const exp = new Date(Date.now()+1000*60*60*24*30).toISOString();
  await env.DB.prepare('INSERT INTO sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').bind(u.id,thx,exp).run();
  return new Response(JSON.stringify({ok:true,user:u}),{headers:{'Content-Type':'application/json','Set-Cookie':`session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`}});
}
