# Tengaged Reborn V75 — acceso alternativo por workers.dev

## Por qué cambia el dominio

El Mac recibe HTTP 200 del servidor Pages. En el iPhone ni siquiera abre un HTML sin scripts, tanto con Wi-Fi como con datos móviles; por tanto modificar la app no puede garantizar arreglar ese error de conectividad. Esta versión permite acceder mediante un hostname **distinto** alojado en Cloudflare Workers (`.workers.dev`) que reenvía las peticiones a Pages. No crea nuevas cuentas ni duplica la base de datos: el Worker actúa de proxy y el backend original sigue usando D1.

## Publicación

Desde Terminal:

```bash
cd ~/Downloads/Tengaged-Reborn-V75-ACCESO-ALTERNATIVO
./PUBLICAR-V75.command
```

1. Se publica la app principal en Pages.
2. Se publica el Worker `tengaged-reborn-acceso` en el subdominio `workers.dev` de **tu cuenta**.
3. Copia la dirección `.workers.dev` exacta que muestre Wrangler; será el acceso alternativo del teléfono.

Si el paso 2 solicita habilitar el subdominio Workers de tu cuenta, configúralo en Cloudflare > Workers & Pages. No requiere cambiar contraseñas ni compartir tokens. El Worker recibe y reenvía los datos de inicio de sesión a la aplicación, por lo que debe permanecer en tu propia cuenta Cloudflare.

## Limitaciones

No hay acceso a tus credenciales o a tu teléfono desde aquí y por eso no se puede publicar ni asegurar que el nuevo hostname funcionará en tu red. Si iOS impide también `workers.dev`, la solución estable es asignar un **dominio propio** a Pages/Workers en Cloudflare. Ningún parche HTML corrige un fallo de acceso anterior a descargar la página.

Se mantiene el motor de Hunger y la base de datos sin migraciones.
