# V166 — Cabecera común, Juegos clásicos, perfiles y posiciones

## Diseño común
Las 29 páginas con cabecera usan ahora el mismo logo auténtico, fondo, barra de 50 px, alineación de 981 px y pestañas que Blogs. Blogs, Grupos, Diseños, Mafias y Juegos ocupan la barra; todas las secciones actuales siguen disponibles en el menú de la flecha/avatar, también para invitados. En móvil la cabecera se distribuye en filas de la misma forma en cada sección. Las páginas de redirección y diagnóstico no son secciones con contenido.

## Juegos y avisos
Referencia: https://web.archive.org/web/20150312160953/http://www.tengaged.es/games
Se mantienen los juegos realmente habilitados. Las tablas separan inscripciones, partidas en marcha y archivo finalizado. Colores por formato, tamaños compactos, mensajes y avisos automáticos públicos; actualizaciones cada 15 segundos mientras la pestaña está visible. Se conservan los últimos datos de cada origen si falla una consulta. Las fechas inválidas se muestran con un guion, evitando cifras como «Hace 19339 días». Los resultados finalizados ya no se presentan como un día activo. Las alertas incluyen nominaciones, expulsiones y final con puestos; no se exponen privados ni intentos. Los avisos de objetos ya recogidos siguen desapareciendo.

## Castings
Confirmado el problema real en Casting 6: Cristi 1, Scottmaster21 2, PauCubarsi 20 y bots entre ellos. La migración V166 coloca a PauCubarsi 3, manteniendo Cristi 1 y Scottmaster21 2. Se aplica a TODAS las ediciones finalizadas, también posteriores a la 5 y registros con marca anterior. Orden estable de humanos antes de bots, puestos únicos; resultados, perfil y diferencias positivas de premios se sincronizan una sola vez, con copia de respaldo y protección de concurrencia. No resta dinero ya concedido ni duplica partidas o premios. Al abrir Castings o perfiles se ejecuta automáticamente: no necesita SQL manual.

La clasificación final de partidas futuras incluye a todos los participantes y prioriza usuarios reales. Un usuario que haya escrito en el chat de la partida mantiene protección frente a bots vivos aunque haya pasado una jornada de 12 horas; no depende de que la consulta se haga dentro de los 90 minutos siguientes a escribir. Las reglas entre usuarios humanos se conservan.

Hunger 4 conserva las inscripciones y el inicio manual ya reparados; no se realiza un nuevo reinicio.

## Perfiles de todos los usuarios
Referencia: https://web.archive.org/web/20130715040921/http://www.tengaged.es/user/granhermano
Avatar 140 × 161, banner local auténtico, columnas clásicas, biografía, juegos paginados y puestos corregidos, veinte títulos del blog con enlace a la página personal y RSS, menciones, últimas acciones públicas paginadas y Tweet. Conserva amigos y su orden/paginación, mensajes, regalos, mafia, grupos, diseños, edición propia y moderación. Las acciones incluyen publicaciones, comentarios visibles, entradas en juegos y actividad de grupos abiertos. Los grupos cerrados y comentarios ocultos no se divulgan. Se admiten direcciones /user/usuario mediante redirección al perfil real.

Donaciones: se implementa la mecánica visible en la referencia, gratuita y con T$ del juego: 0,1 T$ por donación, una por donante y destinatario al día y hasta 30 recibidas por destinatario al día UTC. Registro persistente, incremento atómico, rechazo de autodonar, cuentas de sistema/prueba y solicitudes de otro origen. Repetir no vuelve a sumar. Es una implementación nueva basada en los contadores observables; el servidor original no está archivado. No se importan donaciones históricas inexistentes.

Límite de fidelidad: el archivo conserva HTML y parte del comportamiento público, no todas las reglas privadas de servidor. Las apuestas antiguas de la referencia no se han clonado: no disponemos de su algoritmo de pagos y ese formato no estaba habilitado en este proyecto. No se afirma una réplica funcional absoluta de todas las mecánicas originales.

## Validación
128 archivos de pruebas automatizadas correctos, incluida recuperación de Castings 1–8, el orden exacto de Casting 6, historial/premios y peticiones simultáneas, privacidad de avisos, donaciones concurrentes y conservación de céntimos. Las 34 páginas HTML tienen sus dependencias locales disponibles. Chromium: cabecera idéntica en ocho secciones de PC; siete secciones a 320 px sin desbordamiento; perfil de PauCubarsi con 3.º puesto y avatar correcto. Verificados enlaces a blogs desde el inicio y entradas/personales en V165. No equivale a pruebas de todos los dispositivos ni Safari físico. El fallo de Safari que muestra «servidor no responde» ocurre antes de cargar la web y sigue requiriendo comprobar la conexión del teléfono.

## Publicación
Descomprimir Tengaged-V166.zip. Ejecutar por separado:

```sh
cd /Users/christianmonzonlorente/Downloads/Tengaged-V166
```

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

Enviar la URL del despliegue para verificar los datos reales. Las pruebas realizadas aquí usan datos de prueba locales; la clasificación publicada se verificará después del despliegue.
