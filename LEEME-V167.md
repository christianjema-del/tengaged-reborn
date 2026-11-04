# V167 — Tiendas y Minijuegos visibles en la cabecera

Orden visual y de navegación: Blogs, Grupos, Diseños, Tiendas, Mafias, Minijuegos, Juegos y desplegable. Mismo encabezado clásico en todas las secciones. En pantallas de hasta 1000 px se adapta en filas para que las siete pestañas y el desplegable no se salgan del ancho. Entrar y Registrarse están en el desplegable para invitados.

Tiendas dirige a /shops.html sin seleccionar una tienda: se presentan exactamente las tres opciones actuales, Tiendas de jugadores, Subastas y Niveles de color. La ruleta diaria conserva su enlace propio en las pestañas y menú de tiendas, sin aparecer como una cuarta tienda.

Minijuegos mantiene las diez pruebas, lanzadores, puntuaciones, reglas y rankings existentes. El código de los motores y todas las Functions es idéntico a V166. Incluye todas las correcciones de V166, perfiles, clasificaciones y Hunger 4.

Validación: seis archivos de pruebas relevantes correctos (tiendas, regalos, ruleta, cabecera, pruebas Casting y Hunger). Navegador Chromium: orden exacto de siete pestañas, selector de tres tiendas, entrada a Minijuegos desde la cabecera. Verificados anchos 320, 390 y 900 sin desbordamiento horizontal y escritorio con cabecera en una fila. No se ha probado Safari físico.

## Publicar
Descomprimir Tengaged-V167.zip y ejecutar por separado:

```sh
cd /Users/christianmonzonlorente/Downloads/Tengaged-V167
```

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```
