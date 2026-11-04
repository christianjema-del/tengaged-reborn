# Tengaged V107 · Blogs

Actualización sobre V106, conservando Casting, Hunger, administración, avatares, notificaciones y rachas.

## Blogs

- Listado con novedades a la izquierda, tendencias y Top de hoy a la derecha, siguiendo la captura y las vistas públicas de Regaged examinadas.
- Avatares, tarjeta de color equipada, autor, fecha, corazón con puntos, contador de comentarios y posición actual en el Top.
- Top con entradas de las últimas 24 horas y votación de entradas abierta durante tres días. Datos y posiciones reales, sin publicaciones de ejemplo en producción.
- Tendencias por menciones @usuario a usuarios existentes en las entradas de las últimas 24 horas (se examinan las 500 entradas más recientes).
- Entrada completa con columna del autor: avatar, rótulo «mi blog» y sus últimas publicaciones. Texto, votos verdes/rojos, puntos, plazo de votación y comentarios a la derecha.
- Votos positivos y negativos de comentarios, con autenticación, prohibición de voto propio, protección de origen, un voto por usuario y posibilidad de retirarlo.
- Actualizar, Mi blog, Escribir un blog, búsqueda, páginas y blogs anteriores; conserva publicación y eliminación con permisos existentes.
- Textos de controles en castellano. Distribución de una columna en pantallas pequeñas.
- Las bases de datos existentes se conservan. Se añade únicamente una tabla para votos de comentarios de blog.

## Comprobación

75 pruebas automatizadas y compilación Worker. Listado, entrada, formularios, voto/retirada de voto y comentarios comprobados contra una base local. Chromium a 1440, 390 y 320 píxeles, sin desbordamiento horizontal. Referencia visual examinada en directo en https://regaged.com/blogs y una entrada con comentarios. No se han publicado entradas ni realizado cambios en cuentas reales. No implica identidad píxel a píxel ni prueba física de Safari/iPhone.

## Publicar

```bash
cd ~/Downloads/Tengaged-V107
npx wrangler pages deploy . --project-name tengaged-reborns
```
