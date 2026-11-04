# Tengaged V112

Actualización completa sobre V111.

Se sustituyen las referencias escritas visibles a Regaged por Tengaged Reborn. Incluye textos de Tiendas y Diseños y etiquetas antiguas del catálogo al mostrarlas en las distintas secciones. También se corrigen etiquetas de accesibilidad, títulos y textos alternativos.

Las rutas de recursos, identificadores técnicos, archivos históricos y datos almacenados se conservan para evitar roturas o duplicados. No se modifican los borradores que esté escribiendo un usuario ni los scripts o estilos durante la normalización visual.

Hunger: se retira la línea de inscritos, cuenta atrás de inicio y aviso de plazas completadas con bots. La lógica de inscripción y los controles de administración se conservan.

78 pruebas automatizadas superadas y Worker compilado. Revisión de las secciones principales en navegador local. No publicado desde este chat.

```bash
cd ~/Downloads/Tengaged-V112
npx wrangler pages deploy . --project-name tengaged-reborns
```
