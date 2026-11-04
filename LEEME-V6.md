# V6 · Perfiles y comentarios con acabado clásico

Paquete completo: conserva D1, partidas, usuarios, amistades y mensajes existentes. No borres tu base de datos.

## Publicar
Descomprime en Descargas. En Terminal:

```
cd ~/Downloads/Tengaged-Reborn-V6-PERFILES-Y-COMENTARIOS
ls friends.js game-chat.js wrangler.toml
npx wrangler pages deploy . --project-name tengaged-reborns
```

Después recarga con ⌘ + Mayús + R. Publica desde V6; ejecutar Wrangler desde V5 vuelve a publicar los archivos anteriores.

## Cambios
Perfil compacto inspirado en la referencia visual de Regaged: avatar, cabecera, nivel de color, estadísticas, biografía amarilla, juegos en círculos con sus fechas, accesos a editar perfil/avatar, lista de amigos de cuatro columnas y actividad. Se retira el bloque duplicado de estadísticas de la barra lateral.

Comentarios de Casting y Hunger con pestaña de comentarios públicos, formulario arriba, fondo amarillo suave, contador de caracteres, cabeceras azul claro, tiempos relativos y últimos mensajes primero. Paginación de 20 mensajes para consultar el historial sin perder mensajes antiguos. Actualización cada cuatro segundos. No hay pestañas privadas simuladas.

Se conservan solicitudes de amistad, chats separados por partida, validación del servidor y bloqueo de escritura para eliminados. Los visitantes y eliminados pueden leer. Las partidas y amistades reales no se modifican al instalar.

## Validación
Pruebas de integración de amistades, permisos de chat, eliminados, aislamiento, frecuencia, paginación y orden; regresión de los diez minijuegos. Inspección visual de perfil y Casting en escritorio y a 390 px, edición de perfil y envío de comentario en un entorno aislado con datos de prueba. El paquete no publica automáticamente en Cloudflare.
