# V103 · Correo sin leer y premios por racha diaria

## Notificaciones
La flecha de navegación muestra el número de correos recibidos que siguen sin leer. El mismo contador aparece junto a Correo dentro del menú. Abrir el desplegable o entrar en la bandeja no marca mensajes como leídos: hay que abrir cada mensaje.
El número se conserva entre páginas, se comprueba cada 15 segundos mientras la página está visible y se sincroniza entre pestañas. Un fallo de conexión conserva el último número conocido. Los mensajes enviados no reducen el contador del destinatario.
Se ha añadido Actualizar bandeja.

## Premios de acceso
| Día del ciclo | T$ |
|---|---:|
| 1 | 15 |
| 2 | 30 |
| 3 | 55 |
| 4 | 85 |
| 5 | 120 |
| 6 | 160 |
| 7 | 210 |

Total por ciclo completo: 675 T$. Los días 4–7 se han completado con esta progresión.
El primer acceso con sesión concede 15 T$. El siguiente premio requiere 24 horas desde el abono anterior. Para mantener la racha hay que volver antes de que pasen 48 horas desde el último premio; al llegar a 48 horas se reinicia en el día 1. Tras completar el día 7, el ciclo siguiente vuelve al día 1.
No hace falta cerrar la sesión: volver a acceder con la sesión conservada también cuenta. Una pestaña abandonada sin actividad no va cobrando sola.
Cada abono genera un correo sin leer de Tengaged con el día, importe y explicación. Se registra de forma atómica el premio, el saldo y el correo. Las peticiones simultáneas o repetidas no duplican el premio. El cliente no puede elegir el importe, el día ni la fecha del abono.
La cuenta del sistema, las cuentas marcadas como bots de prueba y los usuarios suspendidos no reciben estos premios. Las comprobaciones no bloquean la carga de la sesión ni de la página.

## Pruebas
70 archivos de pruebas automatizadas, incluida concurrencia, límites exactos de 24/48 horas, los siete importes, reinicio de ciclo, falsificación de parámetros, permiso de lectura y reversión si falla el correo.
Pruebas con navegador y datos locales: primer abono y aviso, segunda pestaña sin duplicar, contador creciente, menú y bandeja sin lectura automática, lectura individual, sincronización entre pestañas, recarga y segundo premio tras 24 horas. Vistas de correo en 1440, 390 y 320 píxeles. Móvil emulado en Chromium.
Se conservan el panel de admin1 y todas las mejoras de V102. No se han abonado premios a cuentas reales desde ChatGPT durante las pruebas.

## Publicar
```bash
cd ~/Downloads/Tengaged-V103
npx wrangler pages deploy . --project-name tengaged-reborns
```
No borres ni recrees la base de datos. La preparación es automática y aditiva. Al acceder después de publicar empezará la nueva racha de cada usuario; no se calculan premios retroactivos.
Esta entrega no se ha publicado desde ChatGPT.
