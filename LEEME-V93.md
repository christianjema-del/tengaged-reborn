# Tengaged V93 — Completar con bots, solo admin1

Actualización completa sobre V92. Conserva los avatares, los armarios de Cristi y admin1, la edición de diseños y las mejoras anteriores.

## Publicar

Descomprime el ZIP y, desde Tengaged-V93, ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Conserva la base D1 existente. No necesitas ejecutar SQL ni crear usuarios para los bots.

## Uso

Entra como admin1 y abre una partida en inscripción:

- Casting: en el panel de inscripción/recursos aparece «Completar con bots e iniciar (N plazas)».
- Hunger Games: aparece el mismo botón en la sala de inscripción.

Al pulsarlo se conservan los jugadores inscritos, se completan las plazas restantes (20 en Casting, 30 en Hunger) y la partida arranca. admin1 puede usarlo como espectador, sin ocupar una plaza. Si quiere jugar, debe inscribirse antes de pulsarlo. El botón desaparece tras empezar. No se utiliza en juegos ya empezados o terminados. Los formatos que siguen anunciados como Próximamente no tienen motor multijugador y no se habilitan en esta versión.

El servidor verifica tanto el nombre admin1 como su permiso administrativo. Otra cuenta administradora tampoco puede ejecutar la acción. Las escrituras usan el control de revisión existente para evitar plazas duplicadas por peticiones simultáneas.

Los bots son participantes de la partida, identificados como tales, sin cuentas, sesiones, correo o cargos de inscripción. En Casting generan sus propias puntuaciones simuladas, checks y votos al actualizar la partida; respetan las jornadas de 12 horas y no modifican las pruebas de humanos. En Hunger usan el comportamiento de bots ya existente. No se necesita dejar abierto el navegador de admin1; el estado avanza al consultar el servidor, como el resto del motor actual. No hay un proceso de bots separado ejecutándose continuamente.

Los bots no reciben pagos ni entradas en estadísticas de cuentas. Hunger conserva su política existente de premios reducidos cuando participan bots. No se han cambiado los premios humanos de Casting.

## PC y móvil

Botón con texto adaptable, foco visible y zona táctil mínima de 44 px; en pantallas pequeñas ocupa el ancho disponible. Avatares locales para bots de Casting, sin peticiones a perfiles inexistentes.

## Verificación

58 archivos de pruebas automatizadas superados: autorización, cuenta administradora distinta, capacidad exacta, preservación de humanos, concurrencia, ausencia de cuentas/cargos para bots, inicio automático, puntuaciones y votos propios y protección de estadísticas, además de la suite anterior. Worker compilado y sintaxis/IDs HTML comprobados. No se ha probado en un teléfono físico ni publicado desde este entorno.
