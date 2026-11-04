# V44 · Ajuste visual de Hunger según las capturas

Incluye la V43 completa.

- Controles compactos encima de las dos columnas; chat y barra lateral alineados.
- El aviso rutinario de progreso deja de ocupar un bloque amarillo; errores, eliminación y final de partida siguen visibles.
- Pestañas de dos líneas con tipografía manuscrita del sistema, contador independiente y navegación por clic/teclado.
- Formulario amarillo pálido, botones pequeños y paginación junto a las pestañas.
- Eventos compactos con autor a la izquierda, daño y víctima a la derecha; retos con icono central. El texto completo se mantiene para lectores de pantalla y al pasar el puntero.
- Lista de muertes con filas grises compactas, encabezados y tamaños ajustados a la referencia.
- Doce avatares distintos para bots, sin modificar los avatares reales.
- Recuperación de autor/objetivo en eventos antiguos cuando constan en el texto o combate guardado. No se infieren autores de disparos anónimos.

Validación: 14 suites de pruebas superadas. Comparación basada en las dos capturas proporcionadas. Falta verificar visualmente el despliegue; no se afirma coincidencia píxel a píxel. Los avatares e iconos son propios.

Publicar desde la carpeta V44:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
Después recargar con Cmd + Mayús + R.
