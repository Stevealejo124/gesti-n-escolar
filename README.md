# Gestión Escolar — Fase 2 (estructura plana)

Sitio estático en HTML5, CSS3 y JavaScript vanilla, con módulos ES y Firebase Web SDK **v13.0.0 desde las CDN oficiales**. Todos los archivos del sitio viven en la raíz; no hay carpetas `css/`, `js/` o `assets/`, ni npm, framework o build step.

## Archivos

```text
/
├── index.html                 (login email/contraseña)
├── aportes.html
├── notas.html
├── horarios.html
├── fichas.html
├── base.css
├── layout.css
├── componentes.css
├── nav.js
├── login.js
├── guard.js
├── auth.js
├── firebase-config.js
├── logs.js
├── offline.js
├── sheets.js
├── aportes.js
├── notas.js
├── horarios.js
├── fichas.js
├── logo.svg
├── icono-aportes.svg
├── icono-notas.svg
├── icono-horarios.svg
├── icono-fichas.svg
├── icon-192.png
├── icon-512.png
├── manifest.json
├── sw.js
├── firestore.rules
└── README.md
```

Las referencias internas usan rutas relativas `./archivo`; son compatibles con un dominio en la raíz y con GitHub Pages bajo `/nombre-del-repositorio/`.

## Subir los archivos con GitHub web

1. Descarga y descomprime el paquete de la Fase 2 en tu computadora.
2. Abre la carpeta plana del proyecto y selecciona todos los archivos que están dentro. No selecciones la carpeta contenedora ni subas el ZIP sin extraer.
3. En el repositorio de GitHub, pulsa **Add file → Upload files** y arrastra/selecciona todos los archivos juntos.
4. Comprueba que estén directamente en la raíz del repositorio y no dentro de una subcarpeta. Pulsa **Commit changes**.
5. En **Settings → Pages**, elige **Deploy from a branch**, selecciona la rama publicada y **/(root)**. Pulsa **Save**.
6. Espera a que Pages publique y abre la URL que muestra GitHub.

Para probar localmente, sirve la carpeta por HTTP, por ejemplo `python -m http.server 8000`; no abras `index.html` como `file://`. Auth y Firestore necesitan conexión a internet.

## Preparación obligatoria en Firebase Console

La configuración web del proyecto ya está escrita en `firebase-config.js`, con los valores indicados. El campo `measurementId` se conserva en el objeto de configuración, pero **no se importa ni inicializa Firebase Analytics**. El API key web no es una contraseña; la protección se aplica con autenticación y reglas.

1. En **Authentication → Sign-in method**, habilita **Email/Password**.
2. En **Authentication → Settings → Authorized domains**, agrega el host que te asigne GitHub Pages (por ejemplo `tu-organizacion.github.io`) y el dominio propio, si se usa.
3. Crea la base de datos de **Cloud Firestore**.
4. En **Firestore → Rules**, copia el contenido de `firestore.rules` y pulsa **Publish**. GitHub Pages no despliega reglas de Firebase automáticamente.
5. Crea cada cuenta en **Authentication → Users → Add user**. No hay registro público en el sitio.
6. Copia el UID de cada cuenta y crea en Firestore el documento `usuarios/{UID}` con estos campos:

   ```json
   {
     "nombre": "Nombre del personal",
     "email": "persona@institucion.edu.sv",
     "rol": "docente",
     "activo": true
   }
   ```

   Valores permitidos para `rol`: `docente`, `direccion` o `admin`. El documento debe tener `nombre` no vacío y `activo: true`. El perfil y los roles solo se modifican desde una herramienta administrativa confiable/Console; el cliente web no puede escribirlos.

## Qué queda implementado

- Inicio y cierre de sesión mediante Firebase Authentication con correo y contraseña; formulario de restablecimiento de contraseña.
- Guardas en las cuatro páginas: requieren sesión y perfil Firestore activo. Si Firebase o Firestore no pueden validar el perfil, el contenido protegido permanece oculto.
- Permisos de interfaz por rol. `horarios.html` queda limitado a `docente`; dirección y administración pueden consultar las demás secciones.
- Perfiles en `usuarios/{uid}` y registro de acciones en `activityLogs/{id}`. El registro incluye actor, tipo, sección y hora de servidor. Dirección/admin ve la actividad general dentro de Fichas; cada docente solo puede leer la propia.
- Reglas con denegación por defecto para cualquier colección no definida. Las funciones de notas, fichas y reportes aún muestran contenido ficticio y no escriben esos datos en Firestore.
- Los eventos de actividad pueden quedar en IndexedDB si se pierde la conexión y se intentan enviar al reconectar. La autenticación y la consulta de perfiles requieren conexión a Firebase; el sitio falla de forma cerrada y no muestra contenido protegido si no puede validar permisos.

## Límites de seguridad

- Las guardas y la navegación del navegador son controles de experiencia de usuario, no la frontera de seguridad. Firestore Rules aplica los permisos del perfil.
- Los perfiles de personal se provisionan manualmente; no existe una pantalla para asignar roles ni crear cuentas.
- El log se crea desde el cliente y se hace inmutable para el cliente según Rules, pero un usuario con herramientas de navegador puede intentar emitir acciones permitidas. Para auditoría resistente a manipulación se necesita una función/backend confiable.
- Todavía no se almacenan calificaciones, reportes ni fichas en Firestore. Antes de habilitarlos, define esquema, permisos por docente/grupo, cierres de período, autorizaciones y protección de datos locales.
- El Service Worker guarda solo el shell estático; no cachea documentos privados de Firestore. La cola IndexedDB contiene solo metadatos de actividad (UID, nombre del personal, tipo y sección), queda sin cifrado en ese navegador y puede persistir en equipos compartidos. No introduzcas datos reales durante las pruebas de esta fase.
