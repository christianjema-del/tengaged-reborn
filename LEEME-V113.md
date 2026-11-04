# Tengaged V113

Actualización completa sobre V112; conserva sus cambios.

- Chat: puntuación con signo y palabra «puntos» en todos los juegos, junto a los botones de voto en la cabecera, con espaciado basado en la segunda captura facilitada. Los votos de los comentarios propios aparecen grises y deshabilitados; el servidor mantiene el rechazo del autovoto. Pestañas de Hunger con texto horizontal.
- Hunger en inscripción: treinta plazas en tres filas de diez, con los mismos tamaños de retrato y anchura de fila existentes. Los inscritos se muestran en orden; las plazas libres repiten el fondo de Cornucopia. Es una presentación de espera: no se habilita comida ni ataques.
- Inicio de Hunger: se retira la presentación de treinta plazas y se vuelve a las diez plazas de juego; todos los participantes empiezan ocultos. No se reinician partidas que ya estaban activas.
- Móvil: desplazamiento horizontal limitado al recuadro de Cornucopia para conservar los retratos; márgenes reducidos, formulario compacto y botones táctiles. Se conserva la estructura de tres filas de diez.

78 pruebas automatizadas superadas, Worker compilado y revisión local de Chromium a 1440, 390 y 320 píxeles. Se ha comprobado el inicio de una partida local con treinta tributos ocultos y el color gris de los votos propios. No se han modificado partidas reales ni se ha publicado desde este chat.

```bash
cd ~/Downloads/Tengaged-V113
npx wrangler pages deploy . --project-name tengaged-reborns
```
