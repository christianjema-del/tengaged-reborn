# Actualización Casting y perfil — 24/10/2026

- Cuatro tipos de pruebas en rotación: sumas, series numéricas, multiplicaciones y reflejos.
- Las preguntas matemáticas son deterministas para cada partida y ronda; el servidor recalcula los aciertos y no acepta una puntuación inventada por el navegador.
- La clasificación premia primero los aciertos y después el tiempo declarado por el cliente. **Nota:** el tiempo enviado desde el cliente se puede manipular; las partidas competitivas necesitan verificación adicional del tiempo/antitrampas.
- Se mantiene el consumo de 20 de salud, el único intento por ronda, las inmunidades y las nominaciones.
- Fecha de apertura visible en el Casting y en el listado de juegos.
- Fechas de perfil saneadas: no aparece Invalid Date cuando un registro es nulo, heredado o mal formado.

## Publicación

Desde la carpeta que contiene `wrangler.toml`, con Cloudflare autenticado:

`npx wrangler pages deploy . --project-name tengaged-reborns`

El despliegue no se puede realizar aquí sin credenciales de Cloudflare. Conserva la vinculación D1 existente; **no borres la base de datos**.

No se han copiado recursos gráficos ni código propietario de sitios ajenos. Son implementaciones propias inspiradas en mecánicas generales.
