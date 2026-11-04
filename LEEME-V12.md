# Tengaged Reborn V12 · Minijuegos jugables y rankings

- Las diez tarjetas de Minijuegos enlazan ahora a `/minijuego.html?juego=...`.
- Cada minijuego se ejecuta en HTML5 con el módulo original del proyecto (`minigames.js`). Casting y sus Flash no se han modificado.
- API `/api/minigame-ranking`: consulta de clasificación por prueba y guardado de mejor puntuación con sesión, token de intento de uso único y plazo de 30 minutos.
- D1 crea de forma automática las tablas `minigame_scores` y `minigame_attempts` al consultar/jugar; no hace falta migración manual.
- La lista muestra hasta 50 usuarios con su mejor puntuación. Solo usuarios autenticados pueden registrar puntos.
- Importante: la validación de puntos de los minijuegos HTML5 ocurre en el navegador. El token evita duplicados y puntuaciones fuera del rango 0–100, pero **no es una solución antitrampas robusta**. Para una competición con premios habría que verificar la partida desde el servidor.
- Las preguntas de Wheel, Numbers y Words son variantes HTML5 de práctica, no los tableros Flash de Regaged.
- Para publicar, desde la carpeta extraída: `npx wrangler pages deploy . --project-name tengaged-reborns`.
