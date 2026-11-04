# Tengaged V105 · Tiempos y votación

- Nuevos intentos de los diez minijuegos originales: base de 100 segundos, tanto en Minijuegos como en los combates de Hunger.
- Casting diario: 100 segundos + salud actual (0–100) + un segundo por cada 100 ticks completos. Ejemplo: 85 de salud y 1500 ticks = 200 segundos.
- El servidor calcula y fija el tiempo al iniciar el intento. Recargar no lo reinicia; recoger recursos después no amplía el intento en curso. Los intentos ya iniciados conservan su duración. El cierre del día o del combate sigue siendo el límite de disponibilidad.
- La página del desafío muestra el tiempo y su desglose.
- Retirado de la página principal el bloque lateral Día / instrucciones / votación.
- Botón Votar encima de Desafío. Página independiente con avatares y 3, 2, 1 puntos únicos. Con dos nominados: 2 y 1. Nominados y espectadores no votan; se conserva la prohibición de cambiar un voto guardado. El día 1 no hay nominaciones.
- Mantiene las funcionalidades de V104, los avisos de correo y las rachas diarias.

Validación: pruebas automatizadas, compilación Worker y comprobaciones locales en Chromium a 1440, 390 y 320 px. Votación comprobada contra una base de datos local: duplicados rechazados, guardado correcto y final con dos nominados. No se han modificado cuentas ni partidas reales. No implica pruebas físicas en Safari o iPhone.

Publicar:
```bash
cd ~/Downloads/Tengaged-V105
npx wrangler pages deploy . --project-name tengaged-reborns
```
