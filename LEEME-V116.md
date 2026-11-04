# Tengaged V116 · Ruleta diaria

Actualización completa sobre V115. Añade una cuarta tarjeta de destino en la portada de Tiendas y una pestaña «Ruleta diaria».

Cada usuario autenticado tiene una tirada gratuita por día del calendario de Europe/Madrid. Se renueva a las 00:00 de España peninsular, incluidos los cambios de horario de verano/invierno; no hay que esperar 24 horas desde la tirada. La casilla de 0 también consume la tirada.

16 casillas equiprobables: 6 × 20 T$, 4 × 50 T$, 3 × 75 T$, 1 × 100 T$, 1 × 300 T$ y 1 × 0 T$. La elección aleatoria y el importe se calculan en servidor. Registro único por usuario/día y abono en la misma operación mediante trigger de base de datos: recargar, reintentar o enviar peticiones simultáneas no duplica el premio. No se acepta un premio ni una fecha elegidos por el navegador.

Diseño con los colores de la web, animación, resultado persistente, saldo y cuenta atrás del próximo reinicio. Se adapta a teléfono y PC; respeta la preferencia de movimiento reducido. Los visitantes pueden ver la ruleta y sus probabilidades, pero necesitan iniciar sesión para girar.

80 pruebas automatizadas superadas y Worker compilado. Se prueban permisos, origen de petición, concurrencia, premios manipulados, próximo día, días de 23/25 horas y reversión del abono si falla la operación. Navegador local: 1440, 390 y 320 píxeles sin desbordamiento horizontal, tirada y abono, animación, recarga y vista de visitante. No se ha publicado desde este chat ni se han alterado saldos reales durante las pruebas. No requiere ejecutar una migración manual: las tablas se crean al acceder a la ruleta.

```bash
cd ~/Downloads/Tengaged-V116
npx wrangler pages deploy . --project-name tengaged-reborns
```
