# V155 · Tarjetas GIF animadas con T

Versión completa sobre V154. Incluye la corrección de visibilidad durante las actualizaciones y todos los cambios anteriores.

Las seis tarjetas cuya R se había sustituido por una T usan ahora GIF nativos animados, en lugar de un SVG con un GIF incrustado. TV Star, Ultra Gold, Titanio, Holofoil, Prisma y Diamante conservan la T en todos sus fotogramas.

Se mantienen las dimensiones de 40 × 28, el número de fotogramas, sus duraciones y la repetición infinita de los originales. Plata, Oro, Cielo y Sangre conservan sus GIF originales. No se modifican precios, requisitos, niveles, saldos ni tarjetas equipadas.

El catálogo compartido actualiza las imágenes en perfil, tiendas, rankings y los demás apartados que utilizan las tarjetas. Se renuevan los enlaces de recursos para que el navegador no reutilice el catálogo anterior.

Comprobaciones: 126 pruebas automáticas correctas, validación de GIF y tiempos de fotogramas y prueba de animación real mediante el renderizador de tarjetas en navegador a 1440 y 390 px. Compilación de Functions correcta.

Para publicar, descomprime y ejecuta dentro de Tengaged-V155:

cd ~/Downloads/Tengaged-V155
npx wrangler pages deploy . --project-name tengaged-reborns

Espera Deployment complete! y abre el enlace nuevo. No requiere SQL ni reiniciar partidas. Todavía no se ha publicado automáticamente en tu web.
