# V55 — Mensajes automáticos Hunger

Base: ZIP V54 proporcionado por el usuario.

- Eventos `death`: tarjeta amarilla con calavera (`assets/hunger/death.svg`) y texto de eliminación derivado del evento del servidor.
- Eventos `challenge`: tarjeta de ataque con espadas (`assets/hunger/challenge.svg`) y atacante/destinatario.
- Eventos `fight`: tarjeta con espadas y el resultado comunicado por el servidor.
- Los daños no se insertan en las tarjetas de desafío; el resultado del combate sigue mostrándose en el panel de resultados existente.
- Los disparos anónimos se conservan anónimos: no se revela el identificador del atacante en avisos ordinarios.
- Se mantienen comentarios, mensajes privados, clasificación, historial, lógica de juegos y endpoints sin alterar.

Nota: Regaged se carga dinámicamente y no se pudieron verificar ni extraer sus gráficos originales. Se reutilizan los recursos locales disponibles; no se garantiza identidad visual 1:1.

Publicar: desde la carpeta descomprimida ejecutar `npx wrangler pages deploy . --project-name tengaged-reborns` si esa es la configuración del proyecto.
