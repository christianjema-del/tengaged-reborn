# V163 — Recuperación de Hunger 4 finalizado

Incluye V162 completa, blogs y compatibilidad. Corrige el caso confirmado por la API pública: Hunger 4 finalizado y archivado con los cuatro usuarios y 26 bots, seguido de Hunger 5 esperando sin inscritos.

Al consultar la arena o el historial tras publicar, recupera Hunger 4 del archivo, conserva Peach, Lamine, Cristi y PauCubarsi con salud inicial y sin clasificación, quita los bots y abre inscripciones. No empieza por tiempo ni por llenarse: solo admin1 puede iniciarlo. Conserva operaciones y recibos de entrada para evitar cargos repetidos, y una copia privada del resultado anterior y de Hunger 5. Retira el resultado inválido del archivo público y el historial de los cuatro inscritos se actualiza a activo, sin puesto.

La recuperación es de una sola vez y usa comparación de revisión para peticiones simultáneas. No sustituye una edición posterior con inscritos o en marcha, ni una edición 4 que ya fue recuperada o iniciada manualmente. No cambia blogs ni las correcciones de Castings.

Prueba nueva con base SQLite real: edición 4 archivada, edición 5 vacía, consultas simultáneas, cuatro plazas conservadas, bots retirados, historial, balances estables, entrada nueva, permiso de admin1 y ausencia de reinicio tras inicio manual. No se ha accedido a credenciales Cloudflare ni se ha desplegado desde este entorno.

## Publicar
Descomprimir Tengaged-V163.zip. En Terminal, dentro de la carpeta Tengaged-V163 con wrangler.toml:

```sh
npx wrangler pages deploy . --project-name tengaged-reborns
```

Abrir /hunger.html?edition=4 tras completar el despliegue y comprobar: esperando, cuatro inscritos, sin bots. También se puede abrir /api/hunger?edition=4 para comprobar phase: waiting y edition: 4. Si una edición posterior se ha inscrito entre tanto, la protección impide sustituirla automáticamente y deberá revisarse ese estado.
