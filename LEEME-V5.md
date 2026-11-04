# Tengaged Reborn V5 · Amigos y chat

Esta versión completa incluye todos los archivos de V4 y conserva la configuración de D1 existente. No borres la base de datos.

## Publicar

Descomprime el ZIP, abre Terminal dentro de la carpeta que contiene `wrangler.toml`, `classic.css`, `friends.js` y `game-chat.js` y ejecuta:

```
npx wrangler pages deploy . --project-name tengaged-reborns
```

Después recarga la página con ⌘ + Mayús + R.

## Perfiles

Se sustituye «Jugadores de la comunidad» por los amigos reales de cada usuario, con contador, avatares y enlaces a sus perfiles. Las solicitudes se envían desde el perfil del otro usuario y se aceptan o rechazan desde el propio perfil. Una solicitud pendiente no aparece como amistad aceptada. Puedes cancelar solicitudes y eliminar amistades. No se generan amigos ficticios. Las solicitudes recibidas solo se muestran a su destinatario.

## Chat

Casting y Hunger Games tienen conversaciones públicas separadas por partida o edición. Los participantes no eliminados pueden escribir. Los eliminados y espectadores solo pueden leer. El servidor valida esta restricción en cada envío; no basta con habilitar un botón desde el navegador. Las partidas finalizadas conservan su conversación; los eliminados siguen sin poder escribir.

Los mensajes se guardan en D1 y se consultan automáticamente cada cuatro segundos con la pestaña visible. Se muestran páginas de 20 mensajes, con los más recientes primero, con avatar, usuario y fecha. Máximo 500 caracteres y una publicación cada tres segundos por usuario. Los mensajes se muestran como texto, sin ejecutar HTML. Los borradores se conservan cuando un envío falla.

Las tablas de amistades y mensajes se crean automáticamente, de forma adicional, al utilizar estas funciones. No se necesita una migración manual ni reiniciar partidas.

## Comprobaciones

Pruebas de integración con SQLite y adaptador D1: solicitudes, consentimiento del destinatario, rechazo de autoamistad, eliminación, aislamiento entre chats, sesión requerida, límite de frecuencia y bloqueo de escritura de eliminados en Casting y Hunger. También pasan las pruebas existentes de los diez minijuegos. Estos cambios todavía deben publicarse con Wrangler; el ZIP no publica automáticamente.
