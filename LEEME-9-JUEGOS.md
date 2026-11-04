# Prueba de arranque de los otros nueve SWF originales

Se mantiene Guitar V2 como referencia, y el servicio `/microgames` responde a cada `type` permitido. Words y Wof reciben `items` de prueba con `question` y `answer`; los otros juegos reciben `points` y `timeleft`, como Guitar.

**No se ha verificado que los nueve juegos arranquen.** Podrían requerir estructuras o campos adicionales. Tampoco se validan puntuaciones ni se alteran inmunidades.

Publica en un proyecto de Cloudflare Pages de pruebas si es posible. Para verificar, entra al modo demostración del Casting 1, prueba cada juego y anota si comienza o permanece en Connecting. En la pestaña Red del inspector, el encabezado `X-Tengaged-Game` permite comprobar el juego solicitado.
