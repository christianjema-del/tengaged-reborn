# V81 · Perfil, Hunger y compatibilidad

Paquete completo basado en V80. Conserva Casting, Hunger y la revisión visual anterior.

## Publicar

```
cd ~/Downloads/Tengaged-Reborn-V81-PERFIL-HUNGER-Y-MOVIL
npx wrangler pages deploy . --project-name tengaged-reborns
```

Si lo has descomprimido en otra ubicación, usa esa ruta. No borres D1. `/api/health` debe responder `version:81` y `build:V81-PERFIL-HUNGER-Y-MOVIL`.

## Tarjetas corregidas

El perfil anterior solo aplicaba seis de los veinte colores que ofrece la tienda. Ahora comparte con ella un catálogo completo: blanco, amarillo, naranja, verde claro, verde, azul, morado, rojo, marrón, negro, plata, oro, cielo, sangre, TV Star, Ultra Gold, titanio, holofoil, prisma y diamante.

El recuadro muestra el color que figure realmente equipado en el inventario, también para admin1. No se cambia ni compra una tarjeta automáticamente por tener karma. Si no hay tarjeta equipada, se muestra blanco y se indica expresamente. El bloque Perfil enlaza a la tienda de tarjetas para comprar o equipar una de las que poseas.

## Perfil ajustado a la segunda captura

- Avatar y estadísticas con filas separadas; administrador/cuenta de prueba y acciones ya no se colocan sobre la fecha de registro.
- Tarjeta de color en la esquina del nombre, nombre del nivel accesible y puesto real por karma junto a los puntos. Los empates comparten puesto.
- Descripción amarilla con pestaña, edición, juegos con los sprites originales, paginación compacta, blog, menciones y actividad.
- Lateral con inscripción, invitaciones propias, mafia, edición de perfil, amigos y ordenación existente, grupos y diseños. Los enlaces secundarios quedan en un desplegable.
- Se conserva el botón de corazón y el contador real de regalos solicitado en versiones anteriores.
- La salud de Casting sigue siendo privada del propietario y se consulta en Más estadísticas. No se elimina esa información.
- Menú superior sin cortar el primer enlace en pantallas de escritorio intermedias; navegación desplazable en teléfono.

## Invitaciones reales

En tu propio perfil se muestra un enlace `/?ref=TU_USUARIO#register` y un botón Copiar. Si una persona nueva se registra desde él, queda atribuida a quien la invitó. Una cuenta solo puede atribuirse una vez; no se admiten referencias a uno mismo, usuarios inexistentes, baneados o cuentas de sistema. No se reconstruyen invitaciones anteriores a esta versión.

Este contador no paga dinero: no se muestra la recompensa de 5 R$ de Regaged ni se copia su promesa de verificación de correo, porque nuestra web no tiene ese flujo equivalente. Tampoco se añaden apuestas o actividad ficticias para llenar los bloques de la captura.

## Validación

43 archivos de pruebas locales superados y Worker compilado con Wrangler 4.152.0. Las pruebas nuevas comprueban compras/equipamiento de los veinte niveles, el color del perfil de admin1, exclusividad de tarjeta equipada, privacidad de saldo/salud, puesto por karma, invitaciones únicas y registro desde un enlace. Revisados JavaScript, sintaxis CSS, referencias HTML e identificadores.

La comprobación usa una base SQLite de prueba: no se ha accedido al inventario real de admin1 en tu Cloudflare ni se ha modificado desde aquí. El perfil mostrará la tarjeta que tenga equipada al publicar.

La estética se ha ajustado a las dos capturas aportadas. Queda pendiente comprobar visualmente la versión publicada en navegador y teléfono; no se afirma una coincidencia píxel a píxel.

## Hunger: supervivencia temporal a cero por flechas

La regla se aplica tanto a las ediciones activas anteriores como a las nuevas. Si un jugador que está comiendo en Cornucopia recibe el flechazo que lo deja a cero y todavía queda comida, permanece vivo. No aparece aún una muerte, no se adjudica una baja ni se termina la partida por ese impacto.

Si sale con la salud todavía a cero o se agota la comida antes de recuperarse, se resuelve la eliminación y se acredita la baja al autor del flechazo original. No se duplica al actualizar ni se transfiere a quien dispara después sobre el cero. El agotamiento se resuelve antes de reponer una reserva de comida.

Puede recuperar salud mientras siga comiendo; si ya tiene salud positiva al salir, sigue vivo. Un patrocinio de salud o un arbusto con corazón también puede salvarlo. La excepción no se inicia si el impacto lo recibe en el bosque, luchando, recogiendo un arma o sin comida disponible. Se conserva la privacidad de salud: los demás solo ven que sigue vivo. El propio jugador ve la indicación de supervivencia temporal.

## Compatibilidad PC y móvil

- Ruffle 0.7.1 se incluye completo en `vendor/ruffle` con sus dos módulos WASM y licencias. Ya no depende de un CDN externo sin versión para cargar los minijuegos. El ZIP pesa más por ello.
- El lanzador reconoce la API actual `ruffle().load` y el método antiguo, conserva los FlashVars de Casting/Hunger y permite reintentar una carga fallida.
- Cabeceras MIME de WASM, estilos para pantallas táctiles, foco de teclado, campos de tamaño legible, formularios sin desbordamiento, diálogos con altura adaptable y respeto a reducir movimiento.
- Se mantienen los originales: no se sustituyen por juegos distintos. La presencia de Ruffle local no garantiza que todos los juegos Flash tengan exactamente el mismo comportamiento en cualquier navegador o teclado táctil.

Pruebas adicionales de Hunger: protección al llegar a cero, persistencia tras recarga, recuperación, salida, agotamiento con y sin reposición, patrocinio, excepciones y atribución única de la baja. Pruebas del lanzador: carga única, ruta local, recuperación después de fallo y API moderna con los parámetros de competición.
