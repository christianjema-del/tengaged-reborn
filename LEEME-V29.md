# V29 · Compras y regalos
Parte del paquete completo V28 AUDITADA.
- Añade Regalar a los productos de tiendas de usuarios, con destinatario y precio.
- El comprador paga; el destinatario recibe el diseño; el vendedor cobra y baja una unidad de stock en una sola operación.
- Impide regalar a uno mismo, al propietario, a cuentas bloqueadas y a quien ya tiene el diseño.
- Explica el bloqueo de compra y regalo cuando la tienda está fuera de escaparate.
- Las compras requieren escaparate activo, como en V28. El propietario puede pujar y admin1 cerrar la ronda de prueba.
- Incluye regalos en las últimas ventas y evita mostrar Comprar para artículos ya adquiridos.
- Conserva archivos y configuración de V28. No borra cuentas ni inventarios.
Validación: pruebas de compras/regalos con SQLite, Casting y chat superadas. No publicado desde este entorno.
Publicar desde esta carpeta:
npx wrangler pages deploy . --project-name tengaged-reborns
