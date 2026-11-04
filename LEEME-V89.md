# V89 · Menú compacto y juegos a la derecha

Actualización completa sobre V88. Conserva XP por primer rival, arbustos cada tres horas, silencio de avisos de arbustos y las funciones anteriores.

Menú de 224 píxeles y filas compactas, con controles mayores en táctil. Correo y Administración aparecen por encima de Blogs. Se mantienen los permisos y el contador de correo.

Desaparece la barra Mis juegos activos entre cabecera y contenido. En pantallas de al menos 1200 píxeles, las partidas se colocan en la zona azul justo a la derecha del desplegable, alineadas con su borde superior, según el cuadrado rojo de la captura. Un juego por línea: CASTING 2 y HUNGER 1, usando los números reales y enlaces a esas partidas. En pantallas más estrechas, la lista se recoge en el extremo derecho de la cabecera para evitar salirse de la pantalla.

## Publicar

```bash
cd ~/Downloads/Tengaged-V89
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borres D1 ni reinicies partidas. /api/health: version 89, build V89-CABECERA-COMPACTA. No publicado desde este entorno.

## Validación

53 archivos de pruebas locales; Worker compilado con Wrangler 4.152.0. Se comprueban enlaces e IDs de partidas, visitantes, fallos de conexión, ausencia de partidas terminadas/ajenas y orden de Correo y Administración. HTML y sintaxis JavaScript revisados. No se ha comprobado visualmente esta versión en un móvil físico.
