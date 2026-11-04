# V157 — Mis juegos del perfil

Incluye íntegra V156. El historial muestra siete juegos por página; 8 juegos generan dos páginas y 23 generan cuatro. En ordenador las siete fichas se ajustan al ancho disponible y no requieren desplazamiento horizontal. En móvil se distribuyen en cuatro y tres, conservando siete entradas por página.

Conserva las fichas originales de cada juego y los puestos. Fichas escalables sin recortes; etiquetas azules, fecha abreviada, indicador F para modalidades rápidas y paginación numérica. No modifica partidas, premios, karma, T$, avatares o cuentas.

Comprobación: 127 pruebas automatizadas correctas; historial en navegador Chromium a 1440, 1024, 800, 768, 390 y 320 píxeles, con 0, 1, 7, 8, 14, 15 y 23 entradas; revisadas todas las páginas, ausencia de tarjetas ocultas y etiquetas sin desbordamiento. No se ha probado directamente en Safari real.

Descomprime y publica desde la carpeta Tengaged-V157:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Esta publicación no vuelve a ejecutar los ajustes históricos de premios ya aplicados.
