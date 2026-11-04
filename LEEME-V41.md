# V41 · Corrección de carga

Paquete completo con Hunger V40 y todas las funciones anteriores.

## Fallo reproducido

En la web publicada, Hunger carga sus datos, pero la cabecera pasa de «Comprobando sesión» a «No se pudo cargar la sesión · Reintentar». Esto impide que las secciones dependientes del usuario terminen de cargar. El endpoint /api/me estaba preparando toda la comunidad y el catálogo de tiendas para comprobar la sesión. Esa cadena incluía decenas de escrituras secuenciales y podía superar el tiempo de espera de la interfaz.

## Corrección

- /api/me consulta la sesión y el saldo directamente: no ejecuta migraciones de avisos ni de tiendas.
- La cuenta Tengaged se prepara desde registro, correo y regalos, usando únicamente las tablas necesarias para los avisos; ya no depende de inicializar grupos y todo el catálogo.
- La migración de cuentas inspecciona las columnas existentes y evita intentar siete ALTER TABLE repetidos.
- La actualización del catálogo se agrupa en una transacción y la preparación de tablas de comunidad en otra, evitando decenas de viajes secuenciales a D1.
- Hunger muestra un error y permite reintentar si la conexión supera doce segundos.
- Se cambia la versión del script de cabecera en todas las páginas para obtener la corrección sin conservar el código anterior.

No borra cuentas, avatares, inventario, saldo ni partidas. Las bienvenidas y avisos de regalos siguen funcionando y tienen pruebas de regresión. La corrección necesita desplegarse; este entorno no tiene las credenciales de Cloudflare.

## Publicar

Extrae el ZIP, abre Terminal y ejecuta:

```bash
cd ~/Downloads/Tengaged-Reborn-V41-CARGA
npx wrangler pages deploy . --project-name tengaged-reborns
```

La comprobación del servidor público se realizó sobre V40: se observó el fallo de sesión y la carga de Hunger. V41 se verificó con las pruebas locales; no se ha publicado desde este entorno.
