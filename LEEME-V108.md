# Tengaged V108 · Armario de Peach

Versión completa sobre V107. Concede sin coste a Peach los diseños existentes 32 Fondo, 31 Ropa, 30 Ojos, 29 Pelo, 22 Ropi y 17 Bigotes. Se comprueban ID, título, autor y categoría; los artículos ya poseídos no se duplican. No cambia el conjunto equipado ni los saldos.

Tras desplegar, basta abrir la web o el armario de Peach para aplicar la concesión. Las prendas 31 y 22 son alternativas dentro de la misma categoría, no se equipan simultáneamente.

Se ajustan las posiciones y proporciones de las prendas y de los bigotes. Los ojos incluyen una versión transparente preparada para eliminar el parche blanco exterior, conservando el original en la base de datos. Esta corrección de visualización y las posiciones se aplican al mismo recurso cuando lo utilice cualquier propietario.

Comprobación local del armario, concesión idempotente, guardado de ambos conjuntos, vista pública del avatar y tamaños de Chromium 1440, 390 y 320 píxeles. No se han hecho pruebas modificando cuentas reales ni se ha desplegado desde este chat. No implica pruebas físicas de Safari/iPhone.

```bash
cd ~/Downloads/Tengaged-V108
npx wrangler pages deploy . --project-name tengaged-reborns
```
