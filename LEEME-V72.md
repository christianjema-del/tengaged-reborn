# V72 · Arranque móvil

- Portada renderizable sin depender de que `shell.js` cargue correctamente (`defer`).
- Se reducen SVG decorativos inicialmente generados en pantallas pequeñas.
- No se fuerza `location.reload()` al recibir el cierre de sesión desde otra pestaña.
- Protección contra fallos graves de scripts que deja enlaces navegables.
- Ajustes de anchuras móviles.

No se modifica la base de datos ni la lógica de Hunger. Si la pantalla en blanco se debe a un problema de red, DNS, caché de service worker o un fallo de un navegador concreto, aún puede requerirse diagnóstico en ese dispositivo.
