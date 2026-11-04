# V91 · Juegos visibles, escala compacta y base de avatar original

Paquete completo sobre V90, conservando las normas del Casting real, XP por primer rival y renovación de arbustos de Hunger cada tres horas. No borres D1 ni reinicies partidas.

## Partidas a la derecha

La cabecera usa ahora /api/my-games: una consulta privada ligera que busca directamente las partidas del usuario, sin avanzar ni recorrer todos los Castings de la web. Se comprueba automáticamente cada quince segundos mientras la página está visible y al volver a la pestaña o refrescar la sesión. Un fallo transitorio conserva los enlaces ya cargados; los fallos iniciales muestran Mis partidas y se reintentan. Cuando no hay partidas activas aparece Inscribirme, sin inventar números de juegos.

En PC de al menos 901 píxeles se reserva espacio real para la columna lateral. Ya no depende de que sobre un margen por encima de 1200 píxeles. En móvil la lista se recoge en la cabecera, dentro de la pantalla. Cada partida va en su propio recuadro y línea. No se muestran partidas finalizadas ni aquellas en las que el usuario ya está eliminado. En Hunger se mantiene visible un tributo protegido a cero mientras come.

## Tamaño y móvil

Menú de 205 píxeles, texto y filas compactas en PC; controles mayores al detectar pantalla táctil. Cabecera más baja y etiquetas sin iconos cuando falta ancho intermedio. No se usa zoom para encoger la web. En móvil, pestañas reorganizadas, controles de avatar compactos y vista previa de 160 píxeles en teléfonos estrechos.

## Avatares originales

La base predeterminada es ahora el conjunto original 1; el conjunto original 2 también está disponible. Las cuentas con ajustes antiguos sin un conjunto explícito se interpretan sobre la base original al mostrarse, manteniendo sus selecciones de rasgos y colores. Cambiar pelo, boca, ojos, gafas o ropa ya no elimina la selección de conjunto original. Los colores de ojos y boca también se aplican a sus capas originales. Las otras opciones de rasgos existentes siguen disponibles sobre esa base. Los doce tributos gráficos de Hunger utilizan los mismos conjuntos originales.

Los diseños comprados y regalos conservan prioridad y no se borran del armario. Un conjunto completo equipado puede tapar la base; al elegir un conjunto original o editar sus rasgos en el editor se retira ese conjunto completo solo de la vista previa. Pulsa Guardar cambios para aplicarlo o Deshacer cambios para conservar el anterior. El diseño sigue siendo propiedad del usuario.

## Publicar

```bash
cd ~/Downloads/Tengaged-V91
npx wrangler pages deploy . --project-name tengaged-reborns
```

/api/health: version 91, build V91-JUEGOS-VISIBLES. No se ha publicado desde este entorno.

## Verificación

56 archivos de pruebas locales superados; Worker compilado con Wrangler 4.152.0. Nuevas pruebas de consulta de partidas, privacidad, límite de consultas, cero de salud protegido, reintentos y conservación de enlaces, base original predeterminada, cambios de rasgos y colores y prioridad de diseños propios. Se mantienen los tests de Casting real, Hunger, administración, economía y privacidad. HTML y sintaxis JavaScript comprobados. No se ha verificado visualmente esta versión local en un móvil físico ni se garantiza una coincidencia píxel a píxel.
