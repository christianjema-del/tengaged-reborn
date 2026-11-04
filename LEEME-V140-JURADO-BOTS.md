# Tengaged Reborn V140

Versión completa sobre V139. Incluye los bots en el jurado de Frookies por petición expresa del usuario.

- Todos los puestos 3.º al 9.º forman parte del jurado, incluidos los bots.
- GIF azul original de 14×14 sobre cada jurado que aún no haya votado. El reloj permanece visible sobre los retratos de eliminados; no aparece en finalistas ni en puestos 10.º–13.º.
- Cada bot emite un único voto automático, con un plazo persistente de 30–120 segundos. La opción y el momento se fijan en el servidor y no cambian al recargar.
- Los usuarios reales conservan su elección manual. No se publican destinatarios de votos ni la programación interna de bots.
- Se aplica también a partidas ya en fase de jurado. Al instalarse, los bots pendientes reciben su plazo de 30–120 segundos desde la primera actualización de esa partida. No se retrasa el cierre de la final; los votos de bots vencidos se guardan antes de resolverla.
- No se reinician partidas ni se alteran entradas, premios o saldos. Las partidas ya finalizadas permanecen cerradas. Se mantienen los criterios previos de clasificación final, incluida la prioridad de un finalista real sobre un bot, y los desempates existentes.
- Se conservan los relojes de HoH, PoV, sustitución, desempate, expulsión y Hunger, y los chats ajustados de V138/V139.

Verificación: 96 pruebas automatizadas; comprobación en navegador a 1440, 390 y 320 píxeles del caso de siete jurados bots, sus relojes y su desaparición tras registrar los votos.

Publicar desde la carpeta extraída:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
