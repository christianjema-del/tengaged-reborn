# V101 · Avatares, tienda de tarjetas y revisión general

## Cambios
- Carga compartida de avatares en perfiles, Casting, Hunger, portada, clasificación, amigos y comunidad. Cada retrato se decodifica una vez a PNG en el navegador; se reutiliza durante un minuto y hay un máximo de cuatro descargas simultáneas. No se cambian las piezas equipadas.
- Recuperación al volver la conexión, compatibilidad SVG/PNG/JPEG/WebP y protección frente a capas dañadas. El editor sigue abriendo si falta una prenda y permite retirarla explícitamente, sin borrar la selección por su cuenta.
- Los retratos públicos no vuelven a preparar el catálogo de la tienda en cada carga.
- Solicitudes con tiempo máximo que incluye el cuerpo de la respuesta en chats, juegos, portada, tiendas, mafias, amigos e inscripciones. Las compras, votos y acciones nunca se repiten automáticamente.
- Cornucopia móvil en dos filas de cinco plazas. Se conservan las mejoras y los diseños de Cristi de V100.
- Tienda de tarjetas reproducida a partir de https://regaged.com/shop/colors: 19 niveles más blanco, diez GIF originales, colores exactos, banner original, niveles de poder, requisitos y precios. Tres columnas en PC y dos en móvil. Se utiliza T$, la moneda de Tengaged Reborn.
- Compra por orden de niveles, equipamiento al comprar, retorno gratuito a blanco, protección contra doble cobro y validación de origen. Las tarjetas ya adquiridas se conservan.
- La tarjeta del perfil utiliza los mismos gráficos originales que la tienda.

## Comprobaciones
68 archivos de pruebas automatizadas, compilación del Worker, 30 páginas HTML con sus recursos locales y ausencia de identificadores duplicados.
31 rutas revisadas en Chromium a 1440, 1024, 768, 390 y 320 píxeles: 155 vistas, sin errores JavaScript, imágenes rotas o desbordamiento general.
Pruebas adicionales de menús, subapartados de tiendas, tarjetas, compra y equipamiento en base de datos local, pestañas de chat, recuperación de avatares, cuatro cargas simultáneas y editor con prenda ausente.
La tienda de tarjetas se ha comprobado también en esos cinco tamaños, con y sin sesión.
Las pruebas móviles son emulación de pantalla/táctil en Chromium; no constituyen una prueba física en todos los teléfonos ni en Safari real.
No se han enviado mensajes, realizado compras o alterado partidas en la web publicada durante estas pruebas.

## Publicar
Descomprime el ZIP, abre Terminal y ejecuta:
```bash
cd ~/Downloads/Tengaged-V101
npx wrangler pages deploy . --project-name tengaged-reborns
```
No borres ni recrees la base de datos D1. Esta entrega no está publicada desde ChatGPT.
Después abre Tiendas → Tienda de tarjetas. Para los diseños de Cristi, entra como Cristi y abre Avatar → Armario.
