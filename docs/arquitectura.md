# Arquitectura del sistema

GymPro sigue una arquitectura **cliente-servidor en 3 capas** con autenticación basada en **JSON Web Tokens (JWT)** y control de acceso por roles.

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vista (HTML + CSS)  ─  Controlador (JS vanilla)     │  │
│  │         ↓                    ↓                       │  │
│  │         └──────► api.js (fetch + JWT) ───┐           │  │
│  │                                          │           │  │
│  │  Timer de expiración de sesión (15s-8h) │           │  │
│  └──────────────────────────────────────────┼───────────┘  │
└─────────────────────────────────────────────┼──────────────┘
                                              │ HTTP / JSON
                                              │ Authorization: Bearer <token>
                                              ▼
┌────────────────────────────────────────────────────────────┐
│              SERVIDOR (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Middleware Pipeline                                │  │
│  │   1. CORS + JSON parser                              │  │
│  │   2. auditMiddleware (activity.log)                  │  │
│  │   3. authMiddleware (verifica JWT)    ← 🔒           │  │
│  │   4. requireRole('admin'|'coach'...) ← 🔒           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Rutas REST protegidas                              │  │
│  │   /api/auth      /api/users     /api/exercises       │  │
│  │   /api/routines  /api/sessions  /api/ai              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Servicios                                          │  │
│  │   - aiService (Gemini)                               │  │
│  │   - contextBuilder                                   │  │
│  │   - prompts                                          │  │
│  │   - logger (activity.log)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────┘
                                            │ SQL
                                            ▼
┌────────────────────────────────────────────────────────────┐
│                    PERSISTENCIA                            │
│  ┌──────────────────┐    ┌───────────────────────────┐    │
│  │   SQLite (BD)    │    │   activity.log (auditoría)│    │
│  └──────────────────┘    └───────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

El proyecto expone una **API REST** construida sobre Express que sirve al frontend. Todos los endpoints usan **JSON** como formato de intercambio de datos.

> 📍 **URL Base**: `http://localhost:3000/api`
>
> 🌐 **En producción (Render)**: `https://gympro-24ly.onrender.com/api`

---

## 🔐 Sistema de Autenticación y Autorización

El proyecto implementa un sistema de seguridad basado en **JSON Web Tokens (JWT)** y **Control de Acceso Basado en Roles (RBAC)**.

### 🎯 Modelo de seguridad

| Capa | Mecanismo | Implementación |
|------|-----------|----------------|
| **Contraseñas** | bcrypt (10 rondas) | `bcryptjs` en `routes/auth.js` |
| **Sesión** | JWT firmado con HS256 | `jsonwebtoken` + `JWT_SECRET` |
| **Expiración** | Configurable vía `.env` | `JWT_EXPIRES_IN` (ej: `15s`, `8h`, `1d`) |
| **Autenticación** | Middleware en cada ruta protegida | `middlewares/authMiddleware.js` |
| **Autorización** | Middleware de roles por operación | `middlewares/roleMiddleware.js` |
| **Registro público** | Restringido a `client` | `routes/auth.js` ignora el campo `role` |
| **Auditoría** | Registro de todas las acciones | `services/logger.js` → `activity.log` |

### 🔄 Flujo completo de autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario envía credenciales: POST /api/auth/login         │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Servidor valida con bcrypt.compareSync()                 │
│    - Si es incorrecto → 401 + log "FALLIDO"                 │
│    - Si es correcto → continúa                              │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Servidor firma un JWT con:                               │
│    { id, email, role, name } + expiración JWT_EXPIRES_IN    │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend guarda el token en localStorage                 │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Cada petición envía:                                     │
│    Authorization: Bearer <token>                            │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. authMiddleware verifica el token                         │
│    - Inválido/expirado → 401                                │
│    - Válido → adjunta req.user y continúa                   │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. requireRole() valida permisos por operación              │
│    - Sin permisos → 403                                     │
│    - Con permisos → ejecuta el handler                      │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend programa un timer de expiración                 │
│    - Al expirar: alert + limpieza + recarga automática      │
└─────────────────────────────────────────────────────────────┘
```

### 🛡️ Middlewares de seguridad

#### `authMiddleware.js` — Verificación de JWT

```javascript
async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Token de autenticación requerido.'
        });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await dbGet(
            'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
            [payload.id]
        );
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
        }
        return res.status(401).json({ error: 'Token inválido.' });
    }
}
```

#### `roleMiddleware.js` — Autorización por rol

```javascript
function requireRole(...rolesPermitidos) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado.' });
        }
        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción.',
                required: rolesPermitidos,
                current: req.user.role
            });
        }
        next();
    };
}
```

### 🔒 Registro público restringido

Por seguridad, el endpoint público `POST /api/auth/register` **solo crea usuarios con rol `client`**. Cualquier intento de enviar `role: "admin"` o `role: "coach"` es ignorado silenciosamente.

```javascript
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const role = 'client';  // ✅ Forzado
    // ... el resto del registro
});
```

Los roles elevados **solo pueden asignarse** desde el panel del administrador:

```javascript
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
    const { name, email, password, role } = req.body;
    // Admin puede asignar cualquier rol
});
```

### ⏱️ Expiración automática de sesión

El frontend **decodifica el payload del JWT** para conocer su fecha exacta de expiración y programa un temporizador (`setTimeout`) que:

1. Detecta automáticamente cuándo el token deja de ser válido.
2. Muestra un alert: *"Tu sesión ha expirado por inactividad"*.
3. Limpia el token y el estado del usuario.
4. **Recarga automáticamente la página** para volver al login.

Esto se complementa con la validación del backend en cada petición, creando una **doble capa de seguridad**:

| Capa | Cuándo actúa | Archivo |
|------|--------------|---------|
| **Proactiva (cliente)** | Al cumplirse el tiempo de expiración | `public/js/app.js` |
| **Reactiva (servidor)** | Al recibir cualquier petición con token expirado | `middlewares/authMiddleware.js` |

### 📝 Variables de entorno requeridas

```bash
# Secreto para firmar los JWT (obligatorio)
# Genera uno con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# El servidor NO arrancará mientras este vacío.
JWT_SECRET=

