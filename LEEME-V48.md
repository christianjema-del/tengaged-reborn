# V48 · Perfil compacto y banner de inscripción

Incluye la V47 completa.

- Mismo banner de inscripción de la captura: círculo amarillo y Casting / Stars / Rookies / Survivor. Extraído de la imagen proporcionada, sin redibujarlo. Aparece arriba a la derecha del perfil y abre /enroll.html. Los formatos disponibles siguen siendo los implementados en el servidor.
- Se corrige la regla CSS que ocultaba el banner de la versión anterior.
- Mensaje de amigos vacíos a todo el ancho, evitando que se divida en una palabra por línea.
- Diseños del usuario en filas compactas con miniatura y nombre, en lugar de una cuadrícula grande.
- Historial de siete juegos por fila en escritorio, esferas más pequeñas y tarjeta azul inferior. Las partidas reales y sus enlaces se conservan.
- Menos separación entre secciones y biografía amarilla con el pequeño triángulo de la referencia.
- El perfil propio muestra En línea; los demás mantienen minutos, horas o días. La fecha de registro pública queda visible en la cabecera de todos los perfiles.
- Se mantiene el corazón y su contador real de regalos.

18 suites de pruebas superadas. Verificado banner/enlace, recursos y sintaxis del perfil. Comparación basada en las dos capturas facilitadas; falta revisar visualmente el despliegue. No se añaden datos ficticios de invitaciones, mafias o apuestas.

Publicar desde esta carpeta:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
Después recargar con Cmd + Mayús + R. /api/health indica version:48.
