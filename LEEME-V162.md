# V162 — Blogs clásicos y compatibilidad

Incluye íntegramente las correcciones V161 de Hunger 4 y Castings. No vuelve a ejecutar una recuperación V161 ya registrada.

## Blogs
Listado basado en la captura y HTML/CSS/JS archivados de Tengaged.es de 2015. Columnas de 510 y 380 px, avatares de 40 × 46 px, tipografía, colores, etiquetas, trending, diseños, TOP diario, carga de 15 entradas por Continuar sin duplicados. Página individual y blog por autor, avatar de 140 × 161 px, publicaciones, comentarios, votos definitivos, compartir y RSS. URLs /posts, /posts/topic/tema y /blog/usuario/id/titulo; enlaces anteriores siguen funcionando. Los textos de usuarios se muestran sin ejecutar HTML. Ocultar comentarios conserva su contenido almacenado.

En móvil las columnas se apilan y se amplían texto y controles. Se mantienen las proporciones de imágenes. Los datos son los del sitio actual: no se importan cuentas ni publicaciones antiguas.

Los archivos de Wayback no conservan toda la lógica privada del servidor ni la imagen personal lateral de Doby. Se usa una cabecera lateral genérica con el avatar real del usuario. Por ello no se afirma identidad absoluta de cada píxel ni de reglas internas no disponibles. Los servicios sociales desaparecidos no se reintroducen.

## Safari
Se detectaron dependencias sin alternativa para Safari antiguo: Object.hasOwn, Array.at y crypto.randomUUID. Se añaden alternativas, conservando generación criptográfica de identificadores. El renderizado de avatares dispone de alternativa SVG cuando canvas falla y evita esperas indefinidas. Todas las páginas cargan el bootstrap de compatibilidad antes de los módulos.

Si la inicialización se atasca, se muestra una recuperación visible y diagnóstico. Esto no permite confirmar la causa del fallo concreto en el iPhone del usuario: no se ha probado Safari real ni se ha observado su mensaje de error. Tampoco corrige restricciones de red/DNS o navegadores que no soporten la sintaxis del proyecto. Si continúa tras publicar, enviar captura del mensaje y versión iOS/Safari.

## Validación
123 archivos de pruebas automatizadas correctos, incluidos votación inmutable concurrente, paginación estable, permisos, comentarios conservados, RSS, rutas, compatibilidad y alternativas de avatar. Revisión visual en Chromium de listado, entrada y blog personal; contenedores móviles de 390 y 320 px sin desbordamiento, imágenes decodificadas y tamaños verificados. Continuar añade la siguiente página y el voto aumenta la puntuación y bloquea ambos controles. No se han modificado datos de producción desde este entorno.

## Publicar
Descomprimir Tengaged-V162.zip y abrir Terminal en la carpeta Tengaged-V162 que contiene wrangler.toml:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

No es necesario actualizar npm. Probar primero en Safari la URL nueva del despliegue y después el dominio habitual. No borrar datos de Safari como primer paso: puede cerrar la sesión.