# Tiempo de expiración (acepta s, m, h, d)
JWT_EXPIRES_IN=8h
```

---

## 📡 API REST

### 📖 Nomenclatura

- 🔓 **Público**: no requiere autenticación
- 🔒 **Autenticado**: requiere header `Authorization: Bearer <token>`
- 🔒 **Rol específico**: requiere token + rol adecuado
- Todas las respuestas son **JSON**
- Los errores siguen el formato: `{ "error": "Descripción del problema" }`

---

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `POST` | `/auth/register` | 🔓 Público | Registrar usuario (solo crea `client`) |
| `POST` | `/auth/login` | 🔓 Público | Iniciar sesión, devuelve JWT |
| `POST` | `/auth/logout` | 🔒 Autenticado | Registrar cierre de sesión |
| `GET` | `/auth/me` | 🔒 Autenticado | Devolver el usuario del token actual |

#### Ejemplo: Iniciar sesión

```json
{
  "email": "cliente@gym.com",
  "password": "123456"
}
```

**Respuesta (200):**
```json
{
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06",
    "name": "Juan Pérez",
    "email": "cliente@gym.com",
    "role": "client",
    "avatar": null
  }
}
```

#### Ejemplo: Registro público

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "mi_contraseña_segura"
}
```

> ⚠️ Aunque envíes un campo `role`, será ignorado. Siempre se crea como `client`.

**Respuesta (201):**
```json
{
  "message": "Usuario registrado exitosamente.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client",
    "avatar": null
  }
}
```

---

### 👥 Usuarios (`/api/users`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/users` | 🔒 Autenticado | Admin: todos · Coach: clientes · Cliente: él mismo |
| `GET` | `/users/:id` | 🔒 Autenticado | Con control de acceso por rol |
| `POST` | `/users` | 🔒 **Solo admin** | Crear usuario con cualquier rol |
| `PUT` | `/users/:id` | 🔒 Autenticado | Admin: cualquiera · Cliente: él mismo (sin cambiar rol) |
| `PUT` | `/users/:id/avatar` | 🔒 Autenticado | Solo el propio usuario o admin |
| `DELETE` | `/users/:id` | 🔒 **Solo admin** | Eliminar usuario |

