# V149 · Hunger especial, fotos completas y chat administrativo

Versión completa basada en V148. Conserva las capas originales, las fotos de Peach/Cristi/DaisyJane, las tarjetas T, el contador real de Jugado y los cambios anteriores. No vuelve a aplicar el SQL de recálculo de premios.

## Hunger #3

Se verificó la edición 3 activa con 30 participantes y sin MDMA. Esta versión incorpora a la cuenta existente MDMA una única vez, al consultar la arena, siempre que la edición 3 continúe activa con los 30 participantes originales. No crea cuentas ni cobra inscripción.

MDMA entra oculto, con 70 de salud y 10 flechas. La capacidad de esta edición pasa a 31. Se conservan luchas, tiempos, comida y progreso. Las posiciones de los eliminados se desplazan una plaza para mantener su orden relativo. El cambio se guarda de manera persistente, protegida ante solicitudes simultáneas. Hunger #4 y posteriores mantienen 30 plazas. La edición 2 especial anterior se conserva.

## Armarios

Los dos JPEG recibidos (chico con pañuelo y Batman) se incorporan a cada uno de los armarios de Lamine, admin1 y Fentanilo. Son seis concesiones en total, sin cargos, sin duplicados y sin equipación automática. Se prueban desde el armario y se aplican con Guardar cambios.

Al elegirlos se muestra únicamente la fotografía, ocultando todas las piezas predeterminadas. Los marcos y el lienzo de avatar conservan sus dimensiones. Se sirven los JPEG originales directamente para evitar conversiones y recomprensiones intermedias. Las imágenes originales son pequeñas: no se inventan detalles ni se promete una resolución superior a la aportada.

## Chat de administrador

La cuenta admin1 con su rol de administrador puede comentar públicamente en Casting, Frookies y Hunger sin inscribirse, incluidos sus chats finalizados/archivados disponibles. La autorización se valida en el servidor. Los demás espectadores y administradores con otro nombre conservan sus permisos anteriores.

Sus mensajes aparecen en amarillo, identificados como admin1, con un formato semejante al de los avisos automáticos. No admiten votos positivos o negativos. Escribir no incorpora a admin1 a la partida ni concede acciones de participante, votos o premios. La protección de origen, sesión y frecuencia de envío se conserva. Los mensajes privados mantienen sus permisos anteriores.

## Verificación

120 pruebas superadas, incluida la incorporación concurrente de MDMA mediante la API, capacidad persistente, ausencia de cobros y duplicados, equipación real de las seis concesiones, igualdad de los bytes JPEG originales, exclusión del avatar predeterminado y permisos del chat administrativo.

Navegador: perfiles de las tres cuentas y avisos amarillos comprobados en PC y móvil, sin desbordamiento. Functions compiladas con Wrangler.

## Publicar

Descomprime y entra en la carpeta Tengaged-V149. Ejecuta:

npx wrangler pages deploy . --project-name tengaged-reborns

Después del despliegue, abre Hunger para incorporar a MDMA y el armario para ver los regalos. No hace falta ejecutar un SQL adicional.
