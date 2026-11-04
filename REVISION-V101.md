# Revisión V101

Entorno local con base de datos de prueba y Chromium. Pantallas móviles emuladas; sin prueba física en Safari.

| Ruta | 1440 | 1024 | 768 | 390 | 320 |
|---|---|---|---|---|---|
| / | OK | OK | OK | OK | OK |
| /community.html | OK | OK | OK | OK | OK |
| /games.html | OK | OK | OK | OK | OK |
| /casting.html | OK | OK | OK | OK | OK |
| /casting-game.html?id=1 | OK | OK | OK | OK | OK |
| /casting-challenge.html?id=1&round=1 | OK | OK | OK | OK | OK |
| /hunger.html | OK | OK | OK | OK | OK |
| /blogs.html | OK | OK | OK | OK | OK |
| /groups.html | OK | OK | OK | OK | OK |
| /mafias.html | OK | OK | OK | OK | OK |
| /shops.html | OK | OK | OK | OK | OK |
| /designs.html | OK | OK | OK | OK | OK |
| /gifts.html?username=Cristi | OK | OK | OK | OK | OK |
| /hall-of-fame.html | OK | OK | OK | OK | OK |
| /profile.html?username=Cristi | OK | OK | OK | OK | OK |
| /profile.html?username=admin1 | OK | OK | OK | OK | OK |
| /profile-edit.html | OK | OK | OK | OK | OK |
| /avatar.html | OK | OK | OK | OK | OK |
| /mail.html | OK | OK | OK | OK | OK |
| /questions.html | OK | OK | OK | OK | OK |
| /help.html | OK | OK | OK | OK | OK |
| /normas.html | OK | OK | OK | OK | OK |
| /enroll.html | OK | OK | OK | OK | OK |
| /enroll-game.html?type=casting | OK | OK | OK | OK | OK |
| /minijuegos.html | OK | OK | OK | OK | OK |
| /admin.html | OK | OK | OK | OK | OK |
| /game.html?id=1 | OK | OK | OK | OK | OK |
| /room.html?id=1 | OK | OK | OK | OK | OK |
| /minijuego.html?game=numbers | OK | OK | OK | OK | OK |
| /mobile.html | OK | OK | OK | OK | OK |
| /diagnostico.html | OK | OK | OK | OK | OK |

OK indica carga de la ruta sin errores JavaScript, respuestas HTTP fallidas, imágenes rotas o desbordamiento general detectados. No significa que se hayan ejecutado todas las acciones posibles de esa pantalla.

Pruebas de interacción adicionales:

- Menú móvil, correo/admin, límites de pantalla y Escape
- 15 retratos iguales comparten descarga; 10 distintos se dibujan; máximo 4 descargas simultáneas
- Fallo de imagen y recuperación de conexión sin repetir acciones
- 19 tarjetas originales; compra, equipamiento y volver a blanco sin nuevo cobro
- Vista dinámica /shops.html?tab=users
- Vista dinámica /shops.html?tab=auctions
- Vista dinámica /shops.html?tab=cards
- Vista dinámica /shops.html?tab=manage
- Vista dinámica /designs.html?mine=1
- Vista dinámica /mail.html
- Vista dinámica /profile-edit.html
- Vista dinámica /groups.html
- Vista dinámica /questions.html
- Pestañas de comentarios públicos/privados en Casting
- Cornucopia móvil: diez plazas visibles en dos filas
- Prenda ausente: editor accesible, selección intacta hasta quitar y guardar explícitamente

Tienda de tarjetas: 19 artículos, diez GIF originales y requisitos comprobados en cinco tamaños; tres columnas en PC y dos en móvil. Los invitados no pueden comprar.

68 archivos de pruebas automatizadas superados. Compilación del Worker verificada. Recursos e identificadores de las 30 páginas HTML revisados.