#### Ejemplo: Crear usuario (como admin)

```json
{
  "name": "María López",
  "email": "maria@gym.com",
  "password": "123456",
  "role": "coach"
}
```

**Respuesta (201):**
```json
{
  "id": "6deeabac-85ae-4055-8cff-ba285f07ecb8",
  "name": "María López",
  "email": "maria@gym.com",
  "role": "coach",
  "avatar": null
}
```

> ❌ **Si un coach o cliente intenta crear usuarios**, el servidor responde:
> ```json
> {
>   "error": "No tienes permisos para realizar esta acción.",
>   "required": ["admin"],
>   "current": "coach"
> }
> ```

---

### 🏋️ Ejercicios (`/api/exercises`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/exercises` | 🔒 Autenticado | Listar catálogo |
| `GET` | `/exercises/:id` | 🔒 Autenticado | Obtener un ejercicio |
| `POST` | `/exercises` | 🔒 **Solo admin** | Agregar ejercicio al catálogo |

#### Ejemplo: Crear ejercicio

```json
{
  "id": "ej-1700000000",
  "name": "Sentadilla con Barra",
  "muscleGroup": "Piernas / Glúteos",
  "type": "reps",
  "description": "Baja flexionando rodillas a 90 grados manteniendo la espalda recta.",
  "mediaUrl": "https://ejemplo.com/sentadilla.jpg",
  "defaultRestSec": 60
}
```

> 💡 El campo `type` puede ser `"reps"` o `"time"`.

---

### 📋 Rutinas (`/api/routines`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/routines` | 🔒 Autenticado | Admin: todas · Coach: las suyas · Cliente: la asignada |
| `GET` | `/routines/:id` | 🔒 Autenticado | Con control de acceso por rol |
| `POST` | `/routines` | 🔒 **Admin, Coach** | Crear/actualizar rutina |
| `PUT` | `/routines/:id/assign` | 🔒 **Admin, Coach** | Asignar rutina a un cliente |
| `DELETE` | `/routines/:id` | 🔒 **Admin, Coach** | Eliminar (solo las propias si es coach) |

#### Ejemplo: Crear rutina (como coach)

```json
{
  "name": "Fuerza Piernas",
  "assignedToClientId": null,
  "dias": "Lunes, Jueves",
  "description": "Rutina de hipertrofia para tren inferior",
  "ejercicios": [
    {
      "ejercicioId": "ej-1",
      "nombre": "Sentadilla con Barra",
      "muscleGroup": "Piernas",
      "tipo": "reps",
      "series": 4,
      "reps": 8,
      "peso_sugerido": 60,
      "descanso_seg": 90,
      "tiempo_objetivo_seg": 0,
      "mediaUrl": "https://..."
    }
  ]
}
```

> 🔒 Aunque envíes `coachId` o `coachName`, el backend los reemplaza por los del usuario autenticado. **Un coach no puede crear rutinas a nombre de otro.**

---

### 🏆 Sesiones (`/api/sessions`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/sessions` | 🔒 Autenticado | Admin: todas · Cliente: solo las suyas |
| `GET` | `/sessions/client/:clientId` | 🔒 Autenticado | Admin/Coach: cualquiera · Cliente: solo el suyo |
| `POST` | `/sessions` | 🔒 **Solo client** | Guardar sesión completada |

#### Ejemplo: Guardar sesión

```json
{
  "rutinaId": "rutina-1700000000",
  "rutinaNombre": "Fuerza Piernas",
  "fechaInicio": "2026-10-04T15:00:00.000Z",
  "fechaFin": "2026-10-04T15:45:00.000Z",
  "duracionTotalSeg": 2700,
  "duracionEfectivaSeg": 2100,
  "completada": true,
  "detalles": [
    {
      "ejercicioId": "ej-1",
      "ejercicioNombre": "Sentadilla con Barra",
      "serieNum": 1,
      "tiempoEjercicioSeg": 45,
      "pesoReal": 60,
      "completada": true,
      "saltada": false
    }
  ]
}
```

> 🔒 Aunque envíes un `clienteId`, el backend lo **ignora** y usa el `id` del usuario autenticado.

---

