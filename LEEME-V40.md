# V40 · Hunger Games

Paquete completo basado en V39. Mantiene la cuenta automática Tengaged, bienvenidas, avisos de regalos, tiendas, armario, avatar y comunidad.

## Instalar

Extrae el ZIP y ejecuta desde la carpeta que contiene wrangler.toml:

```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```

No está desplegado desde este entorno. Las tablas e índices nuevos se crean automáticamente al consultar Hunger. Conserva el binding DB y el ID de D1 existente. No borres ni reinicialices la base de datos.

## Cambios

- Arena compacta con diez plazas de Cornucopia, comida compartida, recogida de armas y contador de supervivientes.
- Pestañas Juego, Resultados y Reglas; lista de caídos, combates propios, eventos paginados y blogs #hunger.
- Entrada de 20 T$, 30 plazas, espera de 24 horas, bots para completar plazas y comienzo inmediato al llenarse.
- Salud inicial 70; pérdida de 0,1 cada dos minutos fuera; recuperación de 0,1/minuto dentro con comida. Límites de flechas por zona y día.
- Ocho arbustos persistentes: dos corazones iguales para todo el reparto; una búsqueda por persona. Corazón +10, veneno −5.
- Armas con recogida de 1/1/3/5 minutos, dos usos, reemplazo o acumulación, cancelación y bonificación temporal.
- Combates de seis horas con competición compartida, puntuación validada en servidor, experiencia, salud transferida, huida, abandono y plazos. Guardar frente a bot gana el combate.
- Disparos anónimos salvo revelación del 3 %.
- Diez patrocinios por partida, solo de personas ajenas al reparto: 100 T$ por salud o flechas.
- Premios reales en karma/T$, mitad con bots; espera de cuatro horas para el ganador. Cargos y premios atómicos y únicos mediante transacciones de D1. Reintentos con la misma clave no duplican la operación.
- Mensajes privados de la partida visibles solo para sus dos participantes. Eliminados pueden leer, pero no escribir; también en comentarios públicos.
- Historial de ediciones terminadas, resultados en el perfil y consulta de comentarios antiguos.

## Compatibilidad

La edición actual se migra conservando sus participantes y las eliminaciones existentes. En una sala todavía en espera, los inscritos pasan a la salud inicial 70 y conservan su plaza sin cobro retroactivo. Una partida que ya estaba activa mantiene su salud y posiciones. Las antiguas armas numéricas se sustituyen por el nuevo sistema sin conceder existencias ficticias. El registro de premios nuevo se aplica al finalizar bajo V40; no reparte premios retroactivos a ediciones ya terminadas antes de esta actualización.

El tiempo se calcula en servidor al consultar la arena, también para periodos desconectados. Este paquete no instala un cron en Cloudflare: si nadie consulta, el avance se aplica en la siguiente visita. Una ausencia extrema se recupera en bloques de hasta siete días por consulta.

## Referencia y límites de la réplica

Inspección de la partida https://regaged.com/game/cmvleuhml0mcykaigojt7on5m y su pestaña Rules el 25/10/2026. Se reprodujeron la estructura y las reglas públicas observables, traduciendo R$ a los T$ existentes.

No es una copia 1:1 certificada. Regaged no publica su código ni su ajuste completo. La competición es una prueba original de doce cálculos en un minuto, igual para ambos rivales, con puntuaciones generadas por el servidor. Los gráficos son propios. La frecuencia de aparición de armas, decisiones de bots y distribución interna de flechas emplean una implementación propia; no se han verificado contra el código de Regaged. La comida compartida parte de 100 y los disparos usan daño entero 0–3, de acuerdo con los resultados visibles, sin acceso a su distribución interna.

## Verificación

11 archivos de pruebas pasan con Node 24: motor y API Hunger, controles Hunger, Casting, avatar, tiendas y regalos, comunidad, relaciones/chat y cuenta Tengaged. Las pruebas de Hunger cubren los cargos, premios únicos, fallo transaccional, reintentos, privacidad, salud, límites, armas, combate, huida, plazos, patrocinios, clasificación, historial y espera del ganador.

La vista previa arrancó, pero el navegador remoto no pudo abrir la dirección del entorno. Los controles se verificaron con un DOM de pruebas y la API con SQLite compatible con D1; no se ha certificado la apariencia final en un navegador ni se han ejecutado partidas reales en producción.
