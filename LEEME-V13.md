# V13 — Minijuegos originales de Casting

- Las 10 tarjetas siguen abriendo `minijuego.html?juego=...`, pero ahora la pantalla incrusta los SWF originales mediante `original-flash.js` y Ruffle, el mismo sistema de Casting.
- Se reutiliza `/microgames` con `subcontext=minigame`: al pedir datos se abre un intento vinculado a la sesión; cuando el SWF hace `requestSaveGameData` se valida el código de intento y se guarda el resultado en D1 (`minigame_scores`).
- La tabla de mejores marcas se actualiza automáticamente cada cinco segundos.
- No se ha modificado la estética general ni se han introducido versiones HTML5 alternativas.

**Limitaciones importantes:** Los SWF y su comunicación mediante Ruffle requieren pruebas reales en navegador. Algunos pueden no completar la comunicación con `/microgames`, en cuyo caso no se guardará una puntuación. El protocolo de inicio del puente Flash sigue siendo experimental. La puntuación que envía el cliente no dispone todavía de validación anti-trampas completa. El Ruffle actual se carga desde un CDN externo.
