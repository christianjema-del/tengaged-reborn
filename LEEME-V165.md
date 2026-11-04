# V165 — Abrir entradas de blogs y navegación común

Corrige el problema confirmado en producción: /blog/admin1/1/entrada devolvía HTTP 308 con Location: /blogs. La reescritura apuntaba a /blogs.html y la normalización de Cloudflare eliminaba la ruta de la entrada. Las reescrituras ahora apuntan al documento /blogs, sin extensión. Los enlaces nuevos usan /blogs?id=ID y los de autor /blogs?author=USUARIO. Las rutas antiguas se siguen interpretando.

Actualizados los enlaces de entradas en listado, TOP, blog personal, compartir, RSS, inicio, actividad de amigos, menciones del perfil, Casting, Hunger y Frookies. Frookies lee posts, que es el campo real de la API. Los enlaces de acceso conservan consulta y ancla; después de iniciar sesión se vuelve a la entrada concreta mediante rutas locales permitidas. No admite retorno a dominios externos o endpoints API.

Se conserva el diseño actual: todos los archivos CSS son idénticos a V164. No cambia el motor de Hunger ni las recuperaciones y clasificaciones ya aplicadas. No requiere SQL ni ejecutar otra recuperación. Incluye las entregas anteriores.

Validación: 125 archivos de pruebas correctos (la expectativa de enlace antigua de Casting se adaptó a la nueva dirección y volvió a pasar). Pruebas nuevas de rutas, autores con caracteres especiales, consulta/ancla y rechazo de retornos externos. Revisión estática de dependencias de las 34 páginas sin archivos ausentes. Navegador Chromium: entrada local escrita por un admin1 de prueba abierta desde listado y desde inicio; blog personal y comentarios visibles; pantalla de 320 px sin desbordamiento y avatar 140 × 161 decodificado. Las pruebas de navegación usan datos de prueba locales, no publicaciones creadas en producción. No se ha probado Safari real ni todas las acciones de cada sección con cada cuenta.

## Publicar
Descomprimir Tengaged-V165.zip y ejecutar por separado:

```sh
cd /Users/christianmonzonlorente/Downloads/Tengaged-V165
```

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

La corrección está en este ZIP; falta publicarlo para verificar la entrada real de admin1 en el servidor.
