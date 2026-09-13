export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username) || !email.includes('@') || password.length < 8) return Response.json({error:'Datos inválidos'}, {status:400});
  const exists = await env.DB.prepare('SELECT id FROM users WHERE username=? OR email=?').bind(username,email).first();
  if (exists) return Response.json({error:'Usuario o email ya existe'}, {status:409});
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hex = [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const r = await env.DB.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').bind(username,email,hex).run();
  return Response.json({ok:true,id:r.meta.last_row_id,username});
}
