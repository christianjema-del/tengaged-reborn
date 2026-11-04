# Tengaged Reborn V142 — manzana por conversación

Versión completa sobre V141.

## Funcionamiento

- Un comentario nuevo en el chat público se refleja en la siguiente actualización del estado del Casting con +1 punto porcentual de manzana, hasta 100 %. Si varios mensajes se acumulan antes de esa actualización, el bloque da +1 %, no +1 % por cada recarga posterior.
- Cada bloque de mensajes se marca como procesado. Recargar, entrar en el perfil, votar o jugar una prueba no da manzana ni evita la inactividad. Los mensajes privados y los avisos automáticos de inscripción no cuentan como conversación pública.
- Se conserva la pérdida de 1 punto porcentual cada 30 minutos tras una hora sin escribir. Llegar a cero elimina al usuario. Las manzanas recogidas siguen dando +15, con máximo de 100.
- Los bots ya no reinician su reloj de inactividad al hacer sus pruebas o votaciones automáticas. Si no hablan en el chat, pierden salud igual que un participante silencioso.
- Los registros de última conversación se mantienen con la inserción del mensaje y se consultan por sala, sin recorrer todo el chat en cada actualización. Se conservan las mejoras de consumo de D1 de V141.

## Reparación del Casting #3

Al abrir una partida #3 todavía en curso después de publicar V142:

- Cristi y Lamine vuelven a estado activo con al menos 70 % de manzana. Conservan sus llaves, tics, resultados, días y demás progreso. No se cobran nuevas entradas ni se cambian saldos.
- Los bots activos de esa partida que no hayan escrito quedan con un máximo del 5 % de manzana, corrigiendo la ventaja de actividad ficticia que acumulaban. A partir de ahí siguen perdiendo salud con la regla normal.
- La corrección se aplica una sola vez. Se guarda el estado anterior en casting_recovery142. Una nueva expulsión posterior no se revierte automáticamente.
- Las partidas ya finalizadas no se reabren ni se modifican sus premios. La recuperación es específica del Casting #3; el resto solo recibe la nueva mecánica de salud.

## Publicación

Extraer la carpeta y ejecutar:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Después abrir /casting-game?id=3. La reparación y la estructura de datos se aplican automáticamente cuando D1 permite consultas. No borrar la base de datos.

Verificación: 103 pruebas automatizadas superadas y compilación de Functions. Incluyen comentario +1 %, límite 100 %, recargas sin premio repetido, pruebas de bot sin protección de salud, muerte por silencio, recuperación una sola vez de Cristi/Lamine, copia previa, conservación de días/resultados/saldos y eliminación posterior sin resurrección automática.
