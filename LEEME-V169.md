# V169 · Shops Game clásico

El primer destino de Tiendas (Tiendas de jugadores) reproduce la estructura del archivo del 27 de julio de 2013: columna de 180 px, logotipo original de 154 × 154 servido localmente, contador D/H/M/S actualizado cada segundo, invitación a crear tienda, blogs reales con #shops, escaparates de dos columnas, productos de 50 × 50, precios y vendido, valor acumulado/valor de ronda, últimos diez regalos y últimos diez compradores.

La imagen personal de cada tienda se puede subir o retirar desde Mi tienda / pujar (PNG/JPG/WebP de hasta 256 KB), con validación de formato y permisos del propietario. Cuando no existe se muestra un escaparate genérico. Se usan las tiendas, diseños y operaciones reales de Reborn; no se importan tiendas, compras ni cuentas históricas. No se promete equivalencia de comportamientos internos que el archivo público no permite observar.

Se conservan la cabecera común, tres destinos de tiendas, tarjetas, subastas, ruleta, compras/regalos atómicos, inventarios, gestión y pujas. No se cambian las reglas económicas: cinco escaparates por ronda de 48 horas. Las tiendas inactivas se pueden consultar en un desplegable pero no venden. Las imágenes no se estiran ni se recortan y los textos largos se ajustan. En móvil se apilan las columnas; se comprobó el listado a 320 px y una tienda a 390 px sin desbordamiento horizontal. La emulación de anchura no sustituye una prueba en Safari físico.

Nuevo alias /shopping_game → /shops?tab=users. No se modifican Hunger, Casting ni sus datos.

Validación: 130 archivos de pruebas pasan, incluidas compras/regalos, permisos, saldos, totales reales, visibilidad pública, logos y exclusión de diseños retirados. Revisión visual en navegador de escritorio y anchuras móviles. Los datos de prueba y el servidor de revisión están excluidos del ZIP.

Publicación, ejecutando cada orden por separado:

cd /Users/christianmonzonlorente/Downloads/Tengaged-V169
npx wrangler pages deploy . --project-name tengaged-reborns

Abrir Tiendas → Tiendas de jugadores. La base de datos conserva su vínculo actual y la tabla de imágenes se crea automáticamente. Este ZIP está preparado; su publicación en tu Cloudflare requiere ejecutar el comando anterior.
