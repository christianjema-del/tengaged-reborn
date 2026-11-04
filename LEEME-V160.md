# V160 — Inicio manual de Hunger y prioridad de humanos activos

## Hunger
- Se elimina el inicio automático al llenar plazas o vencer el plazo. Solo admin1 puede pulsar Iniciar.
- Completar con bots rellena las plazas y deja la partida esperando a Iniciar.
- La edición 4 activa se pausa una sola vez al recibir la primera petición tras publicar. Se conservan salud, armas, flechas, combates, bajas y operaciones económicas existentes. admin1 verá Reanudar Hunger.
- Al reanudar se desplazan los relojes del juego para no descontar salud ni consumir plazos durante la pausa. No se reinicia ni se devuelve a los fallecidos. Las ediciones terminadas no se alteran.

## Casting diario
- Humano activo: ha escrito en el chat público desde el inicio de la partida y hace como máximo 90 minutos (la hora de margen de salud más un intervalo de 30 minutos).
- Los humanos activos quedan por delante de bots en nominaciones y clasificación final. Sus métricas siguen ordenando a los humanos activos entre sí.
- Si una expulsión o una pérdida total de salud fuera a eliminar a un humano activo mientras quedan bots, se elimina primero un bot; el humano conserva al menos 1 de salud.
- No se inventan comentarios ni se considera actividad real la simulación de pruebas de bots.
- Se conservan resultados ya terminados, premios y operaciones anteriores; se mantienen las recuperaciones específicas de versiones previas.

## Publicación
Descomprime el ZIP. Abre Terminal en la carpeta que contiene wrangler.toml y ejecuta:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

Mantén el binding DB de tu proyecto actual. No hace falta SQL manual. Refresca Hunger con Cmd+Mayús+R tras publicar. Hasta que publiques, la web actual sigue con V159.

## Verificación
47 archivos de pruebas de Hunger/Casting y de regresión V160 correctos, incluida la API con SQLite: pausa de edición 4, concurrencia, permisos y reintentos sin cargos duplicados, cronómetros, posiciones, nominaciones, salud y premios.
No se ha desplegado desde esta sesión: no hay credenciales de Cloudflare configuradas.
