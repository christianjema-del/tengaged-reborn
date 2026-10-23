# Tengaged Reborn

Cloudflare Pages + Pages Functions + D1.

API inicial:
- GET /api/health
- POST /api/register
- POST /api/login

El proyecto requiere el binding D1 `DB`.

## Comunidad

- `/community.html`: blogs, Hall of Fame, diseños y tienda.
- `/game.html`: partida del casting con llaves y manzanas.
- `/profile.html?username=...`: perfil público y personalización.
- `/admin.html`: panel privado de `admin1` para moderar usuarios, entregar karma/T$ y crear cuentas de prueba.

Las cuentas de prueba se generan desde el panel; las contraseñas aleatorias se muestran una sola vez. Cada jugador del casting empieza con 3 manzanas y 100 de salud. Una prueba consume 20 de salud; una manzana recupera 20. Ganar inmunidad entrega una llave, que añade peso al voto de nominación y se consume al votar.

El esquema adicional de perfil, comunidad, casting y recursos se prepara de forma compatible con la base D1 existente cuando se consulta cada API.
