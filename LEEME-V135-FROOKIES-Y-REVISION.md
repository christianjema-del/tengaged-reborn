# Tengaged Reborn · V135 · Frookies y revisión PC/móvil

Paquete completo sobre V134. Publica en el proyecto existente, conservando la vinculación DB:

```bash
cd ~/Downloads/Tengaged-V135
npx wrangler pages deploy . --project-name tengaged-reborns
```

Esta entrega está preparada para desplegar; no se ha publicado desde aquí.

## Nominaciones desde los avatares

Durante las nominaciones, solo el HoH ve «Nominar» debajo del estado de cada rival activo. No puede nominarse a sí mismo ni nominar en el final cuatro. El primer clic marca al primer elegido y puede deshacerse pulsándolo otra vez. Al elegir al segundo, se guardan ambos de forma conjunta; entonces desaparecen todos los botones de nominar. La primera selección se conserva al actualizarse el chat o la partida.

Se retira el recuadro rojo de esa fase. El botón amarillo «Desafío» aparece encima de Ronda, también en móvil. Los paneles de veto, sustitución, votación y final mantienen sus controles y permisos.

## Tiempo de PoV

Todos comienzan con 150 segundos. Cada PoV ganado en una ronda anterior resta cinco segundos a sus siguientes pruebas: 150, 145, 140, 135… La reducción es individual y se calcula desde el historial real, también para partidas ya existentes. Los bots utilizan su tiempo individual para calcular su resultado simulado.

El tiempo queda fijado al iniciar un intento. Los intentos que ya estaban en curso antes de actualizar conservan su duración para que puedan terminar correctamente. Los resultados ya guardados se conservan.

Si alguien inicia el desafío cerca del final de la fase, el servidor amplía el plazo hasta el final de ese intento, con cinco segundos de margen para recibir su guardado. Así dispone de todos sus segundos asignados. Reabrir un mismo intento no vuelve a ampliar el plazo. Las fases siguientes continúan con sus tiempos normales y se mantiene la corrección contra rondas atrasadas encadenadas.

## Página de desafío

La de Frookies usa la misma estructura y estilos de Casting: catálogo lateral con las diez capturas reales, instrucciones, tiempo personal, minijuego original, confirmación del guardado y lista de concursantes con sus resultados. En móvil, el juego aparece antes que el catálogo. Se mantiene el guardado automático y el registro en el ranking general. Es posible volver a consultar un resultado guardado sin repetir el intento.

La partida actual se conserva. La recuperación única de V134 mantiene su marcador y no vuelve a ejecutarse en una edición ya recuperada.

## Verificación

- 92 archivos de pruebas automatizadas superados, con casos específicos de 150/145/140 segundos, reducciones por usuario, bloqueo del tiempo de un intento, inicio tardío, guardado y consulta pública segura de resultados.
- Compilación correcta de Cloudflare Functions con Wrangler 4.152.0.
- Revisión en navegador de 29 pantallas a 1440, 768, 390 y 320 píxeles: carga, menú desplegable, enlaces internos y ancho de página, sin errores de JavaScript, respuestas API 500 ni desbordamiento horizontal con los datos de prueba.
- Comprobados los botones del HoH, selección y deselección, conservación de la primera elección durante las actualizaciones, guardado de ambos nominados y desaparición de controles.
- Comprobada la página de desafío con Ruffle, sus diez capturas, los 150 segundos iniciales, resultados de 650/600 puntos y la siguiente prueba de 145 segundos tras un PoV.

Las pruebas usan datos locales y cubren los estados descritos; no equivalen a comprobar cada posible acción con los datos de producción ni a probar físicamente todos los modelos de teléfono.

También se verificó la interacción táctil en 390×844 y 844×390: menú y cierre desde fuera, pestañas públicas/privadas, apertura y cierre del formulario de diseños, y tirada diaria con su resultado. Se corrigió el solapamiento de la cabecera en ventanas táctiles horizontales de poca altura y se añadieron márgenes de área segura para las muescas de pantalla. El menú conserva desplazamiento interno en horizontal.
