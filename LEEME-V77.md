# V77 · Hunger y Casting

Actualización completa basada en V76. Conserva cuentas, inventario, saldo y partidas. Las reglas nuevas solo se aplican a ediciones creadas con V77. Una edición actual sin rulesVersion conserva el reglamento de V76; no se reinicia para activar novedades.

## Nuevas ediciones

- Diez flechas al empezar y límite de quince almacenadas. Las dianas siguen siendo recogibles durante luchas, hasta completar el inventario.
- Ocho horas por lucha, empate favorable al atacante y experiencia solo en la primera lucha con cada rival. El vencedor atacante obtiene dos; el defensor, una. Se mantienen los modificadores de arma y ventaja de salud inicial.
- Botín: si eliminas al rival en el duelo y quedas sin arma, recibes sus usos restantes. Si un tributo muere durante un duelo, el otro gana ese duelo solo si ya había guardado; no se transfiere salud inexistente.
- Cornucopia llena: atacar puede desplazar a un ocupante que no esté combatiendo y no sea el objetivo. No supera diez puestos. Recoger un arma impide ocultarte hasta completar o cancelar la recogida por combate.
- Arbustos renovados cada cuatro horas, con posiciones iguales para todos y una búsqueda por ciclo.
- Modo Lobo: diez minutos cada seis horas, con pérdida pasiva doble. El primer período empieza a las seis horas de juego. El suministro de Cornucopia sigue las reglas mostradas.
- Salud privada; la pantalla de patrocinio muestra la salud de tributos vivos por debajo de cuarenta.
- Cinco patrocinios por edición: hasta diez de salud o cinco flechas. Precio por destinatario: 15 T$, después 50 T$ y después 100 T$. Un ticket sustituye el coste. La cuenta debe ser ajena al reparto.
- El ganador recibe cinco tickets persistentes para otras partidas, además de los premios existentes. El registro SQL impide dobles cargos o dobles créditos. Los precios desactualizados se rechazan antes de cobrar.
- Tras finalizar se archivan los resultados y se abre automáticamente la siguiente edición. La pantalla que estabas viendo permanece en la edición terminada; el enlace de la nueva edición permite entrar a la siguiente.

## Todas las ediciones

Historial paginado de luchas y diálogo con puntuación original/ajustada, experiencia, resultado y salud transferida. Registro de patrocinadores, resumen final de puesto y premio con comprobación del registro de pago. Barra de día, suministro y estado de la arena.

## Teléfono

Cornucopia desplazable, controles de ataque mayores, accesos rápidos a chat/estado/luchas, diálogos adaptados, tablas desplazables, fuentes de formulario de 16 px, respeto de las zonas seguras de pantalla y tablero sin gestos de desplazamiento que interfieran con el juego.

Ruffle y los SWF requieren comprobación real en dispositivos. Guitar puede requerir teclado. Esta actualización no garantiza compatibilidad de todas las pruebas con controles táctiles ni resuelve por sí sola un fallo de dominio o red.

## Publicar

Desde esta carpeta:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

La tabla y los índices de tickets se crean automáticamente. No borres D1 ni reinicies la arena actual. Para ver las reglas nuevas, espera a la siguiente edición.

35 archivos de pruebas automatizadas, más validación de sintaxis, IDs y recursos. Se comprueban las reglas nuevas, compatibilidad de ediciones anteriores, privacidad, tickets/cargos, reintentos, archivo, apertura siguiente e interfaz del historial. Comprobación visual desplegada y en teléfono pendiente.

## Casting · aviso original de Big Brother

Se añade el mensaje automático con cabecera amarilla Big Brother, tiempo relativo, cuatro frascos POISON y una llave KEY en el centro. Las dos imágenes originales se sirven desde assets/casting. Los cinco elementos se pueden pulsar.

- La primera llave aparece un minuto después de activar la partida. Se genera un aviso cada tres minutos si no queda otro disponible; cada aviso caduca a los dos minutos. Este horario es una adaptación al Casting rápido actual de la web, no al formato diario de Regaged.
- Solo participantes activos pueden recoger. La llave concede una unidad al primer reclamante y desaparece para todos. Repetir una petición propia no concede otra llave.
- Cada frasco resta quince de salud, según las reglas públicas de la referencia. Cada frasco tiene una sola recogida y no puede aplicarse dos veces por reintento. Llegar a cero elimina al participante. Se actualizan las fases si la eliminación deja la final o un ganador.
- Las llaves recogidas usan el sistema de nominaciones existente. La interfaz actualiza el contador sin cerrar el minijuego en curso; si el participante es eliminado, el tablero se cierra.
- No se cambia todavía el Casting rápido a 20 jugadores ni a días de 12 horas. Esa revisión de formato es independiente de copiar el aviso automático.

Referencia del mensaje: https://regaged.com/game/cmvoevwe00h5bkaa5wnc0h8fo
