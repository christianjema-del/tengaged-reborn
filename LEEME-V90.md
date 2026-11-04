# V90 · Cabecera clásica y Casting real

Paquete completo sobre V89. Conserva la experiencia de Hunger por primer rival, arbustos cada tres horas, silencio de sus avisos y menú de cuenta con Correo y Administración antes de Blogs. No borres D1 ni reinicies partidas.

## Aspecto

Se ha usado como referencia la primera captura adjunta del 26/10/2026 a las 12:50: pestañas superiores con fondo azul grisáceo, esquinas redondeadas, pequeños iconos y sección actual destacada. Las partidas activas se muestran en recuadros claros pegados al borde derecho de la página, uno debajo del otro, con nombres y números reales como casting #2 y hunger #1. La flecha de cuenta y sus opciones se conservan. No se añaden salas, usuarios, anuncios ni funciones de Rookies ficticias para imitar el contenido del vídeo.

El vídeo no fue accesible mediante la consulta. La referencia visual utilizada es la captura. No se certifica una coincidencia píxel a píxel ni una comprobación visual de esta versión local en un teléfono físico.

## Casting real

- 20 jugadores. El inicio es automático al llenarse. Se bloquea la entrada de cuentas de prueba marcadas como bots. No se rellenan plazas artificialmente.
- Días de 12 horas. El día 1 solo se compite; las nominaciones empiezan el día 2. Las partidas reales no permiten el inicio de administración con seis personas ni el cierre manual anticipado de un día. Esos controles quedan reservados a estados de práctica y se ocultan en las partidas reales.
- Nominaciones y final: llaves 50 %, prueba 25 %, checks 25 %, por rangos entre supervivientes. Llaves ilimitadas, sin garantía absoluta de salvación. Final al quedar cinco.
- Tres nominados; desde siete participantes, dos. Los nominados no votan. Cada valor se asigna una vez; un número mayor da más fuerza para expulsar.
- Manzana +15 de salud, máximo 100; veneno −15. Inactividad reduce salud y cero elimina.
- Avisos públicos cada hora; llaves garantizadas en las horas 1, 5 y 9 de cada día. Un paquete privado por cada 3000 checks.
- Un minijuego original compartido por día, elegido al azar. Las puntuaciones se guardan desde el puente de los SWF y no mediante una puntuación manual enviada al API de Casting.
- Si la inscripción se guardó pero se perdió la respuesta, reintentar devuelve la plaza existente sin duplicarla ni repetir su bienvenida. Las últimas plazas se protegen mediante la revisión del estado en la base de datos.
- Se conserva el aviso de inicio por correo interno para quienes lo eligieron.

No se ha iniciado ni rellenado una partida en producción desde este entorno. Después de publicar, los usuarios pueden entrar en Inscripciones → Casting. La sala empieza cuando se inscribe la vigésima persona. Las partidas rápidas ya iniciadas conservan su motor anterior; las salas en espera siguen usando el Casting diario.

## PC y móvil

Las pestañas se reorganizan en pantallas estrechas; los accesos laterales se recogen dentro de la cabecera cuando falta margen. Menú con desplazamiento y controles táctiles mayores. Casting mantiene su reparto en cinco columnas en móvil, formularios legibles, botones de prueba y voto accesibles y protección frente a textos largos. Se conserva Ruffle local. Algunos minijuegos originales requieren controles de teclado o ratón y no se ha demostrado equivalencia completa de control táctil.

## Publicar

```bash
cd ~/Downloads/Tengaged-V90
npx wrangler pages deploy . --project-name tengaged-reborns
```

/api/health debe indicar version 90 y build V90-PESTANAS-CLASICAS. No publicado desde este entorno, que carece de autenticación de Cloudflare.

## Comprobaciones

54 archivos de pruebas locales superados y Worker compilado con Wrangler 4.152.0. Se incluye una prueba con 20 sesiones autenticadas en SQLite, carrera por las últimas dos plazas, rechazo de una tercera persona sin plaza, rechazo de bot, bloqueo de inicio/cierre anticipados, reintento de inscripción, veinte notificaciones únicas y guardado de una puntuación por el mismo puente de los minijuegos. Una simulación del motor recorre los dieciséis días de 12 horas desde veinte jugadores hasta los cinco finalistas, comprobando final 7 y puestos únicos. También se mantienen los tests de rangos 50/25/25, avisos, salud, votos, privacidad, XP y economía. HTML, recursos locales y sintaxis JS/inline comprobados. Estas son pruebas locales, no una prueba de carga con veinte personas en producción.
