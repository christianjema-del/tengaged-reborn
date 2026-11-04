# V63 · Dianas efímeras

- Los eventos de diana y veneno dejan de aparecer en el chat público inmediatamente después de ser reclamados por un jugador o al caducar.
- El filtrado se realiza en `/api/game-chat`, basado en el estado persistido del servidor, por lo que se sincroniza para todos los usuarios en la siguiente actualización del chat.
- Se retira el aviso inmediatamente en el navegador del jugador que reclamó el premio tras recibir confirmación del servidor.
- Se conserva el otorgamiento de 3 flechas y la protección contra reclamaciones duplicadas en el motor.
- No se eliminan los registros internos ni los resultados de muerte.
