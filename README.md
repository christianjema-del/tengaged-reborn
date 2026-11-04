# Tengaged V99 — Compatibilidad y refuerzo

Versión completa sobre V98. Conserva las partidas, usuarios, avatares e inventarios existentes, el desafío con la distribución de la grabación y sus resultados públicos.

## Publicar

Descomprime y ejecuta dentro de Tengaged-V99:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No reinicies D1 ni borres juegos.

## Refuerzo de carga y recuperación

- Las consultas simultáneas de sesión comparten una sola petición. Un fallo transitorio no borra la sesión del servidor.
- Al recuperar Internet o restaurar una pestaña desde la caché del navegador se vuelve a consultar el estado de sesión, Casting, chat y desafío. Los cambios pendientes de Hunger requieren su reintento explícito con el identificador ya existente.
- Estos eventos no repiten compras, votos, entradas a juegos ni envíos de puntuación: actualizan información mediante lectura.
- La carga del script local de Ruffle tiene un límite de 30 segundos, limpia el intento fallido y permite volver a cargarlo.
- La inicialización del minijuego tiene un límite de 60 segundos y retira el reproductor incompleto al fallar. Este límite se desactiva cuando el juego carga correctamente; no limita ni interrumpe una prueba en marcha.
- Si falla la carga, el desafío muestra un botón de reintento y no intenta crear reproductores nuevos cada cinco segundos. Los controles de propiedad, día, puntuación y permisos del servidor se conservan.

## PC y móvil

- Márgenes seguros para pantallas con recortes mediante viewport-fit y safe-area.
- Menú con desplazamiento vertical, límites de altura y adaptación a pantallas bajas en horizontal.
- Áreas táctiles amplias y entradas de texto de 16 px en móvil para evitar ampliaciones al enfocarlas.
- Contención de textos largos, columnas y tablas; ajustes en pantallas de 380 px o menos.
- Alternativa de altura para navegadores sin soporte de aspect-ratio, manteniendo el reproductor dentro del ancho disponible.
- Respeto por la preferencia de movimiento reducido. No se bloquea el zoom de accesibilidad.

Se utiliza el mismo reproductor local y los mismos SWF originales. Las pruebas que requieren teclado conservan sus controles originales; esta versión no incorpora un mando virtual ni certifica todos los juegos en todos los teléfonos.

## Comprobación del aviso anterior

Se comprobaron la portada, el desafío y el endpoint de salud de la versión publicada: respondían y la versión instalada era V98. El usuario confirmó después que volvía a cargar. No se atribuye el fallo transitorio a una causa que no pudo reproducirse.

## Diseños nuevos de Cristi

Las seis imágenes JPEG nuevas no se han añadido en esta versión. Tienen fondo opaco; la preparación automática del primer cuerpo fue bloqueada por la herramienta de edición. No se ha reemplazado el dibujo ni añadido capas defectuosas. La incorporación queda pendiente de disponer de los originales PNG con transparencia. Los diseños que Cristi ya tenía siguen en su inventario.

## Verificación

64 archivos de pruebas superados. Nuevas verificaciones de carga compartida de sesión/reproductor, límites de espera, limpieza y reintento. Conserva pruebas de permisos, operaciones económicas, guardado de puntuación, histórico y resultados. Worker compilado, HTML y referencias locales comprobados. No se ha publicado desde este entorno ni probado visualmente en un teléfono físico.
