# Tengaged Reborn V18 — Corrección de diseños de Regaged

Los diez diseños enviados por el usuario están incluidos en la aplicación. Al abrir **Diseños** o **Tiendas** mientras hay una sesión autenticada como `admin1`, el servidor crea automáticamente los diseños faltantes en Cloudflare D1. No es necesario pulsar ningún botón. La operación no duplica los diseños en visitas sucesivas.

**Publicación:** esta función solamente se ejecutará en la versión desplegada. Subir el ZIP o descargarlo no modifica la base de datos pública. Descomprime y publica desde la carpeta raíz:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

**Comprobación:** entra como `admin1` → Diseños → busca los títulos `[REGAGED]`. Si no aparecen, revisa la respuesta de `/api/designs` y los logs del servidor. Para probar una compra, crea tu tienda en Tiendas, añade stock y oferta, consigue un escaparate activo, y usa una segunda cuenta. Las pujas y cobros se hacen con T$ de prueba; no se alteran automáticamente.

**Nota:** el origen de las imágenes son las capturas aportadas en el chat; su atribución como propiedad intelectual del creador original no se ha podido verificar. El usuario `admin1` se utiliza como cuenta de pruebas, no se afirma que haya creado estas piezas.
