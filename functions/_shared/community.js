import {repairPauDesigns224} from './pau-designs224.js';
import {schemaReady170,markSchema170} from './schema-ready170.js';
import {ensurePhotoGifts153} from './photo-import153.js';
import {ensurePhotoGifts152} from './photo-import152.js';
import {ensurePhotoGifts149} from './photo-import149.js';
import {ensurePhotoGifts148} from './photo-import148.js';
import {ensurePhotoAdmin127} from './photo-import127.js';
import {ensureWardrobeGrants118} from './wardrobe-grants118.js';
import {fixAuthorGrants} from './design-ownership117.js';
import {ensurePhotoAvatar} from './photo-import115.js';
import {ensureFentaniloDesigns} from './fentanilo-import114.js';
import {ensureDesignVotes110} from './design-votes110.js';
import {ensurePeachWardrobe} from './peach-wardrobe108.js';
import {COLOR_LEVELS} from '../../color-level-catalog.js';
import {ensureDesignManagement} from './design-management.js';
const ready=new WeakMap();
export async function ensureCommunitySchema(db) {
 if(ready.has(db))return ready.get(db);
 const task=setupOnce224(db);ready.set(db,task);try{return await task;}catch(e){ready.delete(db);throw e;}
}
// La reparación de diseños va tras la migración: con el marcador, cada petición hace una sola consulta.
async function setupOnce224(db){if(await schemaReady170(db,'community-224'))return;await setup(db);await repairPauDesigns224(db);await markSchema170(db,'community-224');}
async function setup(db) {
 if(await schemaReady170(db,'community-170'))return;
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
    price INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  try { await db.prepare("ALTER TABLE community_designs ADD COLUMN price INTEGER NOT NULL DEFAULT 0").run(); }
  catch (error) { if (!/duplicate column/i.test(String(error.message || error))) throw error; }

  await db.prepare(`CREATE TABLE IF NOT EXISTS shop_items (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    theme_code TEXT NOT NULL,
    min_karma INTEGER NOT NULL DEFAULT 0
  )`).run();
  try { await db.prepare("ALTER TABLE shop_items ADD COLUMN min_karma INTEGER NOT NULL DEFAULT 0").run(); }
  catch (error) { if (!/duplicate column/i.test(String(error.message || error))) throw error; }
  await db.prepare(`CREATE TABLE IF NOT EXISTS user_inventory (
    user_id INTEGER NOT NULL,
    item_code TEXT NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id, item_code)
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS design_auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    design_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    starting_bid INTEGER NOT NULL,
    current_bid INTEGER NOT NULL DEFAULT 0,
    highest_bidder_id INTEGER,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TEXT
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS auction_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL,
    bidder_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS design_auctions_open_idx ON design_auctions(status, ends_at)").run();

  try { await db.prepare("ALTER TABLE community_designs ADD COLUMN layer_type TEXT NOT NULL DEFAULT 'profile'").run(); }
  catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
  try { await db.prepare("ALTER TABLE community_designs ADD COLUMN image_data TEXT").run(); }
  catch(error){if(!/duplicate column/i.test(String(error.message||error)))throw error;}
  await db.prepare(`CREATE TABLE IF NOT EXISTS design_likes(design_id INTEGER NOT NULL,user_id INTEGER NOT NULL,PRIMARY KEY(design_id,user_id))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS design_comments(id INTEGER PRIMARY KEY AUTOINCREMENT,design_id INTEGER NOT NULL,user_id INTEGER NOT NULL,author TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();

  // Snapshot only newly published content; historical posts keep their existing score.
  for(const table of ['blog_posts','community_designs'])try{await db.prepare('ALTER TABLE '+table+' ADD COLUMN initial_points159 INTEGER NOT NULL DEFAULT 0').run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}

  const items = [
    ["profile-rose", "Perfil rosa", "Diseños de perfil", "Un marco rosa suave para tu perfil.", 25, "rose"],
    ["profile-sky", "Perfil cielo", "Diseños de perfil", "Un marco azul clásico para tu perfil.", 25, "sky"],
    ["profile-gold", "Perfil dorado", "Diseños de perfil", "Un acabado dorado para destacar.", 60, "gold"],
    ["profile-lilac", "Perfil lila", "Diseños de perfil", "Un tono lila pastel para tu perfil.", 40, "lilac"],
    ["avatar-classic-blue", "Avatar chica azul", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-blue"],
    ["avatar-classic-rose", "Avatar chica rosa", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-rose"],
    ["avatar-classic-gold", "Avatar chico dorado", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-gold"],
    ["avatar-classic-mint", "Avatar chico menta", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-mint"],
    ["avatar-classic-lilac", "Avatar chica lila", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-lilac"],
    ["avatar-classic-sunset", "Avatar chico atardecer", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-sunset"],
    ["avatar-classic-ocean", "Avatar chico océano", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-ocean"],
    ["avatar-classic-coral", "Avatar chica coral", "Avatares", "Avatar ilustrado básico de estilo social.", 0, "classic-coral"],
    ["avatar-star", "Avatar estrella", "Avatares", "Un distintivo de estrella para tu perfil.", 20, "star"],
    ["color-card-green", "Tarjeta verde", "Tarjetas de color", "Color verde para destacar tu nombre y tarjeta de perfil.", 100, "green", 0],
    ["color-card-yellow", "Tarjeta amarilla", "Tarjetas de color", "Color amarillo para destacar tu nombre y tarjeta de perfil.", 250, "yellow", 100],
    ["color-card-orange", "Tarjeta naranja", "Tarjetas de color", "Color naranja para destacar tu nombre y tarjeta de perfil.", 600, "orange", 300],
    ["color-card-red", "Tarjeta roja", "Tarjetas de color", "Color rojo para destacar tu nombre y tarjeta de perfil.", 1200, "red", 700],
    ["color-card-blue", "Tarjeta azul", "Tarjetas de color", "Color azul para destacar tu nombre y tarjeta de perfil.", 2500, "blue", 1500],
    ["color-card-purple", "Tarjeta morada", "Tarjetas de color", "Color morado para destacar tu nombre y tarjeta de perfil.", 5000, "purple", 3000]
  ];
  // Color-level catalog follows the published Regaged level thresholds and prices.
  const colorLevels = COLOR_LEVELS.map(({code,label,karma,price})=>[code,label,karma,price]);
  const catalog=[];
  for(const [code,label,karma,price] of colorLevels){
    catalog.push(db.prepare(`INSERT INTO shop_items(code,name,category,description,price,theme_code,min_karma)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET name=excluded.name,description=excluded.description,price=excluded.price,theme_code=excluded.theme_code,min_karma=excluded.min_karma`)
      .bind('color-card-'+code,'Tarjeta '+label,'Tarjetas de color','Nivel '+label+' para tu perfil.',price,code,karma));
  }
  for (const item of items) {
    catalog.push(db.prepare(`INSERT OR IGNORE INTO shop_items(code,name,category,description,price,theme_code,min_karma) VALUES(?,?,?,?,?,?,?)`).bind(...item.slice(0, 6), item[6] || 0));
  }
  await db.batch(catalog);
  await ensureDesignVotes110(db);await ensureDesignManagement(db);await ensurePeachWardrobe(db);await ensureFentaniloDesigns(db);await ensurePhotoAvatar(db);await ensurePhotoAdmin127(db);await ensurePhotoGifts148(db);await ensurePhotoGifts149(db);await ensurePhotoGifts152(db);await ensurePhotoGifts153(db);await ensureWardrobeGrants118(db);await fixAuthorGrants(db);
 await markSchema170(db,'community-170');
}

export const DESIGN_THEMES = new Set(["rose", "sky", "gold", "lilac"]);
