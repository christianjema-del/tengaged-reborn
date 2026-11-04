# V50 · Hunger: estado y combates

Paquete completo que incluye los cambios de V49 y anteriores.

- Ficha personal junto al chat: avatar, corazón y salud, arma dibujada, usos, bonificación temporal y flechas con límite según ubicación.
- Historial gráfico: retratos, puntuaciones originales, barra roja/azul, minijuego, resultado y daño real registrado. Los combates antiguos sin ese dato no muestran daño inventado.
- Conserva los diez minijuegos de Casting aleatorios, armas junto al pollo, chat público/privado por pestañas, ataques bajo rivales, recogida automática y causas de muerte.
- Selección de rival corregida, accesos al perfil desde combates y estado FINALIZADO en la arena.

## Publicar

Abre PUBLICAR.command o ejecuta desde esta carpeta:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

No hace falta borrar la base de datos. Los nuevos metadatos de combate se guardan al resolverse cada lucha. Para los combates anteriores se recupera el daño del evento cuando todavía está disponible.

La referencia pública y las capturas se han revisado. La comprobación visual del paquete desplegado y la ejecución de Ruffle en navegador quedan pendientes; las pruebas automatizadas comprueban lógica, API y estados de interfaz.