### 🤖 Asistente IA (`/api/ai`)

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `POST` | `/ai/chat` | 🔒 **Solo client** | Enviar mensaje al asistente |
| `GET` | `/ai/history/:userId` | 🔒 Autenticado | Solo el propio historial |
| `DELETE` | `/ai/history/:userId` | 🔒 Autenticado | Solo el propio historial |

#### Ejemplo: Enviar mensaje

```json
{
  "message": "¿Qué ejercicios tengo hoy?"
}
```

> 🔒 El `userId` se toma del JWT, no del body.

**Respuesta (200):**
```json
{
  "reply": "¡Hola Juan! Hoy es viernes, 4 de octubre de 2026. Tu rutina \"Fuerza Piernas\" está programada para Lunes y Jueves..."
}
```

---

### 📊 Códigos de estado HTTP

| Código | Significado | Cuándo aparece |
|:------:|-------------|----------------|
| `200` | OK | Petición exitosa |
| `201` | Created | Recurso creado exitosamente |
| `304` | Not Modified | Recurso sin cambios (caché) |
| `400` | Bad Request | Faltan campos o datos inválidos |
| `401` | Unauthorized | Token ausente, inválido o expirado |
| `403` | Forbidden | Rol sin permisos |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Email duplicado |
| `500` | Server Error | Error interno del servidor |

---

### 🎭 Matriz de permisos por rol

| Recurso / Operación | 👑 Admin | 💪 Coach | 🏃 Cliente |
|---------------------|:--------:|:--------:|:----------:|
| Login / Registro | ✅ | ✅ | ✅ |
| Ver `/users` | ✅ todos | ✅ clientes | ✅ él mismo |
| Crear usuario | ✅ | ❌ | ❌ |
| Editar usuario | ✅ cualquiera | ❌ | ✅ él mismo |
| Eliminar usuario | ✅ | ❌ | ❌ |
| Ver `/exercises` | ✅ | ✅ | ✅ |
| Crear ejercicio | ✅ | ❌ | ❌ |
| Ver `/routines` | ✅ todas | ✅ las suyas | ✅ la asignada |
| Crear/editar rutina | ✅ | ✅ las suyas | ❌ |
| Asignar rutina | ✅ | ✅ las suyas | ❌ |
| Ver `/sessions` | ✅ todas | ✅ por cliente | ✅ las suyas |
| Guardar sesión | ❌ | ❌ | ✅ |
| Chat IA | ❌ | ❌ | ✅ |
| Ver métricas globales | ✅ | ❌ | ❌ |

---

### 📈 Auditoría

El sistema registra **todas las peticiones** en el archivo `activity.log`:

```
FECHA Y HORA | USUARIO | ACTIVIDAD | DETALLE
2026-10-04 15:00:12 | cliente@gym.com | CONSULTA | GET /api/routines → 200
2026-10-04 15:00:45 | cliente@gym.com | REGISTRO | Sesión completada: "Fuerza Piernas"
2026-10-04 15:05:30 | coach@gym.com   | REGISTRO | Rutina "Full Body" asignada a "Juan Pérez"
```

| Actividad | Descripción |
|-----------|-------------|
| `LOGIN` | Inicio de sesión (exitoso o fallido) |
| `LOGOUT` | Cierre de sesión |
| `CONSULTA` | Cada petición GET exitosa |
| `REGISTRO` | Cada creación o edición (POST, PUT) |
| `ELIMINACION` | Cada borrado (DELETE) |

---

### `.gitignore`

```
.env
node_modules/
gympro.db
activity.log
```

---

## 🚀 Roadmap de seguridad

- [x] Autenticación con **JWT** firmado
- [x] Middleware de verificación de token (`authMiddleware`)
- [x] Middleware de autorización por rol (`requireRole`)
- [x] Registro público restringido a `client`
- [x] Expiración automática de sesión (cliente + servidor)
- [x] Contraseñas con bcrypt
- [x] API key aislada en `.env`
- [x] `.env` excluido del repositorio
- [x] Auditoría de actividades en `activity.log`
- [ ] *(Futuro)* Refresh tokens
- [ ] *(Futuro)* Rate limiting con `express-rate-limit`
- [ ] *(Futuro)* Helmet.js para cabeceras HTTP seguras
