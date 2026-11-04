# V134 · Corrección de calendario y recuperación de Frookies #1

Paquete completo sobre V133. No está desplegado desde aquí.

## Publicar y reiniciar

```bash
cd ~/Downloads/Tengaged-V134
npx wrangler pages deploy . --project-name tengaged-reborns
```

Conserva la vinculación DB existente. Después abre /frookies?id=1. En el primer acceso a esa partida (también puede producirse desde el listado de Juegos), se aplicará una única recuperación de la edición antigua #1:

- Guarda una copia íntegra del estado anterior en frookies_recovery134.
- Devuelve a TODOS los usuarios reales inscritos al estado activo, incluidos los expulsados.
- Retira los bots de la partida fallida y deja disponibles esas plazas.
- Limpia rondas, nominaciones, votaciones, resultados, intentos de PoV y expulsiones del intento anterior.
- Conserva las inscripciones originales y el chat público; no vuelve a cobrar la entrada.
- No modifica saldos ni retira premios que ya pudieran haberse abonado. Los abonos del nuevo intento tienen identificadores propios para no repetirse por reintentos.
- Deja #1 esperando a que admin1 pulse «Completar con bots e iniciar» (o «Iniciar partida» si ya está llena). No arranca por tiempo.

La recuperación lleva un marcador permanente: volver a entrar, refrescar o publicar otra vez no vuelve a reiniciar el juego. No reinicia las demás ediciones ni los otros juegos. Las acciones antiguas de HoH/PoV/votación que pertenecían al intento anterior se rechazan.

## Fallo encontrado y corrección

La versión anterior completaba salas con bots al vencer los 15 minutos. Además, una consulta a una partida atrasada podía recorrer un bucle de todas las fases pendientes usando sus plazos antiguos. Eso podía resolver varias rondas y expulsiones en una sola respuesta.

Ahora:

1. No se añaden bots por temporizador, tampoco en salas antiguas cuyo contador ya venció. Solo admin1 puede completar con bots.
2. Las nuevas partidas pueden empezar cuando se llenan con usuarios reales. La edición #1 recuperada exige inicio explícito de admin1.
3. Una consulta solo resuelve como máximo UNA fase vencida. La fase siguiente comienza en ese momento y recibe TODO su tiempo. No se acumulan rondas atrasadas.
4. Las decisiones automáticas de bots no encadenan varias fases en una misma llamada; la fase siguiente tiene su propio plazo.
5. Se mantienen la prueba de PoV de 100 segundos, HoH, nominaciones, sustitución, votos, desempate, final cuatro, jurado y premios completos.

Si nadie consulta la partida durante un intervalo largo, al volver se resolverá la fase que venció y se abrirá la siguiente con un plazo completo. Si hay gente conectada, las fases avanzan con sus plazos normales: Frookies sigue siendo un juego rápido y la ausencia durante una votación puede contar como abstención.

## Verificación

92 archivos de pruebas automatizadas superados. Se reprodujo expresamente el caso de una eliminación en octavo puesto, se recuperó a los participantes reales y se comprobó la ausencia de nuevos cargos y de reinicios repetidos. También se comprobaron todas las fases tras una inactividad de un día, consultas repetidas al mismo instante, salas antiguas con temporizador vencido, permisos HoH/PoV, inmunidades, sustitución, votos, desempate, ambos caminos del final cuatro, jurado, guardado de puntuaciones y pagos únicos.

La compilación de Functions con Wrangler 4.152.0 es correcta. Las pruebas usan datos locales; no implican que la partida de producción ya esté reiniciada.

Revisión en navegador completada con datos locales: recuperación, inicio manual, nominación, veto, sustitución y votación, con comprobación de diseño a 1440, 390 y 320 px sin errores de JavaScript ni desbordamiento horizontal.
