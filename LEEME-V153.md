# V153 · Chat estable, votos únicos, armarios y Maze táctil

Entrega completa que conserva las versiones anteriores, incluida la edición especial de 32 jugadores de Hunger.

## Publicar

Descomprime Tengaged-V153.zip y ejecuta desde la carpeta Tengaged-V153:

cd ~/Downloads/Tengaged-V153
npx wrangler pages deploy . --project-name tengaged-reborns

Espera Deployment complete! y abre el enlace nuevo. Verifica que Terminal indique Tengaged-V153 para no volver a desplegar una carpeta antigua. No hace falta SQL ni reiniciar juegos.

## Chat

Hunger, Casting y Frookies conservan los nodos de las imágenes, avatares y vídeos al recibir mensajes y actualizar votos. Los mensajes privados también conservan sus nodos al actualizarse. Solo desaparecen los mensajes que ya no pertenecen a la página de historial solicitada y los objetos reclamados/caducados, como corresponde a sus reglas.

La consulta periódica no deshabilita el botón de envío si hay un borrador válido. Los botones deshabilitados se mantienen opacos. Cada usuario puede votar una sola vez cada comentario, positivo o negativo: después ambos botones quedan grises. No se puede retirar ni cambiar el voto, tampoco mediante una petición directa; las peticiones simultáneas guardan un único valor. Repetir exactamente la misma petición no suma otro voto. Los mensajes anteriores a un objeto recogido en Casting siguen cerrados a nuevos votos.

## Avatares

Dos avatares completos gratuitos para cada cuenta existente:

- Ricardito: rubio de camiseta rosa y plumas.
- PauCubarsi: Batman y pelo negro con chaqueta.

La selección se hizo al azar entre las capturas completas disponibles y queda fijada para evitar duplicados o sorteos nuevos al recargar. Se incorporan al abrir el armario tras publicar. No se equipan solos. Al elegirlos se muestra únicamente la imagen, sin el avatar predeterminado. Se conservan los JPEG originales y las dimensiones de los marcos de perfil/juegos.

## Maze

En dispositivos táctiles de hasta 1024 px se muestran flechas para mantener pulsadas y se permite arrastrar desde la bola azul para enviar direcciones al juego. Soltar/cancelar el gesto, ocultar la pestaña o salir del desafío detiene la repetición y limpia los eventos. En PC se usa el archivo original sin controles añadidos.

El archivo móvil conserva todos los gráficos, sonidos, fuentes y fotogramas del original; solo añade un puente AS3 de entrada que llama al manejador original de las flechas. No se alteran segundos, niveles, puntuaciones ni envío de resultados. Detalles en MAZE-MOVIL-V153.md.

## Verificación

125 pruebas automáticas correctas y compilación de Functions. Se han comprobado los chats de los tres juegos en navegador a 1440, 768, 390 y 320 px: conservación de imagen/avatar/iframe al votar y recibir mensajes, gris opaco tras votar y borrador activo durante la consulta. También se ha comprobado la conservación de imágenes en los tres historiales privados.

Maze se ha ejecutado realmente con Ruffle en escritorio y móvil: flechas únicamente en el dispositivo táctil; movimiento de la bola comprobado con flechas y con arrastre iniciado sobre la bola, respetando las paredes; controles eliminados al cerrar. Se ha verificado que los tags de gráficos, sonidos y fuentes del SWF móvil permanecen idénticos.

Se han revisado las dependencias estáticas de las 34 páginas. Estas comprobaciones no equivalen a probar todas las cuentas y versiones de Safari/Android en producción. Esta entrega todavía debe publicarse con el comando anterior.
