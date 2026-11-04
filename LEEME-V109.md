# Tengaged V109 · Blogs, Juegos, Hall of Fame y ranking común

Versión completa sobre V108; conserva los seis diseños de Peach, los cambios de Casting/Hunger, administración, rachas y notificaciones.

## Blogs

Ajustes de tipografía, avatares, medidas, tendencias, Top de hoy y vistas de entrada a partir de las páginas de Regaged examinadas en directo. Se conservan los controles en castellano.

Los votos positivos y negativos de entradas y comentarios tienen el poder de la tarjeta equipada. El servidor calcula el peso: no acepta un peso enviado por el navegador. Un voto por persona y contenido, sin voto propio; se puede retirar o cambiar. Al actualizar, los votos antiguos se recalculan una vez con la tarjeta equipada. A partir de entonces el peso queda fijado al votar; cambiar de tarjeta no reescribe automáticamente votos ya emitidos.

Valores del catálogo actual: blanca 1, amarilla 2, naranja 3, verde claro 4, verde 5, azul 6, morado 7, rojo 8, marrón 9, negro 10, plata 11, oro 12, cielo 15, sangre 20, TV Star 30, Ultra Gold 32, titanio 34, Holofoil 36, prisma 38 y diamante 40.

## Ranking de minijuegos

Los nuevos resultados oficiales confirmados de Casting y de combates de Hunger se añaden al mismo ranking que las pruebas de Minijuegos, para los diez juegos. Los reintentos de guardado no añaden otra partida ni sustituyen el resultado confirmado por una cifra diferente. Se conserva el mejor resultado y el número de intentos registrados. La inserción y actualización del ranking son atómicas mediante un registro de resultados y un trigger.

Las prácticas abiertas por una persona con sesión iniciada también utilizan el recorrido de Minijuegos y guardan su resultado. Las prácticas anónimas no pueden atribuirse a un usuario. Los resultados de bots simulados no pasan por el guardado oficial y no se incorporan como puntuaciones humanas. El ranking mantiene las puntuaciones originales, sin normalización por tiempo: los segundos extra de Casting pueden dar ventaja. No se reconstruye retrospectivamente todo el historial de desafíos anteriores a esta versión.

## Juegos

Distribución de dos columnas, banners existentes de tiendas y competiciones, Stars, últimos mensajes públicos, inscripción, tablas compactas de últimas partidas y partidas finalizadas. Los enlaces abren los juegos reales de esta web; no se inventan salas ni formatos que no estén habilitados.

## Hall of Fame

Cuatro retratos grandes, siguientes puestos en dos filas de ocho, tarjeta y karma; listado completo hasta 50 usuarios; tendencias por menciones reales, diseños destacados, ganadores de Stars (sin resultados mientras no exista el juego), y supervivientes con victorias reales de Hunger. «Más queridos» utiliza los votos verdes recibidos en blogs, identificado en pantalla.

La clasificación mensual mide el karma ganado desde la primera consulta tras instalar esta versión, con la fecha visible. Se crea una base por mes; no se inventan ganancias anteriores que no tengan historial. Se excluyen cuentas del sistema, de prueba y suspendidas, como en el ranking previo.

## Verificación y límites

77 pruebas automatizadas, incluyendo los veinte poderes de tarjeta, migración de votos antiguos, votos negativos/retirada, rechazo de pesos manipulados, incrementos mensuales reales y guardado de los diez juegos desde Casting y Hunger sin duplicar reintentos. Compilación Worker y sintaxis JS verificadas. Comprobaciones locales de Blogs, entrada de blog, Juegos, Hall of Fame y Minijuegos a 1440, 390 y 320 píxeles, sin errores de página ni desbordamiento horizontal. Chromium con tamaños móviles; no son pruebas físicas de Safari/iPhone. Referencias observadas: https://regaged.com/blogs, https://regaged.com/games y https://regaged.com/hof. Se adaptan a los datos, formatos disponibles e idioma de Tengaged; no se afirma una identidad píxel a píxel en todos los navegadores.

No se han modificado cuentas ni resultados reales durante las pruebas. No se ha desplegado desde este chat.

```bash
cd ~/Downloads/Tengaged-V109
npx wrangler pages deploy . --project-name tengaged-reborns
```
