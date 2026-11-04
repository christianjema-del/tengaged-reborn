# V8 · Mafias y navegación

Se añade un sistema funcional de mafias respaldado por Cloudflare D1: creación de mafia, afiliación, abandono y sucesión del liderazgo. Un usuario solo puede pertenecer a una mafia; la ficha aparece en el perfil. Las tablas se crean automáticamente al usar `/api/mafias` y no requieren eliminar ni recrear la base anterior. La creación/afiliación usa credenciales de sesión.

Se añaden «Minijuegos» y «Mafias» en la navegación general. `/minijuegos.html` es un catálogo de las diez pruebas existentes, con acceso a Casting; **aún no hay ranking histórico individual**.

Publicación desde la carpeta descomprimida: `npx wrangler pages deploy . --project-name tengaged-reborns`. Verificar después creación, unión, abandono, sucesión y los perfiles en producción. No se ha publicado automáticamente.
