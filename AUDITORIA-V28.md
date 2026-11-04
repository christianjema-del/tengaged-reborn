# Auditoría V28 sobre la V27 recuperada

## Corregido
- Perfil: renderizado SVG incrustado en DOM para que Safari muestre las capas y los diseños equipados. Reserva una imagen alternativa si la API falla.
- Probador de Tiendas: renderizado en DOM de la respuesta SVG para evitar que Safari oculte sus imágenes embebidas.
- Lectura de Tiendas: la ruta GET ya no instala los 10 diseños, evitando escrituras inesperadas en consultas públicas.
- Se mantiene la instalación de diseños de prueba mediante una acción POST autenticada para admin1.
- Tiendas informa claramente que los ciclos de 48 horas de Tengaged no equivalen a las reglas semanales de Regaged.

## Revisión y límites
- Se mantienen los apartados HTML de Comunidad, Juegos, Casting, Hunger, Minijuegos, Mafias, Blogs, Diseños, Tiendas, Tarjetas, Subastas y Hall of Fame.
- No se han migrado ni borrado tablas en Cloudflare D1.
- No hemos ejecutado transacciones con dos usuarios contra la base de datos de producción.
- La coincidencia geométrica de diseños continúa limitada: las capturas facilitadas son de 200x200 en vez de las capas PNG transparentes de 200x230.
- Los cuatro diseños activos, votación de tres días, subasta cada doce horas y tiendas semanales de Regaged no se han activado: requieren diseño de migraciones y comprobación de consistencia económica.

## Plan de prueba manual antes de admitir dinero real o volumen de usuarios
1. Con admin1 comprobar perfil y el avatar equipado en Safari.
2. Probar tres diseños en Tiendas, en especial pelo y piel.
3. Crear/abrir tienda de admin1, añadir stock y hacer una puja pequeña.
4. Desde una cuenta distinta con saldo, comprar un diseño una sola vez.
5. Verificar saldos antes/después, inventario de comprador, stock y ventas de vendedor.
6. Intentar comprar el mismo diseño de nuevo, sin cargo.
7. Abrir Casting y Hunger, comprobar que se ve el tiempo de actividad y que no se bloquea sesión.
8. Abrir Minijuegos y comprobar que ejecutan las pruebas de Casting, sin sustituirlas.
