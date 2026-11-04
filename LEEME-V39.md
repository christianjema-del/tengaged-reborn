# V39 · Cuenta automática Tengaged

Paquete completo sobre V38. Conserva el menú, el pie, los perfiles y las correcciones de ojos, boca, pelo y piel.

## Cuenta
La cuenta Tengaged se prepara automáticamente en la primera visita a la web después de publicar.
Es una cuenta de sistema: no permite iniciar sesión, no tiene permisos de administrador y no participa en juegos ni rankings.
Solo envía correos internos. No recibe respuestas, solicitudes de amistad, regalos ni preguntas.
Si el nombre ya corresponde a una cuenta normal anterior, no se apropia de ella ni cambia su contraseña: requiere resolver ese conflicto en administración.

## Bienvenida
Cada cuenta normal creada a partir de esta versión recibe un único correo de bienvenida de Tengaged.
Explica avatar, armario, juegos, amigos, correo, blogs, grupos y tiendas; incluye accesos a Cómo jugar y Juegos.
No se envían bienvenidas retrospectivas a todas las cuentas anteriores ni a bots de prueba.

## Avisos de regalos
Un regalo correcto genera un único correo al destinatario con remitente real, nombre del diseño y dedicatoria.
Incluye accesos al armario y a los regalos recibidos.
Entrega, saldo, existencias y aviso forman una sola operación de base de datos. Si falla, se revierte todo.
Los intentos fallidos o repetidos no generan notificaciones duplicadas.
Los avisos entran como no leídos en Correo y actualizan el contador de la cabecera.

## Publicar
Descomprime en Descargas y ejecuta:
cd ~/Downloads/Tengaged-Reborn-V39-CUENTA-TENGAGED
npx wrangler pages deploy . --project-name tengaged-reborns

Abre la web después de desplegar. No borres D1 ni recrees las cuentas.

## Validación
Nueve conjuntos de pruebas de servidor e interfaz con SQLite y datos simulados: creación y reserva del sistema, bienvenida única, notificación única, dedicatoria, contador, cuenta sin inicio de sesión, protección de transacciones y regresiones anteriores.
Las pruebas de fallos intencionados verifican que no se registren cuentas o regalos a medias.
Falta comprobar los nuevos correos en el despliegue real tras publicar.
