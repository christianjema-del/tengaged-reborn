# Tengaged Reborn V64 — Armario admin1 y Hunger

Se conserva la base funcional V63. El armario de `admin1` incorpora una pieza privada «Avatar de cuadros · admin1», basada en la imagen PNG aportada por el usuario. Puede probarse, guardarse y retirarse mediante el editor de avatar; el resto de cuentas no puede equiparla.

La imagen original tiene un encuadre parcial (no incluye las piernas). Se utiliza tal cual, sin inventar partes del cuerpo que no aparecen en la imagen. La pieza se monta como una capa completa para evitar mostrar detrás la ropa/rasgos predeterminados.

Se conservan las dianas efímeras: cuando una diana se reclama o expira, `/api/game-chat` deja de incluirla en las respuestas del chat. La adjudicación es atómica con la actualización de estado de la partida.

Verificaciones realizadas: `node --check` de los JS editados; pruebas del avatar, feed y motor de Hunger pasan. `tests/hunger-ui.test.mjs` contiene una aserción de interfaz que sigue fallando en esta base y debe revisarse posteriormente. Comprobar en Cloudflare la edición y persistencia del outfit en la cuenta real.
