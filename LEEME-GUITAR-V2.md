# Guitar SWF · protocolo mínimo de inicio (experimental)

Inspección del SWF original `Guitar.swf` (Flash 9, CWS descomprimido): incluye `requestGameData`, `gameDataReceived`, `startGame`, `points`, `timeleft`, `requestSaveGameData`, `SongTrack` y `GuitarSong`. Estos nombres están presentes; **su sola presencia no demuestra el contrato íntegro ni asegura que el juego arranque**.

Se ha sustituido la respuesta inventada del servidor por `{error:0, header:{code:<UUID>}, data:{points:0,timeleft:50}}`, codificada con el mismo esquema RC4 ya implementado. La cabecera se genera por solicitud y la puntuación no se guarda.

## Prueba

1. Desplegar preferiblemente en un proyecto Cloudflare Pages de pruebas.
2. Entrar a Casting 1, modo de prueba, Guitar.
3. Si persiste Connecting, abrir Inspector → Red → `microgames`; comprobar código HTTP y la cabecera `X-Tengaged-Bridge: guitar-minimal-start-v2`.
4. No compartir cookies ni parámetros `data` completos: pueden contener identificadores.

**No se ha podido confirmar la ejecución completa en Safari** y no se habilitan clasificaciones ni inmunidades.
