# V43 · Hunger: pestañas y eventos en el chat

Incluye V42 y todas las funciones anteriores.

## Cambios
- Comentarios públicos y Mensajes privados son pestañas contiguas: privados se abre al pulsar y conserva la selección en las actualizaciones. Navegación con teclado.
- Flechas, retos, combates, muertes y movimientos se integran cronológicamente con los comentarios, con paginación compartida.
- Tarjetas de eventos con avatares, iconos, daño y hora relativa. Los disparos no revelados usan el tributo desconocido.
- Cornucopia más compacta, marcadores de puntuación pendiente/guardada y armas con iconos propios.
- Privados mantienen el borrador cuando falla el envío; los eliminados siguen sin poder escribir.
- Lista de muertes y autor/causa conservados.

## Comprobación
13 suites tests/*.test.mjs superadas. Nuevas comprobaciones: mezcla de eventos/comentarios, páginas sin duplicados, anonimato, aislamiento de privados, tarjetas, fechas, seguridad del texto, pestañas y persistencia de la selección.

## Comparación y límites
Revisada la partida pública de Regaged cmvleuhml0mcykaigojt7on5m y su pantalla de reglas. La organización del chat, el registro visual de ataques, las plazas, patrocinios y armas siguen esa referencia. No es una réplica 1:1 certificada: iconos, avatares y competición son propios; no se han observado todos los controles exclusivos de participantes. Las reglas ya implementadas se conservan. No se ha podido abrir la vista previa local en el navegador remoto: falta verificar visualmente el despliegue. Los eventos históricos sin metadatos completos conservan su texto; los nuevos tienen autor/objetivo/daño cuando corresponde. Se conservan hasta 300 eventos y las 50 últimas conversaciones privadas visibles, igual que antes.

## Publicar
Desde esta carpeta:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
Recargar con Cmd + Mayús + R.
