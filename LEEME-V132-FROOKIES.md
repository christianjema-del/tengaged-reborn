# Tengaged Reborn · V132 · Frookies

Versión completa sobre V131. Descomprime la carpeta Tengaged-V132 y publica su contenido en el proyecto existente, conservando la vinculación DB de Cloudflare D1.

```bash
cd ~/Downloads/Tengaged-V132
npx wrangler pages deploy . --project-name tengaged-reborns
```

Después entra en Juegos → Inscripciones → Frookies. También puedes abrir /enroll-game.html?type=frookies. Las tablas nuevas se crean al acceder; no hay que borrar ni reiniciar la base de datos. Esta entrega no se ha desplegado desde aquí.

## Mecánica habilitada

- 13 plazas y entrada de 10 T$. Presentación pública y aviso opcional por correo interno al empezar.
- Inicio al completar 13 plazas. Si hay inscritos, se completa con bots tras los 15 minutos iniciales de la sala. Solo admin1 puede usar el botón de completar e iniciar antes.
- Un minuto inicial de convivencia. En cada ronda: HoH, dos nominaciones, PoV por minijuego, posible salvación y sustitución, voto secreto para expulsar y desempate del HoH.
- No se repite HoH consecutivo, salvo en el final cuatro. El HoH y los nominados no votan. Una decisión confirmada no se puede cambiar.
- Los diez minijuegos originales de Casting están integrados. Prueba aleatoria por ronda, igual para todos, de 100 segundos. Guardado del resultado y registro en el ranking general.
- Final cuatro: HoH y PoV avanzan. Si coinciden, el doble ganador elige al segundo finalista. El PoV decide el tercer puesto y el otro participante queda cuarto.
- Jurado de usuarios reales de los puestos 9.º a 3.º durante cuatro horas. Los bots no votan en el jurado. Los finalistas reales quedan por delante de los bots. Entre usuarios reales, decide el jurado, luego el HoH final y después el orden aleatorio inicial.
- Premios completos, también con bots: 1.º 25 karma/60 T$; 2.º 10 karma/25 T$; 3.º 3 karma/15 T$; 4.º y 5.º 10 T$. Cobro y abonos protegidos contra repeticiones.
- Chat público con positivos/negativos y bloqueo del voto propio; privados entre concursantes reales activos; historial de expulsiones y clasificación. Inscripciones, directorio de juegos, partidas activas, historial del perfil y estadísticas conectados.

## Plazos y decisiones por defecto

Nominaciones y prueba PoV: tres minutos; PoV y sustitución: dos minutos cada uno; expulsión: tres minutos; desempate y elecciones de finalistas: dos minutos. Las fases se actualizan al consultar la partida, usando los plazos del servidor; una pestaña cerrada no congela el calendario. La final se resuelve al acabar las cuatro horas, al siguiente acceso al servidor.

Si falta nominación o sustitución, se elige a los rivales elegibles con menor actividad. Un PoV sin respuesta no salva a nadie. Los votos ausentes se abstienen. Los empates de resultado usan un orden aleatorio fijado al entrar. Cada fase muestra su decisión automática.

## Referencia y alcance

Se contrastaron la partida de referencia, la ayuda oficial y las condiciones actuales de inscripción de Regaged. La partida enlazada es una edición histórica de 15 participantes; las nuevas salas usan las 13 plazas publicadas actualmente.

No se dispone del código ni de la fórmula interna de HoH de esa web. Por ello no se afirma equivalencia interna 1:1: esta versión usa una regla verificable de HoH (3 por votante positivo distinto, 1 por positivo recibido y hasta 5 por mensajes de la fase anterior; desempate aleatorio inicial). Los tiempos y las decisiones por defecto se explican de forma explícita en nuestra página. Se mantiene el estilo de Tengaged Reborn.

## Verificación

92 archivos de pruebas automatizadas superados, incluyendo ciclo completo hasta ganador, permisos HoH/PoV, inmunidades, desempates, los dos caminos del final cuatro, jurado, mensajes privados, acciones caducadas, cobro concurrente e idempotente, saldo insuficiente, guardado Flash y ranking, premios únicos, estadísticas e historial.

Compilación de Functions con Wrangler 4.152.0 correcta. Revisión en navegador con datos locales a 1440, 390 y 320 px: inscripción, avatares, controles, nominaciones y privados, sin desbordamiento horizontal de la página; carga del minijuego original en Ruffle. No se han modificado partidas ni saldos de producción durante las pruebas.
