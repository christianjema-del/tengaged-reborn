# V87 · Arbustos cada tres horas

Paquete completo sobre V86; incluye la corrección de XP por primer enfrentamiento.

Los arbustos se renuevan en ciclos compartidos de tres horas desde el inicio de la partida, tanto en ediciones nuevas como antiguas. En cada ciclo cada tributo vivo puede abrir un arbusto. Los dos sitios seguros son iguales para todos durante ese ciclo. La renovación cambia las posiciones y borra la elección anterior.

Al instalar esta versión se libera una vez la búsqueda antigua bloqueada, sin cambiar salud, flechas, armas, XP ni resultados. Las siguientes actualizaciones y recargas no vuelven a liberar un arbusto ya abierto dentro del mismo ciclo. Si el jugador vuelve tras varios ciclos, el servidor habilita solo la búsqueda del ciclo actual; no acumula recompensas por las horas ausentes.

Bajo los arbustos aparece Nueva búsqueda en también en tu edición antigua. La página consulta la arena cada veinte segundos: al renovarse, los botones vuelven a habilitarse en esa actualización. La validación y el límite de una elección se calculan en el servidor. La guía y las normas reflejan las tres horas.

## Publicar

```bash
cd ~/Downloads/Tengaged-V87
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borres D1 ni reinicies la arena. La corrección se activa después de publicar V87 y cargar la partida. /api/health: version 87, build V87-ARBUSTOS-3-HORAS. No publicado desde este entorno.

## Comprobaciones

50 archivos de pruebas locales, incluido el desbloqueo de la partida antigua, el límite durante cada ciclo, el instante de tres horas, posiciones compartidas, reinicio y retorno tras desconexión. Worker compilado con Wrangler 4.152.0. Sin prueba visual en móvil físico.
