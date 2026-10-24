export async function ensureCommunitySchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS blog_posts_created_idx ON blog_posts(created_at DESC, id DESC)`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS community_designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    theme_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS shop_items (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    theme_code TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS user_inventory (
    user_id INTEGER NOT NULL,
    item_code TEXT NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id, item_code)
  )`).run();

  const items = [
    ["profile-rose", "Perfil rosa", "Diseños de perfil", "Un marco rosa suave para tu perfil.", 25, "rose"],
    ["profile-sky", "Perfil cielo", "Diseños de perfil", "Un marco azul clásico para tu perfil.", 25, "sky"],
    ["profile-gold", "Perfil dorado", "Diseños de perfil", "Un acabado dorado para destacar.", 60, "gold"],
    ["profile-lilac", "Perfil lila", "Diseños de perfil", "Un tono lila pastel para tu perfil.", 40, "lilac"],
    ["avatar-classic-blue", "Clásico azul", "Avatares", "Retrato clásico de Tengaged en tonos azules.", 0, "classic-blue"],
    ["avatar-classic-rose", "Clásico rosa", "Avatares", "Retrato clásico de Tengaged en tonos rosas.", 0, "classic-rose"],
    ["avatar-classic-gold", "Clásico dorado", "Avatares", "Retrato clásico de Tengaged en tonos dorados.", 0, "classic-gold"],
    ["avatar-classic-mint", "Clásico menta", "Avatares", "Retrato clásico de Tengaged en tonos menta.", 0, "classic-mint"],
    ["avatar-classic-lilac", "Clásico lila", "Avatares", "Retrato clásico de Tengaged en tonos lilas.", 0, "classic-lilac"],
    ["avatar-classic-sunset", "Clásico atardecer", "Avatares", "Retrato clásico de Tengaged en tonos cálidos.", 0, "classic-sunset"],
    ["avatar-star", "Avatar estrella", "Avatares", "Un distintivo de estrella para tu perfil.", 20, "star"]
  ];
  for (const item of items) {
    await db.prepare(`INSERT OR IGNORE INTO shop_items(code,name,category,description,price,theme_code) VALUES(?,?,?,?,?,?)`).bind(...item).run();
  }
}

export const DESIGN_THEMES = new Set(["rose", "sky", "gold", "lilac"]);
