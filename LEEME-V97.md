# Tengaged V97 — Clasificación de desafíos de Casting

Actualización completa sobre V96, conservando las correcciones de carga, diseño, votos y el desafío en página independiente.

## Publicar

Descomprime y ejecuta dentro de Tengaged-V97:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No hace falta SQL manual ni reiniciar juegos.

## Resultados debajo del desafío

La página del desafío incorpora una clasificación con los concursantes que siguen activos. Usa exclusivamente puntuaciones guardadas del minijuego:

- Nombre y «Ha terminado la prueba con 650 puntos.» con la cantidad real.
- «Pendiente» si todavía no existe resultado; 0 puntos guardados se muestra como 0, no como pendiente.
- Orden de mayor a menor puntuación, pendientes al final y empates con la misma posición.
- El usuario actual queda resaltado y los bots se identifican como tales.
- Se actualiza con la consulta de la página cada cinco segundos, sin recargar ni interrumpir la prueba.
- Los expulsados no aparecen, tampoco al consultar la clasificación de un día anterior.

Los resultados de cada día se archivan al cerrarse la jornada. Aparecen enlaces Día 1, Día 2, etc. para los días disponibles. Una puntuación anterior no se mezcla con la nueva prueba. Los días cerrados antes de instalar esta actualización que no tengan datos conservados no se inventan: muestran que no hay resultados guardados. Los resultados del día que siga activo al desplegar sí están disponibles.

La publicación muestra solo nombre, condición de bot y puntuación; no publica salud, votos privados ni los tokens de los intentos. La clasificación no altera los pesos de nominación ni las normas del Casting.

Los números 650 y 600 utilizados en el chat son ejemplos de presentación; no se asignan a admin1 o Cristi en producción.

## Verificación

62 archivos de pruebas superados. Incluye resultados reales, cero frente a pendiente, empates, exclusión de expulsados, histórico por día, formato de lista y comprobaciones de privacidad; también la suite existente de minijuegos y de la página independiente. Worker compilado y sintaxis/HTML verificados. No publicado desde este entorno ni comprobado en un teléfono físico.
