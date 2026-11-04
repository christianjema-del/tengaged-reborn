# V154 · Estabilidad visual durante la actualización automática

Entrega completa sobre V153. Mantiene los juegos, premios, regalos, avatares y Maze táctil de las versiones anteriores. No requiere SQL ni reiniciar partidas.

## Desplegar

Descomprime Tengaged-V154.zip y ejecuta dentro de Tengaged-V154:

cd ~/Downloads/Tengaged-V154
npx wrangler pages deploy . --project-name tengaged-reborns

Espera Deployment complete! y abre el nuevo enlace. La carpeta del Terminal debe indicar Tengaged-V154.

## Correcciones

La grabación enviada corresponde a Safari y la web pública ya usaba V153. La corrección anterior del chat no evitaba que Hunger reconstruyese otros paneles cuando cambiaba la salud o la comida.

- Las consultas de fondo ya no deshabilitan temporalmente los botones. Una acción real conserva su protección contra doble envío. Si se pulsa durante una consulta, espera a que termine y se envía una vez, conservando la edición que se estaba viendo.
- La Cornucopia, los arbustos, las armas, el retrato de Tu estado, las tarjetas, las últimas luchas y los participantes de una lucha conservan sus elementos mientras no cambie su contenido visual.
- Casting y Frookies no reconstruyen los avatares por cambios internos que no afectan a sus tarjetas.
- Los botones deshabilitados conservan opacidad completa; el permiso para usarlos se sigue comprobando y no cambia.
- Los avatares conocidos disponen inmediatamente de su última imagen válida. Una actualización fallida no borra la foto. Una foto nueva se precarga antes de sustituir la anterior.
- El chat conserva también las cabeceras y los botones de paginación que no hayan cambiado. Al resolver el número de la arena actual ya no se vacía la misma conversación. Los fallos de conexión no vacían lo ya cargado.

Los jugadores pueden entrar/salir, cambiar de avatar o terminar combates: esos cambios reales siguen reflejándose. No se congelan los datos ni se ocultan errores de conexión.

## Comprobación

125 pruebas automáticas pasan. Compilación de Functions correcta.

Prueba de navegador con la página completa de Hunger y respuestas con demora, a 1440, 768, 390 y 320 px: varias actualizaciones simuladas de salud y comida mantienen los mismos nodos de imágenes, botones e historial. Se comprueba que no sean retirados del documento y que las imágenes sigan cargadas. También se prueba que un clic durante la consulta se ejecute una vez y que un fallo de actualización del avatar conserve la imagen previa.

La misma prueba detecta el problema en V153: sus botones se deshabilitan y bajan a 0,6 de opacidad durante la consulta. La V154 supera la prueba, sin errores de página. La grabación de Safari se ha inspeccionado; las pruebas automatizadas de esta entrega se han ejecutado con Chromium. No se ha desplegado automáticamente en Cloudflare.
