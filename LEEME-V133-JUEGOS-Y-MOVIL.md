# Tengaged Reborn · V133

Paquete completo sobre V132: incluye Frookies y todas las funciones anteriores.

## Publicar

Descomprime el ZIP y ejecuta dentro de la carpeta:

```bash
cd ~/Downloads/Tengaged-V133
npx wrangler pages deploy . --project-name tengaged-reborns
```

Conserva la vinculación DB existente. No borres ni reinicies la base de datos. Este paquete no se ha publicado desde aquí.

## Juegos y Frookies

- Directorio con las proporciones de la captura: banners de tiendas y subastas, acceso a inscripciones, últimos mensajes y tabla de partidas.
- Colores de formato: Frookies/Rookies rosa, Casting/Fasting azul, Survivor verde, Hunger negro/dorado y Stars azul/amarillo. Se muestran partidas reales; los formatos sin implementar no crean salas ficticias.
- La tabla principal reúne las últimas partidas, incluidas las terminadas. El archivo de partidas finalizadas continúa disponible en un desplegable.
- Cabecera original de Frookies incorporada como archivo local, con degradado, identificador rosa, ronda y contador. Fuente: /ui/frookies/bg-game-title-fastrookies.gif de la página de referencia.
- Fila de avatares con marco azul, nombres, presencia, HOH, POV, interrogante de nominación, tick de permanencia y puestos de expulsión. Los bots conservan 0 min.
- Panel de ronda y poder de veto, nominaciones y expulsiones con etiquetas negras y texto amarillo, e historia del juego con horas. Textos en castellano y marca Tengaged Reborn.
- Los últimos mensajes del directorio reconocen Frookies y enlazan a su partida correcta.

## Móvil

Ajustes compartidos en navegación, perfiles, blogs, tiendas, diseños, inscripciones, juegos y páginas de ayuda: columnas adaptables, controles y contenido limitados al ancho disponible, enlaces largos que parten línea y pie de página adaptable.

El chat de los juegos usa mensajes de 12px y caja de escritura de 64px en teléfono. La escritura mantiene 16px para evitar el zoom automático de iOS; el texto publicado es más pequeño. Los positivos y negativos conservan sus colores y el bloqueo gris del voto propio. Los accesos a partidas activas se disponen en una fila compacta y la cabecera móvil deja de ocupar la pantalla al desplazarse. La fila de Frookies se desliza dentro de su espacio.

## Comprobaciones

- 92 archivos de pruebas automatizadas superados.
- Compilación de Cloudflare Functions correcta con Wrangler 4.152.0.
- 22 pantallas revisadas en navegador a 1440, 390 y 320px, sin errores de JavaScript ni desbordamiento horizontal de la página con los datos de prueba.
- Revisión adicional de Juegos, Frookies, Casting y Hunger tras el ajuste final: colores de las filas, cabecera original, privados, tamaño del compositor y de los mensajes, y accesos a partidas activos en una fila.

Las comprobaciones se realizaron con datos locales. No se han modificado saldos, usuarios ni partidas de producción. La revisión responsive verifica los estados cargados; no constituye una prueba de cada posible acción de cada usuario en producción.
