# V42 · Hunger: mensajes y muertes

Incluye la V41 completa y su corrección de carga.

- Mensajes privados con la misma cabecera, formulario y estilo de mensajes que los comentarios públicos.
- Retirados los dos botones duplicados bajo Actualizar arena; ambos apartados aparecen directamente.
- Lista de caídos pasa a Lista de muertes. Debajo aparece el autor y la causa: disparó a / asesinó a.
- El servidor guarda el autor y la causa de las nuevas muertes. Las antiguas sin estos datos no reciben un autor inventado.
- Los eliminados pueden leer pero no escribir.

Validación: todas las suites tests/*.test.mjs superadas, con comprobaciones nuevas para muertes por flechas, combate y presentación en pantalla. Apariencia final pendiente de comprobar en el despliegue.

Publicar desde esta carpeta:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
