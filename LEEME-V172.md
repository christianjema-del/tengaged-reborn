# V172 · Hunger #4 abierto e inicio exclusivo de admin1

Fallo identificado: la acción de pasar a la siguiente edición usaba Object.assign sobre el estado anterior. Las propiedades ausentes de fresh(), incluida manualStart160, podían permanecer. La edición nueva podía tener startAt=null y conservar una autorización anterior; al avanzar se iniciaba desde un reloj nulo y simulaba el tiempo transcurrido desde 1970. El estado público observado de Hunger4 tenía startedAt=null, eventos alrededor de 134640000 y ganador Tributo_24.

Corrección:
- Al pasar de edición se elimina el estado anterior y se crea uno limpio, sin autorizaciones heredadas.
- La nueva autorización de inicio identifica juego, edición/partida, reinicio y fecha. Solo admin1 con rol de administrador puede emitirla, pulsando Iniciar. Hunger toma su reloj de esa autorización, no de un campo vacío.
- Las consultas y acciones de los servicios de Casting y Frookies activan el requisito de inicio manual. No basta completar las plazas ni añadir bots. Botón Completar con bots y botón Iniciar separados. Casting oficial requiere 20 plazas y Frookies 13 para habilitar Iniciar; Hunger conserva el mínimo de dos participantes.
- Se mantienen las partidas de otros formatos que ya estaban en curso; el requisito se aplica a sus inscripciones presentes y siguientes. La sala antigua de Casting ya restringía el inicio a admin1.

Recuperación de Hunger4 solicitada:
- Al primer acceso a Hunger o su archivo tras desplegar, se guarda el estado completo anterior en hunger_recovery172 y se reabre la edición4 terminada.
- Conserva todos los inscritos humanos, con salud70, sin puesto final: Peach, Lamine, Cristi, PauCubarsi y Giovanni, que también figura inscrito en el estado real. Elimina bots y resultados de combate de la sala reabierta. Las plazas quedan abiertas.
- Conserva operaciones económicas y recibos: no cobra otra entrada ni devuelve/aplica premios por segunda vez. El historial se actualiza a participación activa, sin puesto final. No se vuelven a modificar los saldos por esta recuperación.
- No reemplaza una edición posterior con participantes o en marcha. En la revisión previa, la arena actual era edición6 vacía en espera, por lo que admite restaurar la4. Conserva copia de esa arena y del archivo4 antes del cambio, con comparación de revisión y transacción de base de datos.
- Se realiza una sola vez. Si admin1 inicia después, no vuelve a reiniciarse ni se borra su partida.
- El aviso de reapertura se muestra como aviso del juego, sin retrato de tributo desconocido.

Validación: 135 archivos de pruebas pasan. Incluye reproducción del estado con inicio heredado/fecha nula, recuperación concurrente del archivo4 desde una arena6 vacía, conservación de cinco humanos y saldos, respaldo, inexistencia de bots, 30 días simulados en espera y autorización por edición. Incluye pruebas de salas llenas de Casting y Frookies que permanecen en espera y rechazo de otro administrador. Revisión del navegador de las tres salas y botones separados. Los datos y el servidor de prueba se excluyen del ZIP. La publicación y la comprobación del estado real siguen pendientes hasta desplegar.

Publicar por separado:

cd /Users/christianmonzonlorente/Downloads/Tengaged-V172
npx wrangler pages deploy . --project-name tengaged-reborns

Al terminar, abrir /hunger?edition=4 para aplicar la recuperación. /api/health debe indicar version172, V172-INICIO-MANUAL. No hay que ejecutar SQL adicional. Conservar el registro de despliegue y comprobar que el estado público de Hunger4 es waiting y que están los cinco participantes humanos vivos, sin bots.
