V27 — recuperación del inicio de sesión y Tiendas
- /api/me evita múltiples migraciones D1 en cada carga y no reescribe cookies con valores nulos.
- La cabecera limita la espera a 10 s y ofrece reintentar si la API falla.
- La portada de Tiendas se dibuja inmediatamente aunque fallen las peticiones de saldo.
- Las secciones de Tiendas muestran errores y botón reintentar en vez de panel blanco.
- No se modifican ni borran usuarios, sesiones, saldos o tiendas.
- Si /api/me sigue sin responder, revisar Workers & Pages > Logs y binding D1 del proyecto.
