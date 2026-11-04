# V52 · Luchas y flechas

Incluye V51 y todas las mejoras anteriores.

- El ataque o la recepción de un reto no abre automáticamente la pantalla de pelea.
- La lucha actual se muestra encima del historial con rivales, prueba, estado y botón Luchar. Solo ese botón o Volver a la pelea abre el desafío.
- Volver al juego conserva la elección durante las actualizaciones. El resultado continúa apareciendo al terminar la prueba si tienes abierta la pelea.
- Avatar y nombre se distribuyen verticalmente, sin texto sobre el dibujo.
- Eliminados selector Apuntar a, Atacar y Disparar una flecha de la ficha. El ataque se mantiene debajo del rival en Cornucopia.
- Botón amarillo Disparar junto a las flechas del inventario. Abre lista de los demás tributos vivos, incluidos los ocultos y bots, para elegir un disparo. No muestra salud ni datos privados de los ocultos.
- El diálogo informa del disparo o error, actualiza munición y se deshabilita sin flechas. La API conserva la validación de objetivos, permisos, límites y no duplicación de operaciones.

Publicar desde esta carpeta con:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

No requiere migraciones ni borrar la base de datos. Las comprobaciones automatizadas cubren la entrada manual, persistencia en las actualizaciones, guardado y resultados, y el selector de disparo. Queda pendiente la comprobación visual del despliegue.
