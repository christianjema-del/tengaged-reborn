# Tengaged V111

Actualización completa sobre V110. Conserva los cambios anteriores.

- Hunger: deja de generar mensajes de inscripción «entra en la arena». También se filtran los antiguos al recuperar el chat y se corrige su contador. Los avisos de combate, muertes y objetos se conservan.
- «Tu estado»: avatar y nombre sin tiempo de conexión. Los tiempos de los demás listados se conservan.
- Chat común de los juegos: dimensiones del chat de Casting, cabecera compacta con nombre, fecha, puntuación y botones positivo/negativo. Texto y formulario ajustados; botones accesibles para pantallas táctiles. No se cambia la lógica de votación.

78 pruebas automatizadas superadas y Worker compilado. Comprobaciones locales en Chromium a tamaños de PC y móvil. No se ha publicado desde este chat.

Descomprime y ejecuta:

```bash
cd ~/Downloads/Tengaged-V111
npx wrangler pages deploy . --project-name tengaged-reborns
```
