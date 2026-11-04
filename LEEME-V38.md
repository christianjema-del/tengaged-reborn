# V38 · Perfil, menú y rostro

Paquete completo: sustituye directamente V37 y conserva todas las funciones y correcciones anteriores.

## Cambios pedidos
- Retira Jugadores del menú.
- Sitúa Grupos inmediatamente después de Minijuegos, en la misma navegación y con el mismo estilo.
- Mueve Pregúntame y Cómo jugar al pie, junto a los enlaces anteriores al lema Tengaged Reborn.
- Restaura el blanco de los ojos comprados sin tapar iris ni pupilas.
- Elimina restos claros bajo la boca. Conserva pelo y piel.

## Perfil tras revisar Regaged con autorización
- Galería de regalos recibidos y diseños adquiridos, con contador y acceso al armario.
- Dedicatoria opcional al enviar regalos.
- Orden personalizable de amigos.
- Grupos del usuario: las afiliaciones a grupos privados solo aparecen al propio usuario.
- Últimas menciones en blogs usando @nombre.
- Página Editar perfil con biografía de hasta 1.000 caracteres, vista previa y colores desbloqueados.
- Enlaces HTTPS a imágenes o GIF en la biografía se muestran como imagen; el resto de texto se trata como texto, sin ejecutar HTML.
No se abrieron mensajes privados ni se modificaron datos en Regaged.

## Publicar
Descomprime en Descargas:
cd ~/Downloads/Tengaged-Reborn-V38-PERFIL
npx wrangler pages deploy . --project-name tengaged-reborns

No borres D1. Se conservan IDs, cuentas, inventarios, saldos y partidas. Los esquemas y capas conocidas se actualizan automáticamente.
Después recarga con Cmd + Mayús + R.

## Validación y alcance
Ocho conjuntos de pruebas pasan. Incluyen correo y privacidad, grupos, blogs, orden de amigos, galerías, dedicatorias, compras y regalos, editor, Casting y chat.
Se comprobó el orden de navegación, la posición de los enlaces del pie y las máscaras de los ojos/boca. Las pantallas nuevas se ejercitaron con datos simulados; falta revisión visual en el despliegue real.
Esta entrega no afirma paridad 1:1 completa con Regaged. Continúan pendientes los formatos adicionales de juego, el cambio anual de nombre, la verificación de correo, las invitaciones con premios y otras reglas de mafias y tiendas.
