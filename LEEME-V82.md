# V82 · Cabecera y administración práctica

Paquete completo sobre V81: conserva perfil, tarjetas, Hunger a cero mientras come y Ruffle local.

## Publicar

```
cd ~/Downloads/Tengaged-Reborn-V82-CABECERA-Y-ADMINISTRACION
npx wrangler pages deploy . --project-name tengaged-reborns
```

Usa tu ruta real si has descomprimido en otro lugar. No borres D1. `/api/health` debe responder `version:82` y `build:V82-CABECERA-COMPLETA`.

## Cabecera común

El recorte de Comunidad procedía del ancho del menú alineado a la derecha. La corrección ya no se limita al perfil: logo, menú y controles de cuenta comparten una distribución medida en todas las páginas. Los enlaces se reparten en líneas cuando hace falta y no se ocultan en un área desplazada que corta el primer nombre. Se mantienen las nueve secciones, la sesión, los accesos de admin1 y la barra de partidas activas. Los reproductores embebidos siguen sin cabecera.

## Administrar desde el perfil

Entra como admin1, visita un perfil y despliega Administración de usuario. Desde la lista de administración, Administrar perfil lleva directamente a ese bloque.

Además de los controles existentes de karma, dinero y baneo, se añaden:

- Nariz roja temporal, sin bloquear el acceso.
- Suspensión temporal, con cierre de sesiones.
- Nariz roja y suspensión simultáneas.
- Retirar nariz roja o suspensión.
- Cerrar sesiones sin banear.
- Vaciar una biografía inapropiada.
- Conceder y equipar cualquiera de las veinte tarjetas de color, sin cobrar al usuario.
- Consultar las treinta últimas acciones de moderación de esa cuenta.

Las acciones nuevas requieren un motivo de hasta 180 caracteres. La duración de sanciones temporales puede ser de 1 a 8760 horas. Las acciones más delicadas muestran confirmación. Los permisos se comprueban también en el servidor: solo admin1 puede ejecutarlas. No se permite autosuspensión, nariz roja propia ni cierre de la propia sesión desde estos controles; la cuenta de avisos está protegida. No se añade ninguna opción para ascender a otros usuarios a administradores.

Las suspensiones temporales vencidas se retiran al consultar el perfil/la moderación o al intentar iniciar sesión. Los baneos permanentes no caducan. Retirar una sanción no recupera sesiones revocadas: el usuario debe iniciar sesión de nuevo.

La nariz roja se dibuja sobre el avatar servido por la API; se muestra también donde se usa ese avatar en juegos, perfiles y comunidad. No se altera el diseño guardado ni se puede retirar desde el editor del propio usuario. En diseños de cuerpo completo personalizados su ubicación sigue el lienzo estándar de avatar.

## Panel de administración

Se incorpora un formulario de moderación rápida, se mantiene la búsqueda de usuarios y se evita refrescar las filas mientras se está actuando dentro de ellas. Ya no se crean cuentas de prueba automáticamente al abrir el panel; el botón manual se conserva. Los cambios realizados desde un perfil actualizan sus datos sin tener que salir de él.

## Validación y límites

44 archivos de pruebas locales superados. Pruebas nuevas: exclusividad de admin1, origen de las peticiones, protección propia, duración/motivo, nariz en el SVG, revocación de sesiones, caducidad temporal, conservación del baneo permanente, concesión de tarjetas y auditoría. Worker compilado con Wrangler 4.152.0. Revisados JavaScript, HTML, referencias locales y CSS.

No se han aplicado sanciones a usuarios reales ni modificado tu base Cloudflare desde aquí. Tampoco se ha desplegado automáticamente. La cabecera se ha corregido a partir de la captura; queda pendiente verificar visualmente la nueva versión publicada en PC y teléfono. No se afirma una réplica píxel a píxel de todo Regaged.
