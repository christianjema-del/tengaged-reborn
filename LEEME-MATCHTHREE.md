> Nota histórica de V3. La versión actual se describe en LEEME-V4.md.

# Match Three — corrección del identificador MATCH3

El SWF original declara `type = MATCH3`. El servidor anterior solo aceptaba
MATCHTHREE y devolvía HTTP 400 «Unknown game», por lo que no arrancaba el tablero.
Ahora se acepta MATCH3 como alias de MATCHTHREE.

Solo cambia functions/microgames.js y esta nota. Se conserva el modo de pruebas;
las puntuaciones siguen sin verificarse y no afectan a las partidas competitivas.

Validación: se reproduce el rechazo anterior con una solicitud cifrada MATCH3;
la versión corregida devuelve HTTP 200 con points=0 y timeleft=60. Se comprueban
las respuestas de los otros nueve juegos y el guardado sin registro de puntos.
Pendiente: confirmar visualmente que el tablero arranca en Ruffle tras desplegar.

Publicar desde la carpeta que contiene wrangler.toml:

npx wrangler pages deploy . --project-name tengaged-reborns

Cabecera de diagnóstico: X-Tengaged-Bridge: matchthree-type-fix-v3.
