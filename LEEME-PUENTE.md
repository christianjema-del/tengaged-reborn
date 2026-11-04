# Puente experimental para minijuegos Flash

Se incorpora `functions/microgames.js` para atender solicitudes GET codificadas del SWF mediante `/microgames?data=...`.

**No es una versión terminada:** la respuesta de inicio es una HIPÓTESIS que necesita comprobación en Safari. Se ha confirmado la decodificación de una solicitud real de `requestSaveGameData` y de una respuesta del servidor; **no se dispone de una respuesta real de `requestGameData`**. Si Guitar sigue en «Connecting please wait», el formato deberá corregirse. NO se registran puntuaciones competitivas ni se alteran inmunidades o el historial.

Para diagnosticar: abre Red en Safari, filtra `microgames` y confirma si aparece respuesta HTTP 200 con cabecera `X-Tengaged-Bridge: experimental-start`. Evita compartir cookies y sesiones. Antes de publicar en producción, recomienda probar en un proyecto Pages separado porque la ruta nueva queda accesible públicamente.
