# V88 · Menú de cuenta y chat de Hunger

Paquete completo sobre V87. Incluye XP solo en el primer enfrentamiento y arbustos renovables cada tres horas. No borres D1 ni reinicies partidas.

## Chat

Los avisos de apertura de arbusto y renovación del bosque no aparecen en los comentarios públicos. Se filtran tanto los eventos nuevos como los que ya estaban guardados, antes de calcular el total y las páginas. Se mantienen los registros internos y la información privada del resultado bajo los arbustos. No se eliminan comentarios escritos por jugadores. Ataques, disparos, muertes y recompensas conservan su comportamiento.

## Menú

Flecha circular en la zona superior derecha, con desplegable blanco. La lista comienza con Bienvenido, nombre de usuario, Perfil y Cerrar Sesión. Continúa con Blogs, Juegos, Minijuegos, Grupos, Tiendas, Mafias, Inscripciones, Diseños, Pregúntame, Hall of Fame, Comunidad, Correo, Cómo jugar y Normas. Administración solo aparece con permisos. Correo conserva el número de mensajes sin leer. Todos los enlaces corresponden a páginas existentes.

Se retira la fila visible que antes contenía Correo, Mi perfil, saldo, Administración y Cerrar sesión bajo el logo. Las acciones pasan al desplegable. Para visitantes se muestran Entrar y Registrarse; no aparecen acciones de cuentas autenticadas.

El menú usa un desplegable nativo, con indicador de expansión, foco de teclado, cierre con Escape y al pulsar fuera. En pantallas táctiles los controles son mayores y la lista tiene desplazamiento vertical para caber en la pantalla. La sesión y el cierre conservan los mecanismos existentes.

## Publicar

```bash
cd ~/Downloads/Tengaged-V88
npx wrangler pages deploy . --project-name tengaged-reborns
```

/api/health debe indicar version 88 y build V88-MENU-Y-CHAT. No publicado desde este entorno.

## Validación

52 archivos de pruebas locales superados; Worker compilado con Wrangler 4.152.0. Se prueban el filtrado antes de la paginación, conservación de registros, navegación real, personalización segura del nombre, estados de visitante/usuario/administrador, cierre de sesión, cierre exterior y Escape. HTML, enlaces, sintaxis JS y CSS revisados. No se ha probado visualmente esta versión en un móvil físico.
