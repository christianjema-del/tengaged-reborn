# V46 · Revisión general y armas de Hunger

Incluye todos los cambios de V44 y las armas solicitadas durante la preparación de V45. Instala este paquete completo directamente.

## Publicar
Descomprime el ZIP y ejecuta desde la carpeta Tengaged-Reborn-V46-REVISION-GENERAL:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
También puedes ejecutar PUBLICAR.command. Comprueba que el terminal muestre la carpeta V46. Después recarga con Cmd + Mayús + R.

El endpoint /api/health incluye version: 46 y build: V46-REVISION-GENERAL para comprobar el despliegue.

## Incluido
- Armas de Hunger extraídas de las cuatro capturas del usuario: cuchillo, hacha, maza y espada. Se retiran los cuatro SVG anteriores. Botones a la derecha del pollo, mismo tamaño, marco y fondo. Recoger mediante clic conserva el tiempo correspondiente. Al completarse, chat con avatar/nombre a la izquierda y dibujo del arma a la derecha. Eventos antiguos de recogida compatibles.
- Juegos convertido en directorio de dos columnas: promociones y mensajes, inscripción y tablas de partidas. Inscripción separada en /enroll.html, con tarjetas de formatos. Solo Casting y Hunger están implementados. Los demás se indican como Próximamente.
- Historial público de Hunger con metadatos, sin mensajes privados ni estado interno. Enlaces a ediciones activas y archivadas corregidos.
- Portada, Minijuegos, Grupos, Blogs, Hall of Fame, Mafias, Diseños, Tiendas y perfiles ajustados visualmente; tratamiento compartido para Correo y Pregúntame.
- Minijuegos: selector lateral y prueba en el mismo espacio mediante iframe, conservando el motor original y el ranking de cada prueba.
- Blogs: listas compactas, top real del día y formulario desplegable. Diseños: recientes/top en paralelo, formulario desplegable.
- Hall of Fame: galería top 20, victorias reales y clasificación completa desplegable.
- Última actividad: menos de 60 minutos en min; desde 60 en horas; desde 24 horas en días. Ejemplos: 60 → 1 hora; 120 → 2 horas; 569 → 9 horas; 1440 → 1 día. Se aplica a perfiles, comunidad y etiquetas de actividad de Casting.

## Validación
17 suites de tests/*.test.mjs superadas. Verificadas referencias HTML, existencia de recursos locales, scripts JS e inline sin errores de sintaxis, ausencia de IDs repetidos y llaves de CSS completas. ZIP comprobado antes de entrega.

No se pudo abrir la vista previa local en el navegador remoto: su política bloquea ese protocolo. Falta comprobar visualmente el despliegue y la adaptación real en distintos dispositivos. No es una réplica 1:1 certificada. Consulta COMPARACION-V46.md para los límites concretos.
