V146 · Frookies y Casting

Basada en V145. Mantiene premios V144 y compatibilidad del reproductor V145.

Frookies: puntuaciones privadas también en API e historial; las nuevas pruebas no alimentan el ranking público general. Cada ronda recoge la prueba para el PoV siguiente. Primera ronda sin prueba anterior: sorteo estable de entrada. Se puede jugar durante nominación, veto, sustitución y votación; un intento iniciado dispone de sus segundos completos. Los segundos siguen en 150 menos cinco por PoV anterior, con el límite existente. No se reinician partidas, intentos ni calendarios al instalar.

Nominar al sustituto y votar Ganador se hace con botones bajo los avatares autorizados; se ocultan sus cuadros rojos. Vetar selecciona un nominado; Guardar sin selección no usa PoV. Las decisiones guardadas de HoH/PoV y todos los votos de expulsión completos se aplican al siguiente cambio de minuto. Si alguien no decide, se mantienen los plazos y decisiones automáticas. El jurado conserva sus cuatro horas.

Casting #4: corrección administrativa única, solicitada por el propietario. Ya estaba terminado. Se vuelven a incluir en la clasificación ponderada todos los usuarios reales con mensajes registrados en esa partida, incluido AntonioJ. Se aplica la fórmula existente: llaves 50%, rendimiento 25%, tics 25%. El resto conserva su orden relativo; puestos únicos 1–20. No se reabre el juego ni se borra chat, recursos o pruebas. Se guarda el estado original en casting_recovery146. Se corrige el historial y el ganador; se abonan únicamente diferencias positivas de premios una vez, sin retirar saldos ya pagados ni sumar otra partida jugada. Se mantiene la norma de salud por chat para el resto de partidas, sin inmunidad por ser una cuenta real.

Casting finalizado: nombre, tiempo real desde la última conexión (0 min si conectado), puesto. Avatar ganador en color y resto atenuados.

Publicación: descomprimir y ejecutar npx wrangler pages deploy . --project-name tengaged-reborns desde la carpeta Tengaged-V146. La corrección de #4 se ejecuta una sola vez al consultarlo con esta versión; hasta desplegar no altera producción.

Validación: 109 pruebas automatizadas superadas; compilación de Functions correcta. Navegador local a 1440, 768, 390, 320 y 844 píxeles: botones de sustitución/veto/jurado, guardar con y sin veto, tiempos de conexión y puestos completos, ausencia de desbordamiento, etiquetas y color de botones correctos. Ruffle real cargado durante votación a 1440 y 390 píxeles, sin revelar la puntuación de otro participante.
