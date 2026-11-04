# V171 · Recuperación ante fallos intermitentes

Estado observado antes de esta entrega: los mismos endpoints públicos que fallaron por tiempo de espera en revisiones anteriores devolvieron HTTP 200 en esta revisión (salud ~4 s, Blogs ~5 s, mensajes ~5 s, perfil ~9,5 s). Esto confirma comportamiento intermitente; no demuestra una causa única ni permite garantizar disponibilidad de Cloudflare o de la conexión del visitante.

Correcciones:
- Coordinador de lecturas /api/ en las 34 páginas: como máximo cuatro GET simultáneos por página y dos de imágenes/colores. Las solicitudes secundarias no pueden ocupar todos los puestos. Las lecturas idénticas simultáneas se comparten y cada consumidor recibe su propia respuesta.
- Un segundo intento para un error de transporte o HTTP 502/503/504, con espera breve variable. No se reintentan errores de validación, sesión/permisos, inexistencia, limitación de frecuencia ni cuota diaria de D1.
- Las escrituras POST/PUT/DELETE pasan directamente una sola vez. Compras, regalos, mensajes y votos no se repiten automáticamente. El cambio de cuenta o una escritura separa las nuevas lecturas de las ya iniciadas.
- Cada consumidor puede cancelar su lectura sin cancelar a otro que comparte la misma respuesta. Se libera el puesto después de recibir el cuerpo de la respuesta, para limitar también descargas lentas.
- Las búsquedas fallidas de tarjetas de color esperan al menos 60 segundos. Antes podían repetirse en cada mutación del contador/chat.
- Preparación persistente adicional de historial, Casting, Frookies y Hunger: no repetir su DDL en cada petición. Se graba el marcador únicamente después del éxito; las reglas y estados de juego se conservan.
- /api/health identifica ahora el backend como versión 171 (V171-ESTABILIDAD), para distinguir una publicación efectiva del cambio de archivos estáticos.

Validación: 133 archivos de pruebas pasan. Nuevas pruebas cubren concurrencia, prioridades, lecturas compartidas, cancelación independiente, fallo de transporte, errores HTTP transitorios, cuota, permisos, cambio de cuenta y ausencia de reenvío de escrituras. En navegador local se provocó un HTTP 503 inicial para Blogs, Tiendas, Perfil y mensajes públicos: cargaron sin pulsar Reintentar. Correo cargó y Tiendas se comprobó a 320 px. No se incluye el servidor ni los datos de prueba en este ZIP. La revisión local no sustituye comprobar el despliegue real ni Safari físico.

No es una publicación realizada: debes desplegar el ZIP en tu cuenta Cloudflare. Ejecutar las dos órdenes por separado:

cd /Users/christianmonzonlorente/Downloads/Tengaged-V171
npx wrangler pages deploy . --project-name tengaged-reborns

Después comprobar /api/health (version 171), Blogs, perfil, Juegos, Correo y Tiendas. Si persiste el fallo, recoger los registros del despliegue con wrangler pages deployment tail --project-name tengaged-reborns --environment production: un fallo de proveedor, red o cuota no se puede resolver garantizando disponibilidad desde el código del navegador.
