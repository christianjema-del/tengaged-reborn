# V151 · Chat recuperable y pantalla de lucha

Esta entrega completa conserva los cambios de V149 y V150. No requiere ejecutar SQL ni reiniciar partidas.

## Despliegue

Descomprime Tengaged-V151.zip y entra en la carpeta Tengaged-V151. En Terminal:

cd ~/Downloads/Tengaged-V151
npx wrangler pages deploy . --project-name tengaged-reborns

Espera «Deployment complete!». Comprueba que la última línea del Terminal indique Tengaged-V151, no Tengaged-V149. Abre el nuevo enlace de despliegue para evitar una pestaña con archivos anteriores.

## Cambios

El chat de Hunger puede resolver la edición activa directamente, sin esperar otra consulta de la arena. Se identifica al participante por ID y se conserva la compatibilidad con partidas antiguas que guardan el nombre. No se amplían permisos de espectadores ni eliminados.

Los chats de Hunger, Casting y Frookies incluyen Reintentar chat ante un error. Los mensajes cargados y el borrador se conservan; los envíos no se repiten automáticamente. Los avisos antiguos sin descriptor y las fechas ausentes no bloquean toda la lista.

Incluye la V150: resultados completos en Últimas luchas, sin tiempos de conexión en la pantalla de lucha ni botón de guardado manual para pruebas actuales. El resultado sigue confirmándose automáticamente.

## Verificación y límites

121 pruebas automáticas pasan, incluida una cuenta MDMA de prueba con lectura y escritura en la edición activa, identificador estable y permisos de los tres juegos. Compilación de Functions correcta.

Pruebas de navegador de los chats a 1440, 768, 390 y 320 píxeles: carga, recuperación tras fallo temporal, aviso antiguo, borrador conservado y ausencia de desbordamiento. Las 34 páginas HTML tienen sus dependencias estáticas locales presentes.

No se ha usado la sesión real de MDMA. Esto no garantiza cada combinación de cuenta, dispositivo y estado de partida en producción. Si persiste un fallo tras desplegar esta versión, el mensaje visible de error permite concretarlo.
