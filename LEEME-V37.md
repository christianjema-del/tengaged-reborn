# V37 · Comunidad ampliada
Paquete completo: incluye todas las correcciones V28–V36 de tiendas, compras, regalos, inventario, avatar y capas.
No necesitas instalar V36 primero.

## Publicar
Descomprime en Descargas y ejecuta:
cd ~/Downloads/Tengaged-Reborn-V37-COMUNIDAD
npx wrangler pages deploy . --project-name tengaged-reborns

No borres ni recrees D1. Las nuevas tablas se crean automáticamente y conservan las cuentas, saldos, partidas e inventarios existentes.

## Funciones nuevas
- Correo privado: recibidos, enviados, conversación, lectura, contador y bloqueo de usuarios.
- Grupos: directorio, búsqueda, grupos abiertos o por solicitud, admisión, miembros y cesión de administración.
- Foro de grupos: temas, respuestas y cierre por el propietario.
- Encuestas: opciones, resultados, un voto por miembro y cierre.
- Galería de imágenes por grupo, con acceso restringido en grupos privados.
- Pregúntame: preguntas privadas pendientes y respuestas públicas.
- Blogs: votos positivos y negativos, comentarios, paginación, vistas Top/Hoy/Anteriores y cierre de votos a los tres días.
- Comunidad: buscador de usuarios, actividad reciente, contador de conectados y comentarios públicos de juegos.
- Nuevos accesos en perfiles, cabecera, portada y juegos; franja Mis juegos activos y guía Cómo jugar.

## Validación
Ocho conjuntos de pruebas pasan. Cubren compras, regalos, editor, capas, chat, Casting, permisos, correo, bloqueos, grupos privados, admisión, encuestas, blogs y renderizado de nuevas pantallas mediante datos simulados.
Se comprobaron sintaxis e imports de los módulos nuevos y la presencia de las páginas y archivos en el ZIP.
No se ha publicado desde este entorno ni se ha realizado una revisión visual de las nuevas pantallas contra el D1 real. Comprueba una cuenta normal y una de propietario después de desplegar.

## Alcance
Esta entrega amplía la semejanza con Regaged, pero no es una copia 1:1 completa.
Consulta COMPARACION-REGAGED-V37.md para las diferencias que quedan.
