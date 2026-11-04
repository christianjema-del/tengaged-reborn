# V51 · Pantalla de pelea de Hunger

Incluye V50 y todas las versiones anteriores. Referencia: grabación de pantalla adjunta del 25/10/2026 a las 11:24.

- Vista dedicada al combatir: rivales, experiencia y armas, previsiones de salud, cuenta atrás, Huir y Volver al juego.
- Lateral con las cinco últimas luchas y catálogo de diez pruebas. La prueba sigue siendo aleatoria y compartida por ambos rivales; el catálogo no permite escoger otra prueba.
- Minijuegos originales de Casting mediante Ruffle, conservando sus pantallas Start, juego y final.
- Panel grande con puntos reales al terminar. El cliente confirma automáticamente el resultado registrado por el servidor. Si falla, Actualizar arena reintenta la misma operación y Guardar puntuación permite confirmación manual.
- Mientras falta el rival, el panel indica espera. Al resolver muestra victoria, derrota o sin vencedor y el daño real disponible. No se confunde la finalización de la prueba con ganar la lucha.
- Volver al juego permite regresar a la arena y Volver a la pelea reabre el combate sin iniciar un segundo intento. La página conserva el minijuego durante las actualizaciones.
- Las armas y experiencia iniciales del duelo se entregan solo a los participantes como parte del combate activo; los tokens del rival no se exponen.

No se modifica la duración ni se limita la selección a Match Three. Se conservan los diez minijuegos ya habilitados.

## Publicar

Desde esta carpeta:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

No requiere borrar datos ni ejecutar migraciones. Los combates antiguos sin metadatos de arma pueden mostrar menos información.

Se han inspeccionado fotogramas de la grabación. La disposición reproduce lo observable; no se certifica equivalencia píxel a píxel. Las miniaturas del catálogo y los avatares son los de este proyecto. Queda pendiente verificar visualmente el despliegue y Ruffle en navegador.
