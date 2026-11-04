# Tengaged V94 — Casting, comentarios y conexiones

Actualización completa sobre V93. Conserva el botón exclusivo de admin1 para completar con bots, la gestión de diseños y los armarios de Cristi/admin1.

## Publicar

Descomprime y ejecuta dentro de Tengaged-V94:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Conserva D1. La tabla de votos se crea automáticamente; no hay que ejecutar SQL ni reiniciar partidas.

## Cambios

- Chat público en Casting y Hunger con actualización cada cinco segundos cuando la página está visible y actualización al regresar a la pestaña. Conserva el borrador y la página de comentarios elegida.
- Positivo y negativo en comentarios reales: un voto por usuario y comentario, cambio de signo y retirada pulsando de nuevo el voto activo. Los resultados persisten al recargar y se ven por todos. Los eventos automáticos y mensajes de bienvenida no reciben votos.
- Solo participantes activos pueden comentar y votar. No se permite votar mensajes propios. Eliminados, espectadores y partidas cerradas conservan lectura. Los votos no alteran llaves, checks, minijuegos ni clasificación.
- Tiempos desde la última conexión en los participantes de Casting y en las etiquetas de jugadores de Hunger (reparto y Cornucopia incluidos). Los bots muestran siempre 0 min. Para humanos se mantienen minutos, horas y días. Los tiempos desconocidos muestran —.
- Casting: comentarios compactos, separación punteada, contenido con saltos de línea, botones +/− con estado seleccionado, nombres de bots ajustados y adaptación del chat a móvil. Se mantienen los recursos y gráficos locales de la referencia ya incorporados, veinte plazas, pruebas originales y privados separados de públicos.
- Botones de voto con foco visible y área táctil de 44 px en pantallas táctiles; entrada de texto de 16 px en móvil.

La URL antigua de la partida de Regaged no estuvo accesible para la consulta actual. No se afirma igualdad visual exacta con una página que no se pudo inspeccionar; se conserva la base visual de las capturas anteriores. No se cambian las reglas aceptadas por el usuario por diferencias posteriores en la FAQ de Regaged.

## Verificación

59 archivos de pruebas automatizadas superados, más comprobaciones dirigidas tras los últimos ajustes: persistencia y sustitución/retirada de votos, autorización y bots a 0 min en las interfaces. Worker compilado, sintaxis e IDs HTML verificados. No publicado desde este entorno ni verificado en un teléfono físico.
