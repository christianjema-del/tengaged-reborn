# Tengaged V119 · Ajuste de avatares en juegos

Actualización completa sobre V118.

Los retratos de Hunger, Casting y sus vistas de desafío/votación cubren su recuadro en lugar de dejar espacio libre alrededor. Así las fotos completas, como el avatar fotográfico de admin1, no muestran franjas del fondo azul del contenedor.

Se mantienen las dimensiones de los recuadros, los tamaños de las filas de Cornucopia y los archivos originales. El encuadre conserva las proporciones de la imagen: se recorta ligeramente lo que excede del recuadro, sin deformarlo. La corrección no afecta a iconos de armas, comida ni minijuegos.

82 pruebas automatizadas superadas y Worker compilado. Verificación visual local del avatar fotográfico en Hunger y Casting a 1440, 390 y 320 píxeles; comparación con las medidas anteriores y comprobación de ajuste cover, ausencia de relleno azul y ausencia de desbordamiento horizontal. Se conservan los cambios, prendas y concesiones de V118. No se ha publicado desde este chat.

```bash
cd ~/Downloads/Tengaged-V119
npx wrangler pages deploy . --project-name tengaged-reborns
```
