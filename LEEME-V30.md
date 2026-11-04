# V30 · Regalos y armario de avatar
Paquete completo a partir de V28 auditada y las funciones de servidor de V29.
Corrige la ausencia del botón Regalar y lo muestra también en el directorio de tiendas.
Editar avatar muestra miniaturas de todos los diseños del inventario, comprados o regalados.
Probar o quitar una pieza solo cambia la vista previa. Guardar cambios aplica los rasgos y piezas juntos.
Deshacer cambios restaura la apariencia guardada. No se permite equipar diseños ajenos ni en otra categoría.
Los diseños de perfil se muestran en el armario identificados como diseños de perfil; no son prendas.
Compras y regalos requieren tienda activa y existencias. Si falta escaparate, el botón muestra el motivo.
Las pruebas de interfaz usan un DOM simulado y las del servidor SQLite. No sustituyen una revisión visual tras publicar.
Validación: 5 conjuntos de pruebas superados (tienda, regalos, armario, vista previa, Casting y chat).
Publicar desde esta carpeta:
npx wrangler pages deploy . --project-name tengaged-reborns
