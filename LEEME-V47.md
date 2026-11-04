# V47 · Perfil y contador de regalos

Incluye la V46 completa.

- Cabecera con avatar, estadísticas verticales y una fila de botones compactos.
- Amistad, correo y corazón de regalos juntos bajo las estadísticas.
- El corazón muestra el número real de regalos recibidos; no suma diseños comprados. Incluye el cero, singular/plural y un estado de contador no disponible en caso de error.
- Pulsar el corazón abre la galería del usuario que estás viendo.
- El contador se consulta de nuevo cada 30 segundos mientras la página está visible.
- El propio perfil muestra Editar en lugar de enviarse una solicitud de amistad. Los estados de amistad y sus acciones siguen funcionando.
- Biografía amarilla, amigos en filas de cinco y Mafia encima de Amigos. Las estadísticas adicionales siguen disponibles en Más estadísticas.
- Se conservan la edición del avatar, el armario, los regalos, la economía y el formato de horas/días.

18 suites de pruebas superadas. Comprobados botones, contador de regalos frente a diseños comprados, cero/singular, enlaces, amistad y perfil propio. Sintaxis del script del perfil comprobada y sin IDs repetidos.

Comparación basada en el perfil público de Regaged revisado en la conversación. No se añaden módulos ficticios de invitaciones o apuestas. Falta verificar visualmente el despliegue, por lo que no se certifica una copia 1:1 exacta.

Publicar desde esta carpeta:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
Después, Cmd + Mayús + R. El endpoint /api/health debe indicar version: 47.
