# UpTask — Backend

API REST para una aplicación de gestión de proyectos y tareas colaborativos. Permite a un usuario crear proyectos, asignar equipos, dividir el trabajo en tareas con estados de avance y dejar notas dentro de cada tarea.

Es la capa de servidor; el cliente web se conecta consumiendo los endpoints documentados más abajo.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Base de datos:** MongoDB con Mongoose 8
- **Autenticación:** JSON Web Tokens (`jsonwebtoken`) + hashing de contraseñas con `bcrypt`
- **Validación de entrada:** `express-validator`
- **Envío de correos:** `nodemailer` (SMTP)
- **Otros:** `cors`, `morgan` (logs HTTP en desarrollo), `dotenv`, `colors`

## Funcionalidades

- Registro de usuarios con confirmación por correo electrónico (token numérico de 6 dígitos con expiración de 10 minutos).
- Login con emisión de JWT (vigencia de 180 días).
- Recuperación y cambio de contraseña por correo.
- Actualización de perfil y verificación de contraseña actual.
- CRUD de proyectos. Cada proyecto tiene un **manager** (creador) y un **team** (miembros invitados).
- CRUD de tareas asociadas a un proyecto, con cinco estados: `pending`, `onHold`, `inProgress`, `underReview`, `completed`. Cada cambio de estado queda registrado con el usuario que lo hizo.
- Gestión de equipo del proyecto: búsqueda de usuarios por email, alta y baja de miembros.
- Notas en cada tarea, con autoría. Solo el autor de la nota puede eliminarla.
- Borrado en cascada: eliminar un proyecto elimina sus tareas y las notas de cada tarea; eliminar una tarea elimina sus notas.

## Arquitectura

El código está organizado por responsabilidad, no por feature:

```
src/
├── config/         Conexión a MongoDB, configuración CORS y transporte SMTP
├── controllers/    Lógica de cada recurso (Auth, Project, Task, Team, Note)
├── emails/         Plantillas HTML para correos transaccionales
├── middleware/     authenticate, projectExists, tasktExists, hasAuthorization, handleInputErrors
├── models/         Esquemas Mongoose: User, Token, Project, Task, Note
├── routes/         Routers de Express con cadenas de validadores
├── utils/          Helpers: hashing, generación de JWT y de tokens numéricos
├── server.ts       Configuración de la app Express (middlewares globales + montaje de routers)
└── index.ts        Punto de entrada (levanta el servidor HTTP)
```

### Puntos de diseño que vale la pena destacar

- **Middlewares de carga automática.** Las rutas con parámetros `:projectId` y `:taskId` usan `router.param(...)` para cargar el documento desde Mongo una sola vez y dejarlo disponible en `req.project` y `req.task`. Esto evita repetir `findById` en cada controlador y centraliza el manejo de "no encontrado".
- **Autorización por rol del proyecto.** El middleware `hasAuthorization` compara el usuario autenticado con el `manager` del proyecto. Solo el manager puede editar o eliminar el proyecto y sus tareas; el equipo tiene acceso de lectura y puede mover estados.
- **Hooks de Mongoose para cascadas.** El borrado en cascada está implementado en `pre("deleteOne", { document: true })` sobre los esquemas de `Project` y `Task`. Por eso los controladores siempre cargan el documento y llaman `doc.deleteOne()` en lugar de `Model.deleteOne({ ... })`, que no dispararía el hook.
- **Dos tipos de token claramente separados.** Los tokens numéricos para confirmar cuenta y resetear contraseña viven en una colección con índice TTL (`expires: "10m"`), distinta del JWT de sesión. Esto evita confundir credenciales de corta y larga vida.
- **Modo `--api` para herramientas externas.** El CORS por defecto solo acepta el origen del frontend. Pasar la bandera `--api` al arrancar el servidor permite además requests sin `Origin` (Postman, Insomnia, curl). Esto se controla en `src/config/cors.ts` leyendo `process.argv[2]`.

## Requisitos

- Node.js 18 o superior
- Una instancia de MongoDB (local o Atlas)
- Credenciales SMTP válidas para el envío de correos (en desarrollo se puede usar Mailtrap, Ethereal, etc.)

