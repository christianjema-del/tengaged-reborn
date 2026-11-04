# V80 · Casting ajustado a la captura

Paquete completo sobre V79. No borres la base de datos ni copies solo el CSS.

## Publicar

```
cd ~/Downloads/Tengaged-Reborn-V80-CASTING-REFERENCIA
npx wrangler pages deploy . --project-name tengaged-reborns
```

Usa tu ruta real si lo has descomprimido en otra ubicación. También puedes abrir PUBLICAR.command. Después de publicar, `/api/health` debe mostrar `version:80` y `build:V80-CASTING-REFERENCIA`.

## Cambios de Casting

Se toma como referencia la captura «Captura de pantalla 2026-10-26 a las 7.35.38.png» y https://regaged.com/game/cmvoevwe00h5bkaa5wnc0h8fo.

- Dos filas de diez avatares en escritorio, con la distribución medida en la página: contenido de 946 px, roster de 633 px, separación de 12 px y recursos de 301 px. Cada asiento mide 119 px de alto, con imagen de 73 px, nombre, conexión y marca de estado. En el teléfono se distribuyen en cinco columnas.
- Panel original de Casting con llaves, salud, checks y calendario; proporciones y posición de números ajustadas. Pulsar el icono naranja de checks registra actividad sin añadir un botón extra debajo del panel.
- Botón Competition amarillo como en la captura. Se abre el panel del desafío al pulsarlo; no se inicia automáticamente. Si ya se completó, muestra el resultado guardado.
- Pestañas dibujadas originales del sprite master.gif, incluyendo las cuatro variantes activo/inactivo, contador de comentarios y navegación por teclado. Los privados siguen siendo privados de cada partida.
- Chat público con caja amarilla, botón Send, página 1 y cabecera de Big Brother. Los frascos originales se muestran a 40 × 50 px y la llave a 46 × 25 px, con sus botones y reclamaciones reales.
- Panel lateral con Day, normas cerradas inicialmente, Latest Castings blogs #castings y Game Story. Los blogs proceden del contenido real publicado con esa etiqueta; no son ejemplos ficticios.
- Las inscripciones y el aviso inicial ya no llenan Game Story. Se conservan los eventos de progreso y eliminación.
- Pie con los destinos que existen en Tengaged Reborn; no se añaden enlaces vacíos a secciones que solo tiene Regaged.
- CSS exclusivo de Casting cargado después del tema general para evitar que la actualización visual V79 altere estas medidas.

## Datos y compatibilidad

Los avatares, nombres, salud, llaves, día, mensajes y resultados son los de los usuarios de tu web. No se copian las identidades de los bots de la captura ni se fijan los números que aparecen en ella. Los avisos de Big Brother siguen su horario: no se muestra una llave falsa cuando no hay un aviso disponible.

Se conservan las reglas y persistencia de V78, las funciones de Hunger y la revisión general V79. Las partidas rápidas antiguas conservan su motor y su pantalla compatible; la composición nueva corresponde al Casting diario de veinte jugadores.

## Verificación

40 archivos de pruebas locales superados. Revisadas pestañas, privados, tablero durante las actualizaciones, votos, reclamaciones, blogs de Casting y estados vacíos/errores. Referencias HTML e identificadores y sintaxis CSS comprobados. Worker compilado con Wrangler 4.152.0.

Las medidas se contrastaron con la página de Regaged y la captura. No se ha desplegado en tu Cloudflare desde este entorno ni se ha comprobado visualmente esta versión local en un teléfono real. No se afirma una coincidencia píxel a píxel a cualquier escala de zoom o con contenido distinto.
