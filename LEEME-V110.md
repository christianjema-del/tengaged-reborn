# Tengaged V110

Versión completa sobre V109. Conserva las funciones y datos existentes.

- Cabecera: miniatura circular del avatar equipado del usuario conectado junto a la flecha; se actualiza al guardar el avatar y se retira al cerrar sesión. Conserva avisos de correo, menú y accesos a juegos.
- Lista de Famosos: distribución basada en la captura facilitada, cuatro retratos grandes y siguientes puestos en filas de ocho. Se mantienen los números de posición sobre cada avatar. Clasificaciones adicionales plegadas. Se muestran usuarios y estadísticas reales.
- Diseños: listado en dos columnas, miniaturas, autor, fecha, puntuación, comentarios y plazo de votación. Votos positivos y negativos con el poder de la tarjeta equipada, calculado en servidor; sin voto propio. Conserva edición, eliminación, prueba de prendas y subastas. Los votos anteriores se ponderan una sola vez al actualizar.
- Peach: añade gratuitamente los diseños 19 (Ojitos) y 15 (Roja), además de los seis anteriores. Se verifica autor, título y capa; no se equipa nada automáticamente ni se duplica el inventario.
- Hunger: premios completos para usuarios humanos aunque haya bots. No se recalculan premios ya abonados de ediciones anteriores. Las ediciones antiguas finalizadas se archivan y dan paso a la siguiente; no se reinician partidas en curso. Si la edición 1 continúa finalizada al publicar, al consultar Hunger se abrirá la inscripción de la edición 2 conservando su historial.

## Publicación

Descomprime el ZIP y ejecuta dentro de su carpeta:

```bash
cd ~/Downloads/Tengaged-V110
npx wrangler pages deploy . --project-name tengaged-reborns
```

No se ha publicado desde este chat ni se han alterado cuentas o resultados de producción durante las pruebas.

## Verificación

78 pruebas automatizadas y compilación de Cloudflare Worker. Pruebas de navegador locales a 1440, 390 y 320 píxeles en Diseños, detalle, Hall of Fame y Hunger, sin errores de página ni desbordamiento horizontal; comprobación de apertura/cierre del menú, avatar de cuenta y cambio de usuario. Son pruebas de Chromium, no dispositivos físicos. La adaptación conserva datos propios y no afirma identidad píxel a píxel entre navegadores.
