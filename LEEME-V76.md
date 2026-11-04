# V76 · Puesta a punto

Paquete completo sobre V75: mantiene las cuentas, la base de datos y el progreso. No requiere migraciones ni borrar datos.

- Dianas recogibles durante una lucha, incluso después de guardar; solo un reclamante por diana.
- Casting conserva el minijuego abierto al comer o descansar, evita lecturas superpuestas y descarta respuestas anteriores a una acción. Recursos y fases con estado claro.
- Capturas e iconos originales: 23 archivos aportados por el usuario guardados localmente; pollo, contador, maza y avatar desconocido integrados en Hunger.
- Dos conjuntos originales opcionales en el editor, con capas ajustadas, colores y guardado explícito. Los avatares existentes permanecen igual hasta guardar un cambio. Una piel completa equipada conserva su prioridad.
- Guía renovada, normas de convivencia y juego limpio, y accesos desde el pie y la inscripción.
- Navegación y formularios con foco visible, salto al contenido, ajustes de legibilidad y móvil. Las peticiones compartidas tienen un límite de 15 segundos y no repiten automáticamente compras ni votos.
- Eliminados los avisos y apartados de acceso móvil, recuperación y diagnóstico V74. Las direcciones antiguas vuelven a la portada para no dejar enlaces guardados sin salida.

## Publicación

Descomprime y abre PUBLICAR.command, o ejecuta dentro de esta carpeta:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

Los otros scripts de publicación delegan en PUBLICAR.command; no publican automáticamente un nuevo dominio alternativo.

## Verificación

30 archivos de pruebas automatizadas cubren avatar y armario, tienda y regalos, perfiles y actividad, comunidad, correo, grupos, inscripciones, partidas y combates. Se añadieron pruebas del ciclo completo de Casting, conservación del tablero, recursos durante combate, capas originales y errores de red. Se revisan también sintaxis, rutas y referencias locales.

No se certifica una réplica 1:1 ni ausencia de errores. Falta comprobar el resultado visual y completar pruebas reales de Ruffle en el despliegue. El aviso de servidor inaccesible en los dispositivos del usuario sigue sin diagnóstico confirmado; este paquete no garantiza resolver un problema de dominio o conectividad.
