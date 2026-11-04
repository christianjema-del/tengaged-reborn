# V102 · Administración y moderadores

## Panel renovado
Usuarios, Moderadores, Registro y Utilidades. Búsqueda por nombre, filtros de estado, paginación, resumen de cuentas y ficha del usuario. Desde el perfil se abre la misma ficha, sin controles antiguos duplicados.

## Solo admin1
- Añadir o retirar karma y T$, con vista previa del saldo final.
- Nombrar y retirar moderadores; el rol de administrador queda protegido.
- Conceder y equipar tarjetas de color.
- Sanciones temporales o permanentes, nariz roja, cierre de sesiones y retirada de sanciones.
- Registro global con autor, usuario, acción, cantidad firmada, motivo y fecha.
- Utilidades de cuentas de prueba conservadas en su propio apartado; no se ejecutan automáticamente.

## Moderadores
Acceso a usuarios y a su ficha de moderación. Pueden aplicar nariz roja y suspensiones de hasta siete días a usuarios normales, retirar sus propias sanciones y vaciar una biografía con motivo. No pueden actuar sobre el equipo ni sobre la cuenta del sistema, cambiar saldos, conceder tarjetas, nombrar moderadores ni retirar o acortar sanciones ajenas. No reciben los saldos privados de los usuarios.
El cambio de rol se comprueba en cada petición: retirar el rol impide seguir usando la API aunque la sesión estuviera abierta.

## Integridad
Motivo obligatorio para todas las nuevas acciones. Operaciones monetarias atómicas, límites de saldo, protección frente a retiradas simultáneas y registro de operación para que reintentar la misma petición no duplique el ajuste. No se modifica ninguna cuenta real al instalar esta versión: admin1 decide a quién nombrar o qué cambiar.
Se conservan las tarjetas originales, avatares, diseños de Cristi y juegos de V101. No borres ni recrees D1.

## Pruebas
69 archivos de pruebas automatizadas. Pruebas en navegador con datos locales para admin1, moderador e invitado, en 1440, 390 y 320 píxeles, incluidas las cinco pestañas de la ficha, ajuste de karma, nombrar/retirar moderador, historial, sanción propia y acceso desde perfil. Los tamaños móviles se emularon en Chromium; no se ha probado físicamente cada teléfono o Safari.
Referencia pública consultada: https://regaged.com/contact y https://regaged.com/faq. Su panel privado no es accesible: esta organización está adaptada a las funciones de Tengaged Reborn.

## Publicar
```bash
cd ~/Downloads/Tengaged-V102
npx wrangler pages deploy . --project-name tengaged-reborns
```
Tras publicar, entra como admin1 y abre la flecha → Administración. Selecciona un usuario → Permisos y tarjeta → Hacer moderador. Para modificar saldo, abre Karma y T$. Cada acción pide un motivo.
Esta entrega no se ha publicado desde ChatGPT.
