# V168 — Publicidad según sesión, etiqueta y tarjetas en menciones

Incluye V167 completa: siete pestañas, selector de tres tiendas, ruleta, minijuegos, perfiles y correcciones de Castings/Hunger.

El GIF superior promocional de perfiles y entradas de blog solo aparece para invitados cuya sesión se haya comprobado. Se oculta durante la comprobación inicial y cuando hay una cuenta conectada, aunque se visite el perfil de otro usuario. No elimina la imagen lateral del selector de juegos.

La etiqueta Administrador/Moderador está junto al nombre del perfil, dentro de un contenedor flexible. Puede pasar a otra línea en anchos pequeños sin superponerse al nombre ni a las estadísticas. Conserva la visibilidad por rol y el color de la etiqueta.

Las referencias de texto a perfiles y menciones @usuario muestran delante la tarjeta actualmente equipada. Consulta pública por lotes de hasta 50 nombres, sin datos privados. No duplica las tarjetas existentes ni modifica los enlaces que contienen avatares. Las menciones nuevas del chat o de contenido actualizado se procesan sin interpretar HTML. Se corrige el reconocimiento de menciones seguidas de un punto en biografías y listas de menciones.

Donaciones: se separa el error de actividad del contador y se incorpora Reintentar perfil ante fallo de consulta. La actividad admite tablas antiguas de miembros que usan joined_at en lugar de created_at. Se han comprobado esas variantes con SQLite; no se ha confirmado la causa exacta del error de producción mostrado, porque las consultas externas a ese endpoint agotaron el tiempo de espera.

Validación: 129 archivos de pruebas correctos. Comprobación local en Chromium de perfil autenticado con GIF oculto, invitado con GIF visible, etiqueta junto a admin1 sin solapamiento, móvil de 320 px sin desbordamiento ni cruce de etiqueta con estadísticas. Mención a Peach con tarjeta Azul y a admin1 con Blanco. API de colores probada contra inyección, duplicados, mayúsculas, límite de consultas y datos privados. No se ha probado Safari físico.

## Publicar
Descomprimir y ejecutar por separado:

```sh
cd /Users/christianmonzonlorente/Downloads/Tengaged-V168
```

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```
