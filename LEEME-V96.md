# Tengaged V96 — Corrección de carga y presentación de Casting

Actualización completa sobre V95, conservando las partidas y D1 existentes.

## Publicar

Descomprime y, dentro de Tengaged-V96, ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borres la base ni reinicies los juegos.

## Fallo observado y corrección

Se reprodujo en la web publicada el estado de carga de la captura 23.07.14: el chat aparecía mientras el reparto, recursos y cabecera seguían pendientes. Tras llegar la respuesta, los veinte jugadores y el diseño aparecieron. La V95 activaba el diseño diario mediante JavaScript después de recibir la partida y esperaba la promesa de sesión de la cabecera para solicitarla.

La V96 aplica el diseño desde el HTML, carga directamente la hoja de referencia y precarga los gráficos de pestañas y recursos. Muestra veinte posiciones de carga mientras llegan los jugadores. La petición de Casting arranca sin esperar a la cabecera; mantiene la autenticación del servidor. Solo se marca el dibujo como completado tras renderizarlo correctamente, permitiendo recuperarse de un fallo transitorio. Los errores de conexión se muestran y el sondeo vuelve a intentarlo.

## Presentación y funciones conservadas

Cabecera azul degradada, título y número real, reparto de diez por fila en escritorio, cinco en móvil, recursos a la derecha, pestañas públicas/privadas, controles de votos en la cabecera de cada comentario, panel de nominación y normas/blogs/historia. Se ha ajustado el título para evitar que se pise con el número y retirado el recuadro de fondo sobrante de recursos.

Los comentarios de bienvenida antiguos ahora tienen puntuación y ✓/✕ igual que los comentarios nuevos. Se conserva la restricción de voto propio y de participantes; las reacciones de bienvenida están separadas por tipo e ID de partida y no mezclan Casting con Hunger.

Los espectadores ven vacíos los valores bajo llave, manzana y tick. Para participantes se muestran llaves, salud y checks reales. El botón Desafío abre la página independiente del minijuego diario con su resultado y enlace de regreso. No se han reiniciado puntuaciones, avatares, inventarios ni comentarios.

## Verificación

61 archivos de pruebas superados, con comprobaciones adicionales de arranque antes de resolverse la sesión, diseño inicial y veinte posiciones, reintento tras fallo de dibujo, votos en bienvenidas y aislamiento entre salas. Worker compilado y sintaxis/HTML verificados. La web publicada V95 se inspeccionó en navegador; V96 todavía no está desplegada y no se ha probado en un teléfono físico.

## Contraste con Regaged

En esta revisión se pudo abrir la partida cmvoevwe00h5bkaa5wnc0h8fo de Regaged y contrastar en navegador el reparto de veinte, los recursos propios, las pestañas, los controles de votos en la cabecera de los comentarios, el aviso de nominados y la columna lateral. Se ajustó el signo de interrogación rojo bajo los nominados. Se mantienen las diferencias expresamente solicitadas: bots a 0 min, recursos vacíos para espectadores y botón Desafío hacia una página propia. No se han trasladado a esta actualización cambios económicos o de reglas de Regaged que contradigan las decisiones anteriores del proyecto.
