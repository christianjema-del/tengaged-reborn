# V159 — Blogs y Diseños: presentación archivada y puntos de publicación

Incluye íntegra V158 y todos los cambios anteriores.

## Presentación

Referencia consultada: https://web.archive.org/web/20150311021510/http://www.tengaged.es/posts y su sección /design. Se recuperaron el HTML y las hojas de estilo originales para medir distribución y componentes. La implementación usa datos actuales de Tengaged Reborn y conserva sus funciones de publicación, comentarios, búsqueda, tiendas y avatares.

- Columnas en proporción 510 / 380 con separación de 30 px en el ancho de referencia.
- Filas de blogs con avatares de 40 × 46 px; títulos y metadatos sobre franjas claras, corazones/puntos a la derecha y número de comentarios debajo.
- Recientes, temas por hashtag, usuarios más mencionados y Top de hoy. Los temas y usuarios provienen de las publicaciones actuales.
- Diseños con vista previa de 60 × 60 px, recientes, más votados y enlace a la siguiente subasta.
- Quince entradas por página y paginación numérica. El Top de diseños se calcula independientemente de la página de recientes.
- Tarjetas GIF con la T conservadas. En móvil las columnas se apilan, los textos largos se ajustan y la paginación ofrece controles táctiles.

## Puntos iniciales

Cada NUEVO blog y cada NUEVO diseño empieza con la potencia de la tarjeta equipada al publicar. El servidor lee la tarjeta y guarda el valor dentro de la misma operación de creación; no acepta un valor enviado por el navegador.

Se mantiene la tabla vigente: Blanco 1, Amarillo 2, Naranja 3, Verde claro 4, Verde 5, Azul 6, Morado 7, Rojo 8, Marrón 9, Negro 10, Plata 11, Oro 12, Cielo 15, Sangre 20, TV Star 30, Ultra Gold 32, Titanio 34, Holofoil 36, Prisma 38 y Diamante 40. Por tanto, TV Star comienza con 30 puntos según vuestro catálogo actual.

Los puntos iniciales permanecen aunque se cambie de tarjeta o se edite el diseño; actualizar la página no vuelve a sumarlos. Los votos ajenos se suman o restan con su potencia habitual. El autor sigue sin poder votarse a sí mismo. Las clasificaciones y la selección de diseños para subastas incluyen esos puntos.

Estos son puntos del contenido: no conceden karma ni T$. Las publicaciones antiguas conservan sus puntuaciones. Los diseños privados importados y los regalos de armario no reciben puntuación nueva por esta actualización.

## Publicar

Descomprime y ejecuta desde la carpeta Tengaged-V159:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No hace falta ejecutar SQL manualmente. Las columnas de puntos iniciales se añaden al inicializar el servicio tras publicar.

## Verificación

133 pruebas automatizadas correctas, incluidas las veinte tarjetas en blogs y diseños, manipulación de puntuación rechazada, estabilidad al editar/cambiar tarjeta/refrescar, datos antiguos, votos externos, autor sin voto, orden de destacados, temas, paginación sin entradas duplicadas y saldos intactos. Se conservan las pruebas de Frookies, Hunger, Casting, economía, perfiles y avatares.

Listados y detalles comprobados en Chromium a 1440, 1024, 768, 390 y 320 px: tamaños de imágenes, enlaces a página 2, tarjetas GIF, texto de puntuación inicial, votos del autor deshabilitados y ausencia de desbordamiento. No se ha probado Safari real ni todas las sesiones privadas en producción.
