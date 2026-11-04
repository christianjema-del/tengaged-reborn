# V83 · Manzanas y fluidez

Paquete completo sobre V82. Conserva administración, sanciones, tarjetas, Hunger y Ruffle local.

## Publicar

```
cd ~/Downloads/Tengaged-Reborn-V83-MANZANAS-Y-FLUIDEZ
npx wrangler pages deploy . --project-name tengaged-reborns
```

Usa la ruta real si lo has descomprimido en otro lugar. No borres D1. `/api/health` debe responder `version:83` y `build:V83-MANZANAS-Y-FLUIDEZ`.

## Manzana de Casting

Se ha consultado el Casting de Regaged y la captura del 26/10/2026 a las 8:30. El aviso utiliza ahora el GIF original de manzana de `/ui/castings/am_apple.gif`, servido localmente desde `assets/casting/apple.gif`. Antes se mostraba mediante un recorte del panel de estadísticas.

Como en la referencia, Big Brother tiene una cabecera amarilla y cinco opciones: cuatro frascos de veneno y una manzana central. La manzana se muestra a 44 × 44 píxeles, conserva su botón APPLE y comparte el formato del aviso de llave.

Recogerla añade 15 de salud, con máximo 100. Solo un participante puede recoger la recompensa y el aviso desaparece para todos. Repetir la misma petición no concede salud adicional. Las manzanas siguen el horario de avisos del Casting diario; no se coloca un aviso ficticio permanentemente ni se modifica la garantía de tres llaves por día. Las partidas rápidas anteriores conservan sus reglas.

## Fluidez

- Casting conserva los avatares y las filas de jugadores mientras no cambie el reparto o sus estados. Recoger recursos ya no reconstruye esas imágenes.
- Las respuestas iguales salvo la hora del servidor actualizan el reloj sin reconstruir la pantalla ni interrumpir un minijuego.
- Las consultas de presencia iguales comparten una petición y sus resultados se reutilizan durante quince segundos. Un fallo transitorio conserva el último tiempo conocido.
- Los avatares de Casting se comprueban periódicamente, aproximadamente cada minuto mientras la página está visible, para recoger cambios de aspecto y sanciones sin recargarlos cada pocos segundos.
- Hunger evita reconstruir la arena ante respuestas sin cambios. Los temporizadores del día, lobo y bosque siguen avanzando localmente.
- Disparar una flecha no vuelve a solicitar innecesariamente los datos de saldo de la cabecera. Inscripciones, patrocinios y finales sí conservan su actualización.
- Se mantienen la serialización de acciones y los reintentos de operaciones pendientes: no se ignora una confirmación del servidor para aparentar rapidez.

## Verificación

46 archivos de pruebas locales superados y Worker compilado con Wrangler 4.152.0. Las pruebas incluyen manzana real en el chat, reclamación simultánea, límite 100, ausencia de premio duplicado, desaparición del aviso, imagen APPLE, conservación del tablero/avatares y deduplicación/recuperación de presencia. También se mantienen las pruebas de economía, administración, privacidad y Hunger.

La revisión se realizó sobre el código y las referencias. No se ha desplegado desde este entorno ni se ha probado visualmente esta versión local en un teléfono físico. No se promete una coincidencia píxel a píxel ni una latencia concreta de tu conexión o Cloudflare.
