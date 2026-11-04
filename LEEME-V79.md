# V79 · Revisión visual general

Paquete completo basado en V78: incluye Casting diario y Hunger V77. No es un parche para copiar encima de V77: publica el contenido de esta nueva carpeta completa.

## Publicación

Descomprime el ZIP y abre Terminal:

```
cd ~/Downloads/Tengaged-Reborn-V79-REVISION-VISUAL
npx wrangler pages deploy . --project-name tengaged-reborns
```

Si has descomprimido en otro directorio, usa esa ubicación. No borres ni reinicies D1. Tras desplegar, `/api/health` debe responder `version:79` y `build:V79-REVISION-VISUAL`.

## Cambios

- Perfil: círculos originales del sprite master.gif de Regaged, 58 × 58 píxeles. Casting/Fasting azul, Survivor verde, Rookies/Frookies rosa y Hunger con el emblema negro. Se conservan puesto o acceso, estado, número de juego, fecha, paginación y enlaces a los resultados de ediciones antiguas.
- Perfil: distribución de avatar/estadísticas, descripción amarilla, títulos, amigos, regalos, blog y banner de inscripción. En móvil el historial se desliza sin deformar los círculos.
- Cabecera: navegación compacta, color azul, estado de sesión y todas las secciones existentes. En móvil los destinos se desplazan horizontalmente.
- Juegos: banners originales de colores, subastas, tiendas, inscripción y Stars; tablas compactas con los colores de formato y feed de mensajes.
- Tiendas: banners originales conservando compras, pruebas de avatar, pujas y administración de tienda.
- Diseños: dos listas compactas, miniaturas de 62 píxeles, autor, descripción, votos y comentarios. La vista de detalle y el formulario de subida se conservan.
- Blogs: lista compacta con avatar, título, autor, extracto, votos y comentarios. El texto íntegro sigue en la página de la entrada.
- Grupos: tarjetas, emblemas, temas y respuestas. Mafias, clasificación, regalos, correo, edición de perfil, inscripción, ayuda y normas comparten la tipografía, bordes, botones y espaciado revisados.
- Minijuegos: menú compacto, capturas existentes de las diez pruebas y reproductor integrado. En teléfono el catálogo se distribuye en dos columnas sobre el reproductor.
- Inicio: anchura, paleta, bloques informativos, títulos y feeds ajustados al estilo de referencia.
- Los archivos compartidos usan consultas de versión 79 para invalidar la caché.

## Validación y alcance

39 archivos de pruebas superados. Worker compilado con Wrangler 4.152.0. Comprobados identificadores HTML, referencias locales y sintaxis CSS. Las pruebas nuevas comprueban los sprites de perfil, enlaces, textos accesibles y paginación; las anteriores verifican motores, economía y componentes existentes.

La revisión se contrastó visualmente con las páginas públicas de perfil, juegos, diseños, blogs, grupos y minijuegos de Regaged. Los círculos y los nuevos banners usan los archivos originales guardados localmente. Se mantiene el nombre y las funciones propias de Tengaged Reborn.

No se ha comprobado la presentación de esta versión local en un teléfono físico ni se ha desplegado desde este entorno. No se afirma una equivalencia visual 1:1 de todas las pantallas ni una réplica del código privado de Regaged. Las secciones sin una referencia específica usan el estilo común revisado.

Consulta REVISION-VISUAL-V79.md para las referencias utilizadas y el alcance por sección.
