# V14 — Un solo lanzador para Casting y Minijuegos

- `casting-minigame-launcher.js` es el punto de entrada único para los diez minijuegos.
- `casting-game.js` y `minijuego-page.js` importan la misma función, que abre los mismos 10 SWF de `/original-games/swf/`.
- Se eliminó la selección de implementaciones alternativas en Minijuegos y se cambió la versión de los scripts para evitar caché de V12/V13.
- No se han cambiado CSS, encabezados ni estética general.
- **OJO**: el comportamiento de guardar puntuaciones en rankings aún depende de que cada SWF se comunique correctamente con `/microgames`; esto no está verificado mediante prueba real de navegador.
- En modo Minijuegos el servidor distingue el contexto `minigame` del contexto `casting` para no alterar la partida de Casting.
- Para probar: abrir un casting en fase de inmunidad y comparar el juego de la misma categoría con su ficha en Minijuegos.
