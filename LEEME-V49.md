# V49 · Inscripción previa y combates con minijuegos de Casting

Paquete completo con V48 incluida.

## Inscripción
El banner del perfil abre Elige tu juego, con las ocho tarjetas organizadas en filas de cuatro, dos y dos. La disponibilidad real de Casting/Hunger se consulta al servidor. Los formatos no implementados siguen indicando Próximamente.

Pulsar un formato abre /enroll-game.html: imagen, descripción, requisito de color, coste, saldo, plazas, presentación obligatoria de 1–500 caracteres, aviso interno de inicio opcional, Inscribirme y Cancelar. No se cobra ni se publica el mensaje al visualizar o cancelar. Al confirmar se verifican de nuevo los requisitos en el servidor.

La presentación queda guardada con el estado de la partida y aparece en su chat público. El aviso de inicio es un correo interno de Tengaged, no un email externo, y se genera en la transición de inicio si se marcó la casilla. Los reintentos no duplican cargos ni avisos. Casting sigue siendo gratis; Hunger cuesta 20 T$.

Los accesos de Unirme en Casting y Hunger llevan también al paso previo. Los usuarios ya inscritos pueden entrar directamente en su partida.

## Hunger
- Los participantes vivos ven Atacar debajo de cada rival en la Cornucopia, y Ocultarme bajo su propia plaza. Los espectadores ven Patrocinar. Eliminados, combates en curso y rivales ocupados quedan bloqueados según las reglas.
- Los combates usan el mismo lanzador, archivos SWF y catálogo de diez minijuegos originales habilitados en Casting.
- Selección aleatoria por bolsas de diez, sin repetir hasta recorrerlas; se evita repetir entre bolsas. Ambos rivales reciben la misma prueba y datos de partida.
- El minijuego registra su resultado a través del puente autenticado; luego el usuario pulsa Guardar puntuación. No hay entrada manual de puntos. Los intentos están ligados a cuenta, edición, combate, prueba y token.
- Los combates antiguos pendientes se adaptan a una prueba de Casting para ambos rivales: reinician su competición y conservan internamente sus preguntas/resultados previos. Tienen al menos dos minutos para jugar la nueva prueba. Los combates ya terminados se conservan.

## Validación
21 suites superadas: inscripción, presentación pública, saldo, notificación elegida, reintentos, puente de los diez minijuegos, pruebas idénticas para los dos rivales, tokens de usuario, ataques bajo avatares, guardado explícito y migración de combates antiguos. Recursos HTML y sintaxis JS comprobados.

Las comprobaciones del puente validan autenticación, asociación e idempotencia; no convierten los resultados enviados por Flash en un sistema antitrampas completo. Se conserva el mismo modelo de confianza que Casting.

Falta comprobar visualmente el despliegue y completar una partida SWF en el navegador publicado. Se sigue necesitando que Ruffle esté disponible, igual que en Casting. No se certifica una réplica 1:1 completa de Regaged.

## Publicar
Descomprimir en Descargas y ejecutar desde Tengaged-Reborn-V49-INSCRIPCION-Y-COMBATES:
```bash
npx wrangler pages deploy . --project-name tengaged-reborns
```
Después recargar con Cmd + Mayús + R. /api/health indica version:49.
