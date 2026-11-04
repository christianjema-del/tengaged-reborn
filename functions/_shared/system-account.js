import {ensureProfileSchema} from './auth.js';
const ready=new WeakMap();
export const SYSTEM_NAME='Tengaged';
const welcome=`¡Bienvenido/a a Tengaged!

Aquí puedes jugar a realities sociales, conocer gente y personalizar tu avatar.

Para empezar:
1. Abre Mi perfil y Editar avatar para elegir tu aspecto. Los diseños comprados o regalados se encuentran en tu armario: puedes probarlos antes de guardar.
2. En Juegos encontrarás las inscripciones de Casting y Hunger Games. Dentro de una partida podrás hablar con los participantes y realizar las pruebas. Al quedar eliminado podrás leer el chat, pero no escribir.
3. Visita los perfiles para añadir amigos y usa Correo para hablar en privado.
4. En Blogs puedes publicar, comentar y votar; en Grupos puedes encontrar foros y encuestas.
5. En Tiendas puedes comprar o regalar diseños cuando el escaparate esté activo, haya existencias y tengas saldo suficiente.

Encontrarás más información en Cómo jugar, al pie de la web.

¡Tu reality. Tus decisiones. Tu historia!

Este es un aviso automático de Tengaged y no admite respuesta.`;
const quote=s=>"'"+s.replaceAll("'","''")+"'";
export async function ensureSystemAccount(db){
 if(ready.has(db))return ready.get(db);
 const task=(async()=>{
  // Keep session checks independent of shop catalogs, groups and community setup.
  await ensureProfileSchema(db);
  await db.prepare(`CREATE TABLE IF NOT EXISTS private_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender INTEGER NOT NULL,recipient INTEGER NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  const prior=await db.prepare("SELECT id,is_system FROM users WHERE username=? COLLATE NOCASE").bind(SYSTEM_NAME).first();
  if(prior&&!prior.is_system)throw Error('El nombre Tengaged ya pertenece a una cuenta normal; no se ha modificado.');
  if(!prior){
   await db.prepare(`INSERT INTO users(username,email,password_hash,is_system,is_admin,karma,t_money,bio)
    SELECT ?,?,?,1,0,0,0,? WHERE NOT EXISTS(SELECT 1 FROM users WHERE username=? COLLATE NOCASE)`)
    .bind(SYSTEM_NAME,'system-'+crypto.randomUUID()+'@tengaged.invalid','system-disabled:'+crypto.randomUUID(),
     'Cuenta oficial de avisos automáticos. Envía bienvenidas y notificaciones de regalos y premios de acceso diario. No participa en juegos ni responde a mensajes.',SYSTEM_NAME).run();
  }
  const account=await db.prepare('SELECT id,is_system FROM users WHERE username=? COLLATE NOCASE').bind(SYSTEM_NAME).first();
  if(!account?.is_system)throw Error('No se pudo reservar la cuenta oficial Tengaged.');
  try{await db.prepare('ALTER TABLE private_messages ADD COLUMN system_event TEXT').run();}catch(e){if(!/duplicate column/i.test(String(e.message||e)))throw e;}
  await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS private_messages_system_event ON private_messages(system_event) WHERE system_event IS NOT NULL').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS private_messages_unread ON private_messages(recipient) WHERE read_at IS NULL').run();
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_welcome_message
   AFTER INSERT ON users WHEN NEW.is_system=0 AND NEW.is_test_bot=0 BEGIN
   INSERT OR IGNORE INTO private_messages(sender,recipient,subject,body,system_event)
   SELECT id,NEW.id,'¡Bienvenido/a a Tengaged!',
    'Hola, '||NEW.username||char(10)||char(10)||${quote(welcome)},'welcome:'||NEW.id
   FROM users WHERE username='Tengaged' COLLATE NOCASE AND is_system=1;
   END`).run();
  return account.id;
 })();ready.set(db,task);try{return await task;}catch(e){ready.delete(db);throw e;}
}
export async function ensureGiftNotifications(db){
 await ensureSystemAccount(db);
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS tengaged_gift_message
  AFTER INSERT ON player_shop_gifts BEGIN
  INSERT OR IGNORE INTO private_messages(sender,recipient,subject,body,system_event)
  SELECT sys.id,NEW.recipient_id,'¡Has recibido un regalo!',
   'Hola, '||receiver.username||'.'||char(10)||char(10)||
   giver.username||' te ha regalado «'||d.title||'».'||char(10)||
   CASE WHEN NEW.message<>'' THEN char(10)||'Dedicatoria: '||NEW.message||char(10) ELSE '' END||
   char(10)||'El diseño ya está en tu inventario. Abre Mi perfil → Editar avatar para verlo en tu armario, probarlo y guardar tu nueva apariencia.'||char(10)||
   'También puedes consultarlo en la galería de regalos de tu perfil.'||char(10)||char(10)||
   'Este es un aviso automático de Tengaged y no admite respuesta.',
   'gift:'||NEW.id
  FROM users sys JOIN users receiver ON receiver.id=NEW.recipient_id
  JOIN users giver ON giver.id=NEW.buyer_id JOIN community_designs d ON d.id=NEW.design_id
  WHERE sys.username='Tengaged' COLLATE NOCASE AND sys.is_system=1;
  END`).run();
}
