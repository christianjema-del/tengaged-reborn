# Tengaged V92 — Diseños y armarios

Actualización sobre V91. Conserva sus cambios de avatares, juegos, administración y compatibilidad.

## Publicar

Descomprime Tengaged-V92.zip y entra en la carpeta Tengaged-V92:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borres ni vuelvas a crear la base de datos. No hace falta ejecutar SQL manual.

## Cambios solicitados

En la primera petición que inicialice Diseños, Tiendas o el editor de avatar tras desplegar, se aplica una actualización única a la base existente:

- Retira de la galería y la venta el diseño 18, Ojos, de Cristi.
- Añade al armario de Cristi los diseños 21, 20, 19, 17, 15 y 16.
- Añade a admin1 el diseño 17, Bigotes (categoría Boca).
- No cobra dinero ni equipa las piezas automáticamente.

La actualización comprueba los siete IDs, títulos y autor que se observaron en la web antes de actuar. Si esos datos cambian antes del despliegue, no modifica los diseños equivocados. No se repite al recargar.

En Diseños, abre Mis diseños y entra en una creación propia. Aparecen Editar diseño y Eliminar diseño. Puedes cambiar título, descripción, precio, categoría e imagen; si no eliges imagen nueva se conserva la actual. Eliminar retira el diseño de la galería y nuevas ventas; Restaurar diseño lo recupera. Los inventarios existentes conservan las compras. No se permiten cambios mientras haya una subasta abierta ni cambiar la categoría de una pieza que otros usuarios ya tienen.

Las nuevas creaciones entran también en el armario de su autor. Para equiparlas: menú → Perfil/editor de avatar → Armario → elegir pieza → Guardar. Bigotes se encuentra en Boca y comparte esa capa con las otras bocas. No se ha añadido una capa independiente de accesorios.

## Verificación

Pruebas automatizadas de permisos, edición, retirada/restauración, subastas, actualización única e inventarios del editor, junto con la suite existente. Worker compilado. No se ha publicado desde este entorno ni se ha verificado visualmente en un teléfono físico.
