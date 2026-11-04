# Tengaged V120 · YouTube y Giphy dentro de los mensajes

Actualización completa sobre V119. Conserva los cambios anteriores.

Los enlaces reconocidos de YouTube y Giphy se sustituyen visualmente por su vídeo o GIF en chats de juegos, mensajes privados, blogs y comentarios, correo y otros contenidos de texto de las secciones. Se conserva el texto que acompaña al enlace y un acceso alternativo con el nombre del proveedor, sin mostrar la URL original.

Se admiten enlaces normales de YouTube, youtu.be, Shorts, directos, enlaces embed y las marcas de tiempo habituales. Para Giphy, fichas de GIF/sticker, enlaces embed y archivos GIF/WebP de sus dominios multimedia. Otros dominios y enlaces que no identifican contenido compatible conservan su texto; no se insertan páginas externas arbitrarias.

No se cambia el contenido guardado en la base de datos, los borradores ni los permisos de lectura. No se interpreta HTML escrito por usuarios. Los destinos de los reproductores se generan con una lista cerrada de proveedores e identificadores validados. Los vídeos no se reproducen automáticamente y usan YouTube sin cookies. Los vídeos con restricciones de inserción y los contenidos retirados dependen del proveedor; el acceso alternativo permite abrirlos allí cuando esté disponible.

Diseño adaptable a PC y teléfono, carga diferida y títulos de accesibilidad.

83 pruebas automatizadas superadas y Worker compilado. Pruebas locales del chat y del detalle de blog a 1440, 390 y 320 píxeles: reproductores generados, marcas de tiempo, texto seguro, ausencia de desbordamiento, GIF añadido dinámicamente y borrador conservado. Las respuestas de los reproductores externos se sustituyeron por fixtures durante esas pruebas: no se afirma que todos los vídeos o GIFs externos permitan reproducirse. No publicado desde este chat.

```bash
cd ~/Downloads/Tengaged-V120
npx wrangler pages deploy . --project-name tengaged-reborns
```
