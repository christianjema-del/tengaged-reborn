# Tengaged V95 — Casting según las dos capturas

Versión completa sobre V94. Conserva las funcionalidades anteriores, los armarios y diseños, las conexiones y los bots exclusivos de admin1.

## Desplegar

Descomprime y, desde Tengaged-V95, ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No reinicies D1 ni borres partidas.

## Diseño ajustado

Se han usado las capturas 22.58.41 y 23.01.46 del 26 de octubre como referencia:

- Cabecera degradada azul, título grande casting, número real de partida en rosa y temporizador real a la derecha.
- Veinte avatares en dos filas de diez en escritorio, recursos a la derecha, pestañas de públicos/privados y chat debajo; columna lateral de día, nominaciones, normas, blogs e historia.
- Cabecera azul muy clara para comentarios: nombre y tiempo a la izquierda; puntuación con signo y texto points, botón ✓ positivo y ✕ negativo a la derecha. Cuerpo del comentario separado debajo. Conserva votos persistentes y permisos del servidor.
- Panel de nominaciones verde muy claro, filas azules y botones 1/2/3 o 1/2 según los nominados reales. Cada valor se utiliza una sola vez. El servidor sigue validándolo. Aviso automático amarillo con nominados y etiquetas NOM en el chat.
- Bajo los gráficos originales de llave, manzana y tick naranja se muestran, respectivamente, llaves, salud y checks guardados de quien consulta la partida. La manzana representa la salud actual, no un inventario de manzanas sin consumir. Día real en la libreta. Espectadores ven los tres espacios vacíos, sin guiones ni cantidades. No se muestra la salud privada de otras personas.
- Las conexiones de bots siguen a 0 min conforme a lo pedido, aunque en las capturas de referencia figuren otros tiempos.
- Adaptación móvil: cinco avatares por fila, bloques apilados, texto de entrada de 16 px y controles táctiles ampliados. En PC se mantienen botones compactos como en la imagen. Los avatares siguen usando los conjuntos y diseños reales del proyecto.

Las reglas, cantidades y números de partida se mantienen reales; no se reproducen los datos de los jugadores de la captura. La apariencia se ha ajustado a la referencia; no se afirma igualdad de píxel entre navegadores o dispositivos sin una comparación visual en ellos.

## Verificación

61 archivos de pruebas, incluidos ubicación y orden de los votos en la cabecera, datos de recursos del usuario y asignación de votos sin duplicados. Worker compilado y sintaxis/HTML comprobados. No se ha publicado desde este entorno ni comprobado en un teléfono físico.

## Desafío en página independiente

El botón del panel de recursos se llama Desafío y abre casting-challenge.html con el ID real de la partida y el día. Allí se comprueba la inscripción, el estado activo, la prueba asignada y el día antes de habilitar Empezar desafío. El resultado usa el mismo minijuego original y puente de puntuación validado del servidor. Se muestra la confirmación al guardarse y un enlace Volver al Casting. Un día antiguo, un espectador o un error al comprobar la partida no pueden lanzar el desafío. No se publica ninguna puntuación manual ni se habilitan intentos adicionales.
