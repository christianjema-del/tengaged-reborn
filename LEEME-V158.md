# V158 — Frookies: PoV automático y final de cuatro

Incluye íntegra V157 y sus cambios anteriores.

- Si el ganador del PoV está nominado, se salva automáticamente al conocerse el ganador. Se abre directamente la nominación de sustitución del HoH y no necesita pulsar Vetar ni Guardar. Un PoV no nominado conserva la decisión de salvar a otro o guardar sin usarlo.
- En la ronda 10, con cuatro jugadores, el HoH asigna tercero y cuarto con los botones amarillos bajo los avatares. Cuando reúne HoH y PoV, marca los dos puestos entre los otros tres; el restante es el segundo finalista por descarte. Si HoH y PoV son distintos, ambos conservan su inmunidad y el HoH ordena a los otros dos: basta elegir uno de los puestos y se deduce el restante.
- Se elimina el paso de elegir al segundo finalista y su recuadro rojo. Los cambios guardados se aplican al siguiente cambio de minuto, como las demás decisiones.
- Las partidas que estén esperando la decisión de un PoV nominado o en los pasos antiguos del final se adaptan al consultarlas, sin reinicio, sin cuotas nuevas y sin borrar participantes, puntuaciones ni premios. Se respetan las decisiones finales ya guardadas.
- Una actualización de lectura que llegue después de un guardado ya no puede reemplazarlo por datos anteriores. Las selecciones locales conservan los avatares y los botones no se desvanecen al guardar; en táctil los botones de puestos tienen al menos 44 px de alto.

## Publicar

Descomprime y ejecuta desde la carpeta Tengaged-V158:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No es necesario ejecutar SQL ni repetir las correcciones de premios.

## Comprobaciones

132 pruebas automatizadas correctas: autosalvación humana y de bots, sustituciones e inmunidades, PoV opcional de no nominados, elección del HoH, descarte del finalista, permisos y datos inválidos, adaptación de fases antiguas, guardado al minuto, reintentos simultáneos de API, jurado, premios sin duplicar, puntuaciones privadas y ciclo completo del juego.

La página real, conectada a estados de prueba del motor, se comprobó en Chromium a 1440, 1024, 768, 390 y 320 píxeles: botones bajo avatares, ausencia del recuadro rojo, autosalvación, finalistas, avatares decodificados, selecciones sin sustituir imágenes, respuesta de lectura retrasada y ausencia de desbordamiento de página. El reparto de 13 avatares mantiene su desplazamiento horizontal local en móvil. No se ha probado directamente Safari real ni las sesiones privadas de todos los usuarios en producción.
