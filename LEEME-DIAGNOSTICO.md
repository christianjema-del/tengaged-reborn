# Diagnóstico de juegos Flash originales — 24/10/2026

## Cambios realizados
- Se mantienen los diez SWF originales.
- Ruffle recibe las FlashVars `context=game`, `contextId=0` (pruebas), `subcontext=regaged`, `subcontextId=0`, como se observó en `embed.js`.
- Nuevo estado visible que explica cuándo el SWF se cargó sin poder iniciar una partida.
- URLs versionadas para reducir la carga de JavaScript anterior de la caché.

## Lo que sigue pendiente (importante)
Los juegos hacen solicitudes propias a `/microgames` con mensajes codificados. El servidor de Regaged sabe interpretar esos mensajes; la base de datos de Tengaged Reborn no. **Esta actualización NO soluciona todavía la conexión ni valida resultados.** No se deben usar las puntuaciones manuales para clasificaciones reales.

Para dar soporte completo será necesario obtener la especificación del protocolo y ejemplos de solicitudes/respuestas **sin datos de sesión**, o el código autorizado del backend. No se deben reenviar cookies ni llamadas privadas desde el dominio de Regaged. Si el juego sigue mostrando «Connecting please wait», el diagnóstico será correcto: falta el servicio de inicio.

## Publicación
En la carpeta descomprimida ejecuta: `bash PUBLICAR.command`. Después abre la nueva URL del despliegue, nunca una versión antigua.
