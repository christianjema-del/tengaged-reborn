# V170 · Corrección de carga general

Diagnóstico observado: Tiendas cancelaba la carga al cumplir 15 segundos, mientras la API publicada sí devolvía tiendas, productos, regalos y compras. Las solicitudes medidas variaron: salud/sesión/tienda superaron los 10 segundos y el listado de tiendas rozó 15 segundos; una petición a blogs no respondió en 50 segundos desde el entorno de revisión. Esta versión no afirma que todo problema de conectividad tenga esa misma causa.

Correcciones:
- Preparación persistente y por base de datos de los esquemas de cuentas, comunidad, grupos/social y correo/blogs. Una caché WeakMap por objeto D1 no basta si Cloudflare entrega otro objeto en otra petición. El marcador se graba solo al completar toda la preparación; los fallos se reintentan y los datos existentes se conservan. La prueba de un nuevo objeto D1 sobre la misma base reduce 171 consultas de preparación a una. Si se añaden futuras migraciones se debe actualizar la clave de versión correspondiente; no borrar los marcadores del usuario para forzar trabajo repetido.
- Tiempo máximo de las solicitudes compartidas de 60 segundos, incluyendo la lectura de la respuesta. Sesión e indicadores: 45 segundos. Las escrituras se envían una sola vez; nunca se repiten automáticamente compras, regalos, votos o mensajes.
- Tiendas de jugadores consulta directamente su propia API; ya no espera a que responda otra consulta independiente al catálogo de tarjetas. Conserva su saldo e inventario propios.
- La consulta de mensajes públicos deja de ejecutar reparaciones de clasificación en cada actualización. Las reparaciones siguen disponibles en las consultas de Castings y perfiles. Si fallan los avisos complementarios, se conservan los comentarios públicos.
- Versiones de los scripts y utilidades compartidas actualizadas para que el navegador reciba la corrección.

Validación: 131 archivos de pruebas pasan, incluyendo economía, permisos, historial, clasificación, nuevas comprobaciones de esquemas persistentes, fallos de migración y ausencia de reenvío de escrituras. En el navegador local se retrasaron 20 segundos las respuestas reales de Tiendas, Blogs, Perfil y mensajes públicos: completaron la carga. Correo abrió correctamente. Tiendas también cargó en 320 px sin desbordamiento horizontal. Esta revisión local no sustituye la verificación del despliegue ni una prueba en Safari físico.

Se conserva el diseño V169 y la configuración de la base de datos. No se reinician partidas ni se borran usuarios, publicaciones, mensajes o inventarios. El código de reglas de Hunger y Casting permanece igual.

Publicar estas dos órdenes por separado:

cd /Users/christianmonzonlorente/Downloads/Tengaged-V170
npx wrangler pages deploy . --project-name tengaged-reborns

Después verificar en el despliegue: Blogs, perfil propio, Correo, Tiendas → Tiendas de jugadores y Juegos. El primer acceso puede necesitar completar la preparación una vez. No volver a publicar una versión anterior encima de esta corrección.
