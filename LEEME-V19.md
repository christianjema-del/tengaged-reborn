# V19 – Probador de diseños y operaciones de Tiendas

- En Tiendas → Tiendas de jugadores → una tienda, pulsa **Probármelo en mi avatar** sobre un producto.
- En la ficha de Diseños también se puede probar una pieza.
- La vista previa utiliza el avatar y el equipamiento guardado y cambia temporalmente la capa seleccionada, sin compra, cargo ni modificación en D1.
- Un diseño de categoría «perfil» es un aspecto completo; se muestra entero, no mezclado con las capas del avatar.
- Las compras y las pujas utilizan disparadores SQLite/D1 para cobrar y entregar de manera atómica; conviene comprobar su comportamiento en un entorno de pruebas antes de aceptarlo como verificado.
- Los diseños cargados a partir de capturas de Regaged pueden tener fondo y dimensiones distintos a las capas nativas. Su colocación visual es aproximada y no implica archivos originales de avatar con transparencias perfectas.
- No se ha realizado ningún despliegue ni compra real en la cuenta del usuario.
