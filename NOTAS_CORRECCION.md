# Corrección de Casting y fechas — 24/10/2026

- Se retira el botón rojo/verde de las pruebas en las rondas nuevas. La rotación pasa a suma, secuencias, multiplicaciones y código numérico.
- El motor acepta y valida las respuestas en el servidor para las cuatro pruebas.
- Se refuerza la conversión de fechas Unix en segundos, milisegundos y SQL. Para fechas antiguas ausentes, se muestra «Fecha no disponible» sin inventar una fecha.
- Se añade versión al JS para reducir problemas de caché.
- Para desplegar desde **la carpeta que contiene wrangler.toml**: `npx wrangler pages deploy . --project-name tengaged-reborns`
- NOTA: estas cuatro pruebas son originales y no son copias de los minijuegos gráficos de Regaged. La integración completa de esos juegos sigue pendiente.
