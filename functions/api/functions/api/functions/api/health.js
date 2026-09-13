export async function onRequestGet({ env }) {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS users FROM users'
  ).first();

  return Response.json({
    ok: true,
    users: row?.users ?? 0
  });
}
