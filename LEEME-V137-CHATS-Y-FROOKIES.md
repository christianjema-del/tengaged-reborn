# Tengaged Reborn V137

Actualización completa sobre V136. No reinicia partidas, usuarios ni saldos.

- Chats de Casting, Hunger y Frookies con las mismas pestañas manuscritas, paginación, compositor, mensajes y controles de votos, tomando como referencia la grabación facilitada. Ajustes compactos para teléfono.
- Selector de conversación pública/privada y opción de adjuntar un enlace de imagen al comentario, respetando el límite de 500 caracteres y la visualización multimedia existente.
- Frookies: elegir expulsión bajo el avatar del nominado, selección resaltada y confirmación con Guardar en el panel azul. El servidor conserva los permisos y el voto único. Se mantienen los botones de nominar y tercero/cuarto de las versiones anteriores.
- Reloj azul sobre los avatares de los votantes que todavía no han guardado su voto. No revela a quién votó cada usuario. En Hunger, reloj azul cuando falta guardar el minijuego del combate.
- Casting: al recoger una llave o manzana, TODOS los mensajes anteriores a la aparición de ese objeto quedan cerrados a positivos, negativos y retirada de votos, para todos los jugadores. Se conservan los votos ya emitidos. Los mensajes posteriores continúan admitiendo votos. Restricción aplicada en el servidor y mostrada con controles grises deshabilitados. El corte persiste aunque desaparezca el objeto.
- Reparada la paginación que quedaba tapada por las pestañas; los clics de votos durante una actualización se procesan en orden.
- Se mantienen los segundos individuales de los desafíos, los premios y las partidas activas. No se incorpora publicidad ni contenido de usuarios ajenos mostrado en la grabación.

## Publicación

Desde la carpeta extraída Tengaged-V137:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No es necesario borrar D1 ni reiniciar juegos.
