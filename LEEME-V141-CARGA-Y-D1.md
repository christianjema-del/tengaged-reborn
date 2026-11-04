# Tengaged Reborn V141 — carga y consumo de D1

Versión completa sobre V140. Conserva las partidas, saldos, cuentas, armarios y reglas anteriores.

## Correcciones

- Las listas de Casting y Frookies leen directamente el resumen guardado. Ya no abren y recalculan hasta 60 partidas con sus chats en cada consulta de la lista. Las fases se siguen resolviendo al consultar la partida correspondiente.
- Contadores persistentes de comentarios y positivos de Casting: se actualizan automáticamente con cada inserción, cambio o retirada de voto y borrado de comentario. Evitan recorrer todo el historial en cada actualización. Los votos propios no generan tics.
- Índices para consultas por usuario, sala, fecha, actividad y moderación. Preparación de la estructura social reutilizada dentro de cada instancia.
- Menos consultas repetidas de conexión, correo y juegos activos. El chat consulta novedades cada 12 segundos; publicar y votar sigue actualizando la respuesta inmediatamente.
- Los errores confirmados de cuota diaria de D1 se comunican con un aviso específico y el momento de reinicio. Se conserva la página visible. Se pausan los intentos repetidos y se comprueba automáticamente la recuperación, también si se amplía el plan antes del reinicio.
- Las operaciones de escritura no se reproducen automáticamente: no hay reenvíos automáticos de compras, votos o regalos.

## Qué puede y qué no puede resolver

La corrección reduce lecturas y evita una carga indefinida por cuota agotada. No amplía el límite contratado con Cloudflare. Si la cuota ya está agotada, D1 seguirá rechazando operaciones hasta el reinicio indicado por Cloudflare o hasta ampliar el plan. Un despliegue no reinicia esa cuota.

## Instalación

Extraer el ZIP y ejecutar desde Tengaged-V141:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borrar la base D1 ni crear una nueva. Los contadores e índices se preparan automáticamente cuando D1 vuelve a permitir consultas; se conservan los datos anteriores.

## Verificación

98 pruebas automatizadas de juegos, economía, sesión, votos, recuperación y control de cuota. Navegador a 1440, 390 y 320 píxeles: inicio, perfil, juegos, Hunger, Casting, Frookies, blogs y tiendas. Simulación de cuota agotada: aviso visible, diez intentos repetidos suprimidos y recuperación automática. Compilación de Functions verificada.
