# V173 · Restaurar la imagen del aviso de Hunger

Se elimina exclusivamente la plantilla añadida al aviso lobby-system de Hunger en V172. Vuelve a usar la presentación original con la imagen local /assets/regaged/games/hunger/user_hidden.gif, el signo de tributo desconocido y el texto del aviso. No se añade el título Actualización del juego. Las notificaciones originales de Casting conservan su plantilla anterior.

No se modifican las reglas, las inscripciones, el estado de las partidas, la recuperación única de Hunger4 ni el inicio exclusivo de admin1. Se actualiza la versión del script de chat para descargar el cambio. /api/health identifica esta entrega como version173, V173-AVISO-HUNGER.

Validación específica: representación del aviso con imagen y sin título, recuperación de Hunger4 y control de inicio manual de los tres formatos. Este ZIP no contiene una supuesta corrección del error de conexión móvil.

Diagnóstico móvil: el usuario confirma que también falla con Servidor no responde el endpoint mínimo del Worker /__v75. Esa ruta devuelve solo texto desde el propio Worker, sin consultar Pages, D1 ni cargar JavaScript o imágenes. Desde el entorno de revisión respondió HTTP200. Esto separa ese fallo de acceso del diseño y de la carga interna; no determina por sí solo si la causa concreta es DNS, ruta, TLS, operador u otra condición del cliente. No se puede dar por resuelto cambiando archivos del frontend.

Para publicar la restauración de la imagen, ejecutar por separado:

cd /Users/christianmonzonlorente/Downloads/Tengaged-V173
npx wrangler pages deploy . --project-name tengaged-reborns

El acceso alternativo existente reenvía al proyecto Pages y recibirá el cambio sin volver a publicar su Worker. La accesibilidad desde los móviles afectados sigue pendiente de una solución y verificación de dominio/conexión.
