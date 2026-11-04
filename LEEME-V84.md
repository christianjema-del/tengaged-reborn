# V84 · Hunger compacto y mejoras de comunidad

Paquete completo sobre V83. Conserva las partidas, compras, avatares, tarjetas, administración, sanciones, manzanas, minijuegos y reproductor local. No borres D1 ni reinicies las partidas.

## Publicación

Descomprime `Tengaged-V84.zip` y ejecuta desde su carpeta:

```
cd ~/Downloads/Tengaged-V84
npx wrangler pages deploy . --project-name tengaged-reborns
```

También se incluye PUBLICAR.command. La cuenta de Cloudflare debe estar autorizada en tu ordenador. La comprobación `/api/health` debe indicar `version:84` y `build:V84-HUNGER-COMPACTO`.

## Hunger

- Se retiran de la arena los recuadros Día, ocupación de Cornucopia, reserva de comida y cuenta atrás de nuevo día.
- Se elimina «Volver a la pelea». La entrada al combate está en «Lucha actual», mediante «Luchar» o «Ver lucha».
- Se retiran el botón Ocultarme y el segundo contador de flechas de encima de los arbustos. Se conserva Ocultarme debajo del propio avatar de Cornucopia y el contador junto al arco y Disparar.
- Ocho arbustos en dos filas de cuatro en PC y móvil, con botones de 44 × 44 y espacios entre ellos. Se conservan las búsquedas, resultados y renovación del motor existente.
- Lobo y renovación del bosque tienen un recordatorio pequeño bajo los arbustos. No cambian los ciclos del servidor.
- El acceso móvil Luchas lleva al historial completo aunque no haya lucha actual.
- El mensaje de plazo del desafío respeta las ocho horas de las ediciones nuevas y las seis de las antiguas.
- Quien esté a cero protegido mientras come ve una explicación visible en su estado privado.
- Los blogs de Hunger filtran la etiqueta exacta, muestran autor enlazado, lista de cinco publicaciones y botón de reintento ante error.

## Comunidad y ayuda

- Contador en la cabecera de usuarios activos durante los últimos cinco minutos, excluyendo bots, cuenta del sistema y suspendidos. Se enlaza al directorio de jugadores y se actualiza cada minuto mientras la página está visible.
- La consulta de indicadores de cabecera devuelve solo totales; evita cargar el listado de jugadores y mensajes públicos cada minuto. Los avisos de correo conservan su recuento privado.
- Buscador de blogs con enlaces compartibles. Los cambios entre Últimos, Top, Hoy y Anteriores conservan la búsqueda y reinician la paginación.
- Trece preguntas frecuentes desplegables en Cómo jugar, con buscador que acepta mayúsculas, palabras múltiples y acentos. Explican las funciones que existen en nuestra web, sin anunciar como implementadas otras reglas de la referencia.
- Se corrige la guía antigua que describía todos los arbustos como una sola búsqueda por partida: las nuevas ediciones renuevan a las cuatro horas.
- Campos y botones adaptados a pantallas estrechas, respuestas desplegables nativas y títulos largos con salto de línea.

## Referencias y alcance

Se consultaron la arena https://regaged.com/game/cmve0e49o03wgka4hosnmxzxc y https://regaged.com/faq el 26/10/2026, además de la captura adjunta del usuario. La referencia se utilizó para composición, ayuda y navegación. No se han trasladado automáticamente cambios de economía ni reglas contradictorias con las que el usuario pidió para este proyecto.

La publicación no se ha realizado desde este entorno: Wrangler informa de que no hay una cuenta de Cloudflare autenticada. No se han pedido ni incluido credenciales en el paquete. La vista local no ha podido abrirse en el navegador remoto; las comprobaciones son de código, interfaz simulada y compilación, no una prueba en un teléfono físico ni una certificación de réplica píxel a píxel.
