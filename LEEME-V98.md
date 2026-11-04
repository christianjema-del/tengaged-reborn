# Tengaged V98 — Página de desafío según la grabación

Versión completa sobre V97, manteniendo los cambios anteriores y las partidas existentes.

## Publicar

Descomprime y, dentro de Tengaged-V98, ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No hay SQL manual ni reinicio de la base de datos.

## Referencia utilizada

Se inspeccionó la grabación adjunta de 54 segundos, incluyendo la pantalla inicial del juego Maze, la partida en marcha y la disposición de sus resultados. Se reproduce la composición de la página del desafío del vídeo:

- Columna izquierda con título de prueba, aviso amarillo y catálogo de minijuegos con las diez capturas reales ya existentes.
- Columna derecha con nombre del minijuego, botón amarillo Volver al juego e instrucciones dentro de un recuadro azul.
- Minijuego original centrado, con su propia pantalla START. Para el participante activo se carga la prueba oficial asignada a ese día; el catálogo es informativo y no permite sustituirla por otra.
- Proporción del tablero ajustada a la referencia y resultados inmediatamente debajo.
- Filas compactas de resultados, con el nombre y el texto «ha terminado la prueba con N puntos», o indicación de que aún no ha comenzado/está realizando la prueba. Se usan exclusivamente resultados guardados y se excluyen los expulsados.
- Encabezado de resultados visible desde el HTML, contador de pruebas terminadas, acceso directo y actualización manual y automática. Al recibirse la puntuación propia se oculta el tablero y se desplaza a los resultados.
- En móvil se priorizan juego y resultados, y el catálogo pasa debajo. Se conservan controles táctiles y el minijuego se ajusta al ancho disponible.

El vídeo corresponde a una prueba de Inmunidad de Survivor de la versión antigua de Tengaged. Esta página mantiene el nombre y las reglas de Casting: la duración real de las pruebas actuales (60 segundos, o 50 en Guitar), guardado mediante el puente de puntuación existente y pesos de nominación ya acordados. No se aplican los 192 segundos ni las variables agua/comida de aquel Survivor. Se mantienen el encabezado general y las secciones reales de Tengaged Reborn; no se recrean las barras del navegador ni del sistema operativo de la grabación.

## Estado observado en producción

Se comprobó que la página de desafío publicada con V97 ya devolvía veinte filas de resultados: bots con sus puntuaciones simuladas identificadas y usuarios aún pendientes. Esta revisión mejora la visibilidad inicial y reproduce la presentación compacta de la grabación. No se inventan resultados para usuarios ni se cambian sus puntuaciones.

## Verificación

63 archivos de pruebas superados, con comprobaciones dirigidas tras los últimos ajustes. Incluyen carga de la prueba oficial sin duplicar el reproductor, catálogo con diez imágenes, prueba/día correctos, participantes autorizados, resultados guardados, exclusión de expulsados, histórico por día, tabla/lista y desplazamiento tras guardar. Worker compilado y sintaxis/HTML verificados. No publicado desde este entorno ni verificado visualmente en un teléfono físico.
