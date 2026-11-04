# V78 · Casting diario

## Instalar
Descomprime el ZIP completo y entra en la carpeta Tengaged-Reborn-V78-CASTING-DIARIO. Publica con PUBLICAR.command o:

```
npx wrangler pages deploy . --project-name tengaged-reborns
```

No borres la base de datos. El motor crea las tablas auxiliares y conserva el historial. `/api/health` debe responder version 78 tras publicar.

## Cambios
- Casting de veinte plazas, inicio al llenarse y días fijos de doce horas.
- Día uno sin nominados. Tres nominados desde el segundo día; dos desde el final siete. Una expulsión por día. Los nominados no votan y cada valor de expulsión se asigna una sola vez.
- Rangos ponderados: llaves 50 %, prueba 25 %, checks 25 %. Los empates de valores comparten el rango medio. Llaves ilimitadas sin consumir; no garantizan salvación.
- Final automática al quedar cinco: mismas ponderaciones; rendimiento medio por percentil diario para comparar minijuegos distintos. Tabla con contribuciones ponderadas y puesto.
- Diez pruebas originales, mismo juego diario para todos, rotación aleatoria persistida. Un intento diario y sin coste de salud. El tablero permanece abierto durante la actualización de recursos.
- Salud inicial 70, manzanas +15 hasta 100, veneno −15, eliminación a cero. Sin descanso gratuito.
- Avisos públicos cada hora. Llave forzada a las horas 1, 5 y 9 de cada día; al menos tres llaves ofrecidas por día. El aviso central desaparece al recogerse o al vencer una hora.
- Check manual, máximo uno por segundo. Paquete privado cada 3000 checks, con una llave o una manzana y reclamación única.
- Mensajes privados por partida: visibles únicamente para remitente y destinatario; pestañas junto a comentarios públicos.
- Diseño compacto con diez avatares por fila en escritorio, cinco en teléfono; panel gráfico original de Casting y mensajes de Big Brother con los GIF reales de llave y veneno.
- Reparado polish.css, que en V77 contenía JavaScript en lugar de CSS.
- Se conserva Hunger V77 y el resto de funciones.

## Compatibilidad
Las partidas rápidas ya iniciadas conservan su motor y sus resultados. Las salas todavía abiertas se adaptan a veinte plazas conservando sus participantes y recursos. Las nuevas partidas usan el formato diario. El modo de administración puede iniciar con seis o más participantes para pruebas y cerrar un día manualmente; el inicio normal requiere veinte.

## Decisiones donde las normas aportadas no concretan el detalle
Se documentan en las reglas de la web: una expulsión por día; tres nominados antes del final siete; salud inicial 70 (como en la referencia); pérdida de un punto por media hora tras una hora de inactividad; checks mediante botón con límite de un segundo; paquetes de llave o manzana; promedio de percentiles diarios en la final; desempate total mediante valor aleatorio persistido al inscribirse. Estas decisiones implementan los detalles no especificados: no se afirma que reproduzcan el código privado de Regaged.

## Validación
38 archivos de pruebas locales superados: motor, API con SQLite, concurrencia de llaves/checks, privacidad, liquidación única de premios, interfaz y conservación de partidas anteriores. Worker compilado correctamente con Wrangler 4.152.0; referencias HTML e identificadores comprobados. Las puntuaciones siguen usando el puente de los originales existente y no constituyen una verificación criptográfica de la partida jugada.
La composición se contrastó con la página pública de referencia. No se ha verificado visualmente en navegadores y teléfonos reales esta versión local ni se ha desplegado en tu Cloudflare desde este entorno.
