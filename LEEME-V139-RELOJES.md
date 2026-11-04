# Tengaged Reborn V139

Versión completa sobre V138; no reinicia partidas ni modifica saldos.

Reloj azul original adjuntado por el usuario (GIF de 14×14 píxeles), sobre cada avatar que tenga una decisión pendiente en Frookies:

- HoH: nominaciones, sustitución, desempate y elección de finalista cuando corresponda.
- PoV: decisión de usar/no usar veto y elección del tercer puesto.
- Jugadores elegibles: voto de expulsión pendiente; excluye al HoH y los nominados.
- Jurado real: voto al ganador pendiente, incluidos los avatares de usuarios ya eliminados. Los bots y quienes no forman parte del jurado no muestran espera de voto.

El reloj desaparece al confirmarse la decisión en el servidor. Solo se publica el estado pendiente, sin revelar el destinatario de votos secretos. El mismo GIF se utiliza en Hunger mientras falta guardar el minijuego del combate.

Conserva todos los ajustes de chat de V138 y las reglas anteriores.

Publicar desde la carpeta extraída:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
