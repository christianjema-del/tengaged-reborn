Tengaged Reborn V26 — primera tienda y pruebas económicas

1. Publica la V26 en Cloudflare Pages (no se despliega automáticamente).
2. Accede con admin1 a /shops.html?tab=manage y pulsa «Preparar primera tienda de prueba».
   La acción es idempotente: crea la tienda si falta y añade hasta tres de los diseños existentes con 5 unidades a 10 T$ cada uno.
   No cambia los saldos.
3. Si la tienda está inactiva, realiza una puja mínima de 1 T$ y utiliza «Cerrar ronda de pruebas ahora».
   Esta puja SÍ cuesta T$; no es reembolsable.
4. Accede con una segunda cuenta diferente que tenga al menos 10 T$ y compra un diseño.
5. Verifica que el comprador pierde 10 T$, admin1 recibe 10 T$, el inventario del comprador añade el diseño
   y el stock de la tienda disminuye de 5 a 4.
6. Repite la compra del mismo diseño para comprobar que se rechaza sin cobrar.
7. Revisa la lista de Últimas ventas de admin1.

En Casting y Hunger se muestra únicamente el tiempo transcurrido (0 min, 5 min...) sin el texto «Última conexión».

Advertencias:
- No se ha ejecutado ningún cambio ni venta en la web pública; hay que desplegar la versión y realizar las operaciones.
- La validación de operaciones económicas debe probarse en D1 con dos usuarios antes de darla por concluida.
- Los diseños de ejemplo proceden de imágenes enviadas por el usuario y podrían necesitar correcciones de alineación.
