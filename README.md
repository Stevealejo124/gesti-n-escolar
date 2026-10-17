# Gestión Escolar — Fase 1 (estructura plana)

Prototipo estático multiarchivo: HTML5, CSS3 y JavaScript vanilla. **Todos los archivos de la web están en la raíz, sin subcarpetas.** No hay frameworks, npm, bundler ni paso de compilación.

> La entrega es una demo de interfaz. Firebase, Google Sheets, autenticación, guardado real y sincronización todavía no están configurados. No cargues nombres, calificaciones, reportes ni otros datos reales de estudiantes.

## Archivos

```text
/
├── index.html
├── aportes.html
├── notas.html
├── horarios.html
├── fichas.html
├── base.css
├── layout.css
├── componentes.css
├── nav.js
├── offline.js
├── sheets.js
├── firebase-config.js
├── auth.js
├── aportes.js
├── notas.js
├── horarios.js
├── fichas.js
├── logs.js
├── logo.svg
├── icono-aportes.svg
├── icono-notas.svg
├── icono-horarios.svg
├── icono-fichas.svg
├── icon-192.png
├── icon-512.png
├── manifest.json
├── sw.js
└── README.md
```

Todas las referencias internas empiezan con `./`, así que sirven tanto en el dominio raíz como en una dirección de GitHub Pages del tipo `usuario.github.io/repositorio/`.

## Subir todo con GitHub web — un solo “Upload files”

1. Descarga y **descomprime** el paquete ZIP de esta entrega en tu computadora.
2. Abre la carpeta `gestion-escolar-plano` que se creó al extraerlo. Selecciona **todos los archivos que están dentro** (no la carpeta contenedora ni un ZIP) y cópialos/arrástralos juntos.
3. En GitHub, abre el repositorio donde publicarás el sitio. Si el repositorio aún no existe, créalo primero.
4. Pulsa **Add file → Upload files**. Arrastra o selecciona en una sola operación todos los archivos de la carpeta plana. Comprueba que GitHub muestre los archivos directamente en la raíz, sin directorios `css/`, `js/` o `assets/`.
5. Escribe un mensaje, por ejemplo `Publicar prototipo Fase 1`, y pulsa **Commit changes**.
6. Abre **Settings → Pages**. En **Build and deployment**, selecciona **Deploy from a branch**, elige la rama (por ejemplo `main`) y la carpeta **/(root)**; pulsa **Save**.
7. Espera la publicación y abre la URL que indique GitHub Pages. Para volver a subir cambios, repite **Add file → Upload files** con los archivos actualizados.

**No subas el ZIP como un archivo único:** GitHub Pages no lo descomprime. Hay que extraerlo y subir los archivos que contiene. El README también forma parte de la carga.

## Prueba local opcional

Desde la carpeta plana, sirve los archivos con un servidor HTTP local; por ejemplo:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. No uses `file://`: los módulos ES y el Service Worker requieren HTTP(S). En producción, Pages utiliza HTTPS y permite el Service Worker.

## Incluido en esta fase

- Navegación entre las cuatro pestañas y estilos responsive.
- Filtros y búsqueda de demostración, promedio de notas ilustrativo y controles de vistas del calendario.
- Manifest PWA e iconos; Service Worker con caché de archivos estáticos para uso offline básico.
- Esqueleto de cola IndexedDB y módulos de integración pendientes.
- Firebase Web SDK 10.12.5 con imports CDN diferidos; no se conecta hasta completar la configuración.

Antes de usar datos reales aún hay que configurar Firebase, roles, reglas de acceso, privacidad local, autorización de cambios, Apps Script y el contrato de sincronización. La apariencia de botones o perfiles en el navegador **no** protege datos: los permisos deben validarse en Firebase/backend.
