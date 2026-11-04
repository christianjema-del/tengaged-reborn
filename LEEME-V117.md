# Tengaged V117 · Diseños con compra obligatoria y revisión general

Versión completa sobre V116. Conserva la ruleta diaria, los avatares completos, las prendas concedidas expresamente, Casting, Hunger y las herramientas de administración.

## Diseños y armario

Publicar un diseño ya no concede una copia al autor. Ser su creador tampoco permite equiparlo: el servidor exige que esté en el inventario. Se bloquea la compra directa desde la antigua API del catálogo; las compras se realizan en una tienda activa o al ganar una subasta. Los regalos adquiridos en tienda siguen funcionando.

Se archivan y retiran las concesiones automáticas antiguas al propio autor que no tienen registro de compra o concesión expresa. Si estaban equipadas, se retira esa capa para dejar de mostrar una prenda sin adquirir. No se borra el diseño publicado. Se preservan compras de tienda/subasta, prendas importadas, las concesiones anteriores identificadas y los avatares especiales pedidos en versiones anteriores.

Hasta cuatro diseños activos por persona, también al restaurar uno retirado. Votación de tres días con el poder de la tarjeta ya existente. Cada doce horas se selecciona automáticamente el candidato con más puntos positivos, dentro de la ventana de votación, que todavía no haya sido subastado; la subasta dura doce horas y empieza en 10 T$. Si no hay candidatos, se espera al siguiente ciclo. La selección y los cierres se procesan al consultar Diseños o Subastas, sin necesidad de programar una tarea externa. El primer ciclo se habilita al instalar y la primera selección llega en el siguiente límite de doce horas.

El autor puede pujar por su propio diseño. Si gana, paga la puja completa; no se ingresa ese importe a sí mismo. Una puja no concede la pieza de inmediato: al cerrar se comprueba el saldo, se cobra y se añade al armario en una operación atómica. Reintentar o consultar simultáneamente no duplica el abono ni la prenda. No se recalculan premios ni ventas antiguas.

Se conservan los plazos y reglas de las tiendas existentes; no se sustituye su economía por otro formato.

## Revisión de PC y teléfono

81 pruebas automatizadas, incluido publicar/equipar sin compra, límite de diseños, subasta automática por votos, compra del propio autor, cierre simultáneo y retirada de concesiones automáticas con archivo recuperable. Compilación Worker completada.

Se revisaron 24 vistas a 1440, 390 y 320 píxeles, y diez vistas complementarias a 1440 y 390, con datos locales de prueba. Sin enlaces locales rotos ni desbordamiento horizontal en las vistas verificadas. Se comprobaron apertura y cierre del menú, formulario de diseños, ruleta, navegación y vistas de visitantes. Las pruebas de operaciones de juegos, administración, compras, regalos y permisos forman parte de la suite automatizada. Esto no equivale a probar todas las combinaciones posibles de acciones ni dispositivos físicos.

La revisión encontró y corrigió un fallo del reproductor de desafíos cuando el navegador comunica un idioma no válido: ahora utiliza la dirección de texto predeterminada y permite cargar el juego. La comprobación posterior no reprodujo el error.

Referencia funcional consultada: https://regaged.com/fashion-game y https://regaged.com/faq. Se adapta a los formatos y datos de Tengaged Reborn; no se afirma una identidad total de ambas plataformas.

No se ha publicado desde este chat ni se han modificado cuentas reales durante las pruebas. Las migraciones se aplican al cargar la aplicación tras publicar.

```bash
cd ~/Downloads/Tengaged-V117
npx wrangler pages deploy . --project-name tengaged-reborns
```
