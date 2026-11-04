# V147 · Avatares originales

Versión completa basada en V146. Conserva sus correcciones de juegos, premios, inventarios y recuperación de Casting. No reinicia partidas ni modifica cuentas o compras.

- Renderer unificado con 223 imágenes originales públicas de Regaged: cuatro cuerpos, 18 prendas, 11 ojos, 15 bocas, 22 pelos y ocho opciones de gafas, con sus variantes ajustadas a los dos primeros cuerpos.
- Lienzo único 200 × 230, colores aditivos que conservan el dibujo original y orden de capas fondo, cuerpo, ropa, boca, ojos, gafas y pelo.
- Sustituidas las aproximaciones vectoriales del editor y las vistas clásicas. Los bots locales también utilizan las capas originales.
- Editor organizado con cada rasgo junto a su color; paletas de referencia, selector de color personalizado y fondo. Vista previa, guardar y deshacer conservados.
- Se mantienen los ajustes de los diseños importados y el control de propiedad del armario. Las fotos completas ocultan el cuerpo y los rasgos y cubren el mismo marco sin franjas del fondo base.
- Se conserva el tamaño de los marcos de avatar de los juegos. Editor adaptado a ordenador y móvil.

Referencia: https://regaged.com/profile/avatar y su catálogo público de capas. Los nombres e índices guardados se conservan; ahora cada opción utiliza su imagen auténtica. No se copian sesiones ni datos privados del sitio de referencia.

Validación: 112 pruebas automáticas; compilación de Functions con Wrangler; editor comprobado en navegador a 1440, 1024, 768, 600, 390 y 320 píxeles sin desbordamiento horizontal. Comprobados ciclos de todos los rasgos, colores, guardar/deshacer y prueba de un diseño propio.

## Publicación

Descomprime la carpeta y ejecuta dentro de ella:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

Es necesario publicar esta versión para que los cambios aparezcan en la web. Este archivo no contiene credenciales de Cloudflare.
