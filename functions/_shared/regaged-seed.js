import {DEMO_DESIGNS} from './demo-designs.js';

// Instala una sola vez las diez imágenes aportadas por el usuario.
// No concede permisos administrativos ni modifica saldo o inventario.
export async function ensureAdminDesigns(db, user) {
  if (!user || user.username.toLowerCase() !== 'admin1' || !user.is_admin) return 0;
  let created = 0;
  for (const design of DEMO_DESIGNS) {
    const existing = await db.prepare('SELECT id FROM community_designs WHERE user_id=? AND title=? LIMIT 1')
      .bind(user.id, design.title).first();
    if (existing) continue;
    const result = await db.prepare(`INSERT INTO community_designs
      (user_id,author,title,description,theme_code,price,image_data,layer_type)
      SELECT ?,?,?,?,?,?,?,?
      WHERE NOT EXISTS(SELECT 1 FROM community_designs WHERE user_id=? AND title=?)`)
      .bind(user.id,user.username,design.title,design.description,design.theme_code,
        design.price,design.image_data,design.layer_type,user.id,design.title).run();
    created += Number(result.meta?.changes || 0);
  }
  return created;
}
