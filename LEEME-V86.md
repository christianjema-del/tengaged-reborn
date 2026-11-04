# V86 · Experiencia de Hunger

Paquete completo sobre V85. No borres D1 ni reinicies la partida.

## Corrección

La limitación de experiencia por primer rival solo estaba activa para reglas >=77. La edición en curso conserva reglas anteriores. Ahora se aplica a todas las ediciones: solo el primer enfrentamiento de una pareja puede dar XP al vencedor (2 si ataca, 1 si defiende); todos los siguientes dan cero, también si se intercambian los papeles o gana quien perdió el primero. Huir no da XP.

Al cargar la partida actual, una corrección de datos de una sola ejecución elimina la XP de revanchas del total y corrige los campos de XP del historial. Se conserva cualquier saldo inicial no atribuido a esos combates. Se guarda el valor anterior para auditoría interna y la corrección no se repite tras reiniciar. Los ganadores, daños, salud, premios, dinero y puntuaciones históricas no se vuelven a calcular. El bonus de XP de combates todavía pendientes se adapta al total corregido; las puntuaciones originales enviadas se conservan. Los archivos históricos de ediciones ya archivadas no se reescriben.

## Puesta a punto

La lucha actual avisa si el rival ya fue enfrentado y el combate no da XP. El arma indica bonus temporal, distinguiéndolo de la experiencia acumulada. La guía explica la regla. Se conservan Sponsors, cabecera sin pestañas, normas al final, arbustos 4+4 y entrada manual a las luchas.

La página V85 publicada volvió a cargar durante la comprobación en el navegador, como confirmó el usuario. No se ha identificado ni atribuido una causa al fallo de carga transitorio.

## Publicación

```bash
cd ~/Downloads/Tengaged-V86
npx wrangler pages deploy . --project-name tengaged-reborns
```

La corrección se aplicará al cargar la arena después de publicar V86. /api/health debe responder version:86, build:V86-HUNGER-XP. No publicado desde este entorno, que no tiene autorización de Cloudflare.

## Comprobaciones

49 archivos de pruebas locales y Worker compilado con Wrangler 4.152.0. Se incluyen ediciones antiguas y nuevas, revanchas, roles invertidos, primera derrota, rival nuevo, persistencia, corrección idempotente y conservación de resultados, salud y puntuaciones. No se ha probado visualmente V86 en un móvil físico.
