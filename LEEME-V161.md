# V161 — Hunger 4 abierto y clasificación de Castings anteriores

## Qué cambia al publicar

1. En la primera visita a Hunger, la edición 4 en espera o activa se reinicia UNA sola vez.
2. Peach, Lamine, Cristi y PauCubarsi conservan sus inscripciones sin pagar de nuevo. Se retiran los demás tributos, incluidos los 26 bots, y quedan 26 plazas abiertas. Los cuatro recuperan sus recursos iniciales de una partida nueva.
3. Se borran de la partida nueva los combates, bajas y plazos de la ejecución anterior. Se conserva una copia privada completa en el estado de recuperación, junto con las operaciones económicas originales. La corrección no vuelve a cobrar entradas ni devuelve o repite regalos/compras anteriores.
4. Solo admin1 puede pulsar Iniciar. El tiempo transcurrido, llenar las plazas y completar con bots NO inician Hunger. Al pulsar Iniciar se usa el reparto inscrito, sin añadir bots automáticamente. Añadir bots queda como acción separada de admin1.
5. Al abrir Castings o consultar una partida, se corrigen los Castings TERMINADOS 1–5: todos los usuarios reales quedan delante de todos los bots. Se conserva el orden relativo anterior entre usuarios y entre bots; no se inventan puntuaciones ni se cambian las métricas de juego. Cada posición de 1 a N aparece una sola vez.
6. Se actualizan los resultados, el ganador, el historial del perfil y las victorias afectadas. Se abonan una sola vez las diferencias positivas de karma y T$ que falten, con protección ante solicitudes simultáneas y reintentos. No se duplican las partidas jugadas.
7. La tabla casting_recovery161 conserva la copia anterior de cada clasificación y el estado de aplicación. No se necesita ejecutar SQL manualmente.
8. Se conservan las reglas de V160 para partidas en curso: prioridad frente a bots para usuarios que escriban en el chat durante los últimos 90 minutos.

## Casting 5

Orden de los usuarios reales tras la corrección del resultado publicado:

| Puesto | Usuario |
| --- | --- |
| 1 | Fentanilo |
| 2 | MDMA |
| 3 | Ricardito |
| 4 | Peach |
| 5 | Lamine |
| 6 | cazweet |

Los bots ocupan del 7 al 20. El criterio es retirar la ventaja de bots manteniendo el orden previo de los humanos. No se recalculan resultados históricos con pruebas nuevas.

## Publicar desde el Mac

Descomprime Tengaged-V161.zip. Abre Terminal en la carpeta Tengaged-V161 que contiene wrangler.toml y ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Después abre /hunger y /casting-game?id=5 y refresca con Comando + Mayúsculas + R. Hunger debe mostrar a los cuatro inscritos, plazas libres y el botón Iniciar para admin1; no lo pulses hasta que quieras empezar. Abrir la sección de Castings aplica la corrección a los resultados anteriores.

Esta entrega es un paquete preparado: todavía no se ha publicado desde esta sesión. Mantén el binding DB del proyecto actual.

Lee REVISION-V161.md para el alcance y los límites de la verificación.