## Instalación

```bash
git clone <url-del-repo>
cd uptask-backend
npm install
```

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/uptask
FRONTEND_URL=http://localhost:5173
JWT_SECRET=cambia-esto-por-un-secreto-largo

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu-usuario
SMTP_PASS=tu-password
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Arranca el servidor en modo desarrollo con recarga automática (`nodemon` + `ts-node`). |
| `npm run dev:api` | Igual que `dev` pero relaja el CORS para aceptar peticiones sin origen (útil para probar con Postman). |
| `npm run build` | Compila TypeScript a `./dist`. |
| `npm start` | Ejecuta la build compilada. Requiere haber corrido `build` antes. |

## Endpoints principales

Todos los endpoints devuelven JSON. Los que requieren autenticación esperan el header `Authorization: Bearer <jwt>`.

### Autenticación — `/api/auth`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/create-account` | Registra un usuario y envía correo de confirmación. |
| POST | `/confirm-account` | Confirma la cuenta con el token recibido. |
| POST | `/request-code` | Reenvía el token de confirmación. |
| POST | `/login` | Devuelve un JWT si las credenciales son válidas. |
| POST | `/forgot-password` | Envía un token de reseteo al correo. |
| POST | `/validate-token` | Comprueba que un token de reseteo siga vigente. |
| POST | `/update-password/:token` | Cambia la contraseña usando el token. |
| GET | `/user` | Devuelve el usuario autenticado. |
| PUT | `/profile` | Actualiza nombre y email. |
| POST | `/update-password` | Cambia la contraseña estando autenticado. |
| POST | `/check-password` | Verifica la contraseña actual (útil antes de acciones sensibles). |

### Proyectos, tareas, equipo y notas — `/api/projects`

Todo este router exige JWT.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear un proyecto. |
| GET | `/` | Listar proyectos donde el usuario es manager o miembro. |
| GET | `/:id` | Detalle de un proyecto (incluye tareas). |
| PUT | `/:projectId` | Editar proyecto (solo manager). |
| DELETE | `/:projectId` | Eliminar proyecto y sus dependencias (solo manager). |
| POST | `/:projectId/tasks` | Crear tarea (solo manager). |
| GET | `/:projectId/tasks` | Listar tareas del proyecto. |
| GET | `/:projectId/tasks/:taskId` | Detalle de tarea (con notas y autores). |
| PUT | `/:projectId/tasks/:taskId` | Editar tarea (solo manager). |
| DELETE | `/:projectId/tasks/:taskId` | Eliminar tarea (solo manager). |
| POST | `/:projectId/tasks/:taskId/status` | Actualizar el estado de una tarea. |
| POST | `/:projectId/team/find` | Buscar usuario por email para invitarlo. |
| GET | `/:projectId/team` | Listar miembros del equipo. |
| POST | `/:projectId/team` | Agregar miembro al equipo. |
| DELETE | `/:projectId/team/:userId` | Eliminar miembro del equipo. |
| POST | `/:projectId/tasks/:taskId/notes` | Agregar nota a una tarea. |
| GET | `/:projectId/tasks/:taskId/notes` | Listar notas de la tarea. |
| DELETE | `/:projectId/tasks/:taskId/notes/:noteId` | Eliminar nota (solo el autor). |

## Modelo de datos (resumen)

- **User** — `email`, `password` (hash bcrypt), `name`, `confirmed`.
- **Token** — código de 6 dígitos asociado a un usuario, expira a los 10 minutos por índice TTL.
- **Project** — `projectName`, `clientName`, `description`, `manager` (ref User), `team` (refs User), `tasks` (refs Task).
- **Task** — `name`, `description`, `project` (ref Project), `status` (enum), `completedBy` (historial de quién dejó qué estado), `notes` (refs Note).
- **Note** — `content`, `createdBy` (ref User), `task` (ref Task).

## Notas

- Los mensajes de respuesta de la API están en español, alineados con la interfaz del cliente.
- No hay suite de tests automatizados. Las pruebas durante el desarrollo se hicieron contra Postman y contra el frontend.
- El proyecto se ejecutó originalmente en Node 20.
