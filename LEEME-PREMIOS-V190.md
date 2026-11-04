# Auditoría de premios

Ejecutar desde esta carpeta en el Mac donde Wrangler ya tiene acceso a Cloudflare:

```bash
node auditar-premios190.mjs --reparar
```

No hace falta desplegar la web para ejecutar esta revisión. Para consultar sin modificar saldos:

```bash
node auditar-premios190.mjs
```

La herramienta consulta todas las partidas registradas de Casting, Frookies y Hunger, tanto actuales como archivadas. Compara los premios correspondientes a los puestos definitivos de usuarios reales con sus recibos de pago. Hunger 4 aplica el doble: 280 karma/600 T$ para el primer puesto, 120/200 para el segundo, 40/120 para el tercero, 40/40 para el cuarto y 20/20 para el quinto y sexto.

Admin1 y mod quedan excluidos de todos los ajustes. No se reinicia, avanza ni inicia ninguna partida. No se vuelve a cobrar ninguna inscripción. Se conservan los pagos superiores al premio actual. No se reemplaza el saldo del usuario por la suma de premios: sus compras, ingresos y gastos anteriores permanecen intactos.

Antes de modificar nada se guarda la información utilizada en una carpeta privada **fuera de la web**, `Tengaged-Auditoria-Premios`, junto a esta carpeta del proyecto. Contiene los informes anteriores y posteriores, los saldos y recibos anteriores, el SQL utilizado y los abonos de esta ejecución. La base de datos también conserva un registro `prize_audit189` de cada ajuste con sus importes anteriores y diferencias. No se guardan contraseñas ni sesiones en estos informes.

Cada abono comprueba el estado de la partida y su recibo de nuevo al ejecutarse. Si cambian mientras se revisa, no se aplica el plan antiguo. Un fallo en un abono revierte ese abono junto con su recibo; los abonos ya completados se conservan. Puede repetirse el comando tras una interrupción sin repetir un premio registrado.

El informe distingue importes pendientes, pagos superiores al premio actual e incidencias: clasificaciones con puestos duplicados, usuarios no identificados, recibos ambiguos o Hungers automáticos inválidos desde la edición 5. Estos casos requieren revisar sus datos y no se pagan a ciegas. Si quedan incidencias, el proceso termina con código 2 y señala `revision-despues.json`; ese informe permite continuar la revisión. Los importes históricos sin justificante suficiente no se consideran verificados.

Que no falten premios en los registros no permite reconstruir de forma independiente todo el historial económico de cada cuenta. La revisión verifica premios de juego y sus ajustes; los demás movimientos del saldo no se recalculan.

V190: lectura paginada, sin UNION ni SELECT compuestos. Cada ajuste se envía por separado y conserva las mismas protecciones e identificadores de pago de V189. No hace falta desplegar la web.
