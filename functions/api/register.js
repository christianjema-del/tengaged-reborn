export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));

  const u = String(b.username || '').trim();
  const e = String(b.email || '').trim().toLowerCase();
  const p = String(b.password || '');

  if (
    !/^[A-Za-z0-9_]{3,24}$/.test(u) ||
    !e.includes('@') ||
    p.length < 8
  ) {
    return Response.json(
      { error: 'Usuario, email o contraseña inválidos' },
      { status: 400 }
    );
  }

  const existing = await env.DB
    .prepare('SELECT id FROM users WHERE username=? OR email=?')
    .bind(u, e)
    .first();

  if (existing) {
    return Response.json(
      { error: 'Usuario o email ya existe' },
      { status: 409 }
    );
  }

  const h = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(p)
  );

  const x = [...new Uint8Array(h)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const r = await env.DB
    .prepare(
      'INSERT INTO users(username,email,password_hash) VALUES(?,?,?)'
    )
    .bind(u, e, x)
    .run();

  return Response.json({
    ok: true,
    id: r.meta.last_row_id,
    username: u
  });
}
