# V85 · Hunger limpio

Paquete completo sobre V84. No borres D1 ni reinicies partidas.

## Cambios

- Se retira Actualizar arena de debajo del icono y Sponsors. La arena mantiene la actualización automática cada veinte segundos.
- El botón Patrocinios se llama Sponsors y conserva su diálogo y funcionamiento.
- Se retira el texto duplicado de vivos sobre el icono; el número dentro del icono permanece.
- Se eliminan las pestañas superiores Juego, Resultados y Reglas. La arena y las luchas funcionan sin depender de ellas.
- Las reglas de la edición están en Normas de Hunger Games, un desplegable al final de la página. El enlace Normas del pie de Hunger lo abre y lleva hasta él. También hay un enlace a las normas generales.
- La clasificación se conserva para cuando finalice la partida; los resultados individuales continúan en Ver resultado de cada combate.
- Solo si falla una petición aparece Reintentar conexión, junto al error. Mantiene el reintento con el identificador original y desaparece al recuperarse. No hay un control de actualización visible durante el juego normal.
- Se mantienen los arbustos en dos filas de cuatro, el selector Disparar y la entrada manual desde Luchar.

## Publicar

Descomprime Tengaged-V85.zip y ejecuta:

```bash
cd ~/Downloads/Tengaged-V85
npx wrangler pages deploy . --project-name tengaged-reborns
```

El endpoint /api/health debe responder version:85 y build:V85-HUNGER-LIMPIO. No se ha publicado desde este entorno.

## Comprobaciones

48 archivos de pruebas locales; Worker compilado con Wrangler 4.152.0. Se comprueban la cabecera limpia, las luchas, el retorno a la arena, el disparo, los arbustos, las normas desplegadas durante las actualizaciones y la recuperación de una operación pendiente tras un error de conexión. Revisión estructural de los HTML y de la sintaxis de JavaScript. No se ha hecho una revisión visual en móvil físico.
