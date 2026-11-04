# V53 · Conexión de desafíos y capturas reales

Incluye V52 y todas las mejoras anteriores.

## Conexión del desafío

Los archivos SWF declaran subcontextId como Number. Se enviaba el ID compuesto de Hunger, por ejemplo 1-2, que no se puede convertir a un número válido. El lanzador envía ahora el número de lucha, por ejemplo 2, y la edición por separado. El servidor reconstruye 1-2 y valida edición, participante, juego y token. Mantiene compatibilidad con el formato compuesto del puente anterior.

Esta corrección se aplica a los diez juegos. No reinicia partidas ni elimina intentos. Los intentos existentes sin terminar conservan sus datos y su tiempo; si ya venció la prueba, esta versión no concede otro intento.

## Detalles visuales

- Diez capturas reales ya existentes en assets/minigames/regaged-capturas, asignadas por clave del juego y con descripción. Se eliminan las ilustraciones genéricas del lateral de pelea.
- Corazón emoji ❤️ en Si ganas, Si pierdes y Si huyes; el texto ya no colorea su primera letra.
- Se conservan la entrada manual Luchar, el selector de disparo, los avatares sin nombres superpuestos y el guardado automático.

## Verificación y publicación

22 suites de pruebas, con lanzamiento simulado del código real y FlashVars numéricas para los diez juegos, y puente autenticado con esos mismos identificadores. Esto verifica el enlace de datos; queda pendiente confirmar la reproducción completa de cada SWF mediante Ruffle en el despliegue.

Desde esta carpeta:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

No requiere migraciones ni borrar la base de datos.
