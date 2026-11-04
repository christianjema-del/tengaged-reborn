# V74: estabilidad y teléfonos

- Comprobación independiente sin JS: `/diagnostico.html`.
- Diagnóstico del servidor actualizado: `/api/health` devuelve `version:74`.
- Diseño responsive defensivo: `mobile-stability.css`.
- Cache bust de CSS/JS en páginas HTML y cabeceras anti caché en HTML.
- Publicación validada con `PUBLICAR-Y-COMPROBAR.command`: usa siempre la URL exacta `https://<hash>.tengaged-reborns.pages.dev` del despliegue.

**Limitación:** si Safari indica «el servidor no responde» y `/diagnostico.html` tampoco carga en la URL *exacta* publicada, la incidencia es de conectividad/DNS/Cloudflare y no puede repararse editando JavaScript. La URL fija del proyecto puede no estar accesible aunque una URL hash sí lo esté. No modifica cuentas ni base de datos.
