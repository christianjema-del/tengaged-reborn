# Tengaged V106 · Objetos y votos

## Casting

- Espera mínima de 30 minutos al comenzar cada día de 12 horas, incluido el primero.
- Máximo de 3 llaves y 3 manzanas públicas por día. Cuentan las apariciones, aunque nadie recoja el objeto o caduque.
- Tras el primer objeto, debe transcurrir al menos una hora y enviarse 12 mensajes públicos nuevos desde la última aparición para permitir otra. Son mensajes guardados por el servidor: abrir páginas, votos, ticks, mensajes privados y avisos automáticos no cuentan.
- Sin apariciones retroactivas ni ráfagas si nadie ha visitado la partida. Los contadores diarios sobreviven a la caducidad de los avisos y se reinician al cambiar de día.
- En partidas actualizadas desde versiones que descartaban los avisos antiguos, se reserva conservadoramente el cupo de apariciones históricas cuyo tipo ya no puede recuperarse. Puede haber menos objetos durante lo que queda de ese día; al siguiente se aplica el cupo nuevo completo.
- Los ticks se recalculan con los votos verdes de otras personas a los comentarios del jugador en ese Casting. Un verde suma uno; quitarlo o cambiarlo a rojo retira ese tick. Los rojos no restan ticks adicionales.
- El icono naranja deja de ser un botón y el servidor rechaza la acción manual de sumar ticks. Los ticks anteriores de pulsaciones se sustituyen por el recuento real de votos; no se borran llaves, salud, paquetes existentes ni saldos.
- Los ticks reales se utilizan para la clasificación y para el tiempo extra del desafío. Un intento ya iniciado mantiene su duración fijada.
- Los hitos de paquetes privados conservan su recompensa cada 3000 ticks; retirar y restaurar votos no permite cobrar de nuevo el mismo hito. El límite 3+3 corresponde a objetos públicos, no a estos paquetes privados.

## Comentarios de todos los juegos

Puntos primero, botón ✓ verde y botón ✕ rojo. Los controles deshabilitados conservan el color con menor opacidad. Casting muestra también los controles y tiempos relativos en castellano.

## Validación y publicación

Pruebas automatizadas y compilación Worker. Comprobaciones de Chromium local a 1440, 390 y 320 píxeles; votos reales contra base de datos local, tick naranja sin botón y colores comprobados en Casting y Hunger. No se ha modificado producción ni se han realizado pruebas físicas en Safari/iPhone.

```bash
cd ~/Downloads/Tengaged-V106
npx wrangler pages deploy . --project-name tengaged-reborns
```
