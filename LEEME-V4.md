# Tengaged Reborn — V4

## Publicar

Descomprime este ZIP en una carpeta nueva. Abre Terminal **dentro de la carpeta
que contiene wrangler.toml**, no en tu carpeta personal. Ejecuta:

```
npx wrangler pages deploy . --project-name tengaged-reborns
```

También puedes abrir PUBLICAR.command si macOS permite ejecutarlo.
No es necesario usar sudo ni modificar la Papelera. Se conserva la configuración
D1 del proyecto; no se borran cuentas, partidas ni diseños.

## Pruebas de Casting

- Los diez SWF originales se asignan al azar al comenzar cada ronda.
- La elección queda guardada: todos los participantes juegan la misma prueba y
  recargar no la cambia. Se recorren los diez antes de repetir y se evita repetir
  el último juego de una bolsa al comenzar otra.
- Al terminar, el propio juego envía sus puntos. No se introduce puntuación manual.
- Se comprueban sesión, participante, partida, ronda, juego e identificador de
  intento. Se consume salud una sola vez. Los reintentos no duplican el resultado
  ni el premio. La mayor puntuación determina la inmunidad/final.
- Reabrir un intento conserva su reloj; no abre un intento nuevo.
- Las demostraciones de partidas finalizadas siguen sin afectar a la competición.
- Las rondas antiguas parcialmente puntuadas conservan su sistema hasta la
  siguiente ronda; una ronda antigua sin resultados puede adoptar los originales.
- Los puntos se reciben del SWF. Los controles de sesión y reintentos **no verifican
  la ejecución completa de cada jugada ni constituyen un sistema antitrampas**.

## Estética y navegación

Se ha consultado Regaged con sesión iniciada como referencia. Cabecera compacta,
fondo azul, página blanca, títulos coral, botones amarillos y listas compactas.
Perfil con avatar grande, nivel de color, biografía editable, historial paginado,
blog, diseños y actividad real. Tiendas con escaparates, miniaturas, catálogo de
colores y estados de compra. Catálogo de juegos con tarjetas de formato, filtros,
partidas finalizadas y tabla de últimas partidas. Casting con participantes,
recursos, ronda y prueba. Estilos comunes para blogs, diseños, ranking y arena.
Las funciones que aún no existen (otros formatos, amistades, mensajes privados,
clasificación semanal de tiendas) no se presentan como operativas.

## Validación

- Pruebas automáticas con SQLite: inicio/guardado cifrado para los diez juegos,
  rotación y persistencia, concurrencia, identidad, rondas caducadas, reintentos,
  aislamiento de demostraciones y premios únicos.
- Validación de sintaxis de los archivos JavaScript e instrucciones inline.
- Revisión visual con datos de prueba en escritorio y en un ancho de 390 px.
- Match Three se ha iniciado en Ruffle en una ronda de prueba y ha registrado
  automáticamente 600 puntos obtenidos con una jugada real.
- El inicio/guardado visual completo de los otros nueve SWF debe confirmarse en
  el despliegue; sus protocolos se han comprobado con las pruebas automáticas.

Para ejecutar las pruebas (Node 24 con node:sqlite):

```
node tests/casting-flash.test.mjs
```
