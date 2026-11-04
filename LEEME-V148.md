# V148 · Fotos completas, tarjetas T y partidas reales

Versión completa basada en V147. Conserva las 223 capas originales y los cambios anteriores. No vuelve a aplicar el recálculo de premios ni modifica karma o T$.

## Armarios

- Peach: primera imagen recibida, princesa con corona y castillo.
- Cristi: segunda imagen recibida, chica con orejas de gato y jardín.
- DaisyJane: tercera imagen recibida, chica rubia con camiseta rosa.

Las imágenes originales se conservan sin retoque. Se añaden a sus armarios como regalos privados sin coste, sin equiparlas automáticamente y sin duplicarlas al repetir la inicialización. Cada propietaria puede probar la pieza y pulsar Guardar cambios.

Al equipar una de estas fotos se ocultan todas las capas del avatar predeterminado. El lienzo permanece en 200 × 230. Las fotos cubren los marcos existentes de perfil y juegos; las dimensiones de esos marcos no cambian. Al quitar la foto vuelven a verse las piezas anteriores. Otros usuarios no pueden equipar estos regalos sin poseerlos.

## Perfil

- Tarjetas avanzadas con T vectorial en lugar de R, conservando las texturas animadas y los colores de los niveles. Catálogo compartido de tienda y perfiles actualizado.
- Posición junto al karma con rectángulo amarillo, texto negro y ordinal: 12º.
- Etiqueta Jugado: seguida del número de partidas reales, incluidas inscripciones aún sin comenzar, activas y finalizadas.
- El contador usa las membresías y el historial completo, sin límite de 30/60 entradas y sin contar dos veces una partida presente en el historial y en los estados de juego. No depende de cuántos premios se hayan entregado.

## Comprobaciones

115 pruebas superadas, incluida la equipación real mediante la API de las tres propietarias, permisos, ausencia de cargos y duplicados, ocultación de capas, cómputo de inscripciones/archivos y compatibilidad con instalaciones antiguas.

Perfiles comprobados en navegador a 1440, 768, 390 y 320 píxeles, sin desbordamiento horizontal. Diez tarjetas gráficas cargadas correctamente. Functions compiladas con Wrangler.

## Publicar

Dentro de esta carpeta:

npx wrangler pages deploy . --project-name tengaged-reborns

La web incorporará estos cambios después del despliegue. Las nuevas piezas se incorporan al inicializar el catálogo/armario. No requiere ejecutar otro SQL de premios.
