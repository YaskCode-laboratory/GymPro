# Arquitectura del sistema
Esto se llama arquitectura cliente-servidor y es la base de casi todas las aplicaciones web modernas.

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vista (HTML + CSS)  ─  Controlador (JS vanilla)     │  │
│  │         ↓                    ↓                       │  │
│  │         └──────► api.js (fetch) ──────┐              │  │
│  └────────────────────────────────────────┼─────────────┘  │
└───────────────────────────────────────────┼────────────────┘
                                            │ HTTP / JSON
                                            ▼
┌────────────────────────────────────────────────────────────┐
│              SERVIDOR (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Middleware (CORS, JSON, Audit, Auth)               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Rutas REST                                         │  │
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

El proyecto expone una **API REST** construida apartir de Express que sirve al frontend. Todos los endpoints usan **JSON** como formato de intercambio de datos.

> 📍 **URL Base**: `http://localhost:3000/api`

> 🌐 **En producción**: `https://gympro-24ly.onrender.com/api`

### 📖 Nomenclatura

- 🔓 **Público**: no requiere autenticación
- 🔒 **Privado**: requiere sesión activa (actualmente se pasa el email del usuario en el header `X-User-Email`)
- Todas las respuestas son **JSON**
- Los errores siguen el formato: `{ "error": "Descripción del problema" }`

---

### 🔐 Autenticación (`/api/auth`)

Endpoints para registro, inicio y cierre de sesión.

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `POST` | `/auth/register` | 🔓 Público | Registrar un nuevo usuario con rol |
| `POST` | `/auth/login` | 🔓 Público | Iniciar sesión con email y contraseña |
| `POST` | `/auth/logout` | 🔓 Público | Registrar el cierre de sesión en el log |

#### Ejemplo: Registrar usuario

```json
{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "mi_contraseña_segura",
    "role": "client"
  }
```

**Respuesta exitosa (201)**:
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

#### Ejemplo: Iniciar sesión

```json
{
    "email": "cliente@gym.com",
    "password": "123456"
  }
```

**Respuesta exitosa (200)**:
```json
{
  "message": "Login exitoso.",
  "user": {
    "id": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06",
    "name": "Juan Pérez",
    "email": "cliente@gym.com",
    "role": "client",
    "avatar": null
  }
}
```

---

### 👥 Usuarios (`/api/users`)

Gestión completa de usuarios del sistema (mayormente para el administrador).

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/users` | 🔒 Privado | Listar todos los usuarios (opcional `?role=client`) |
| `GET` | `/users/:id` | 🔒 Privado | Obtener un usuario específico por su ID |
| `POST` | `/users` | 🔒 Admin | Crear un usuario |
| `PUT` | `/users/:id` | 🔒 Admin | Actualizar los datos de un usuario |
| `PUT` | `/users/:id/avatar` | 🔒 Privado | Actualizar solo la foto de perfil |
| `DELETE` | `/users/:id` | 🔒 Admin | Eliminar un usuario |

#### Ejemplo: Listar solo clientes

```bash
  http://localhost:3000/api/users?role=client
```

**Respuesta (200)**:
```json
[
  {
    "id": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06",
    "name": "Juan Pérez",
    "email": "cliente@gym.com",
    "role": "client",
    "avatar": "data:image/jpeg;base64,/9j/4AAQ..."
  },
  {
    "id": "4ca2c198-9a48-4e21-bf50-7155d55bd6c4",
    "name": "Ana",
    "email": "ana@gmail.com",
    "role": "client",
    "avatar": null
  }
]
```

---

### 🏋️ Ejercicios (`/api/exercises`)

Catálogo global de ejercicios disponibles para armar rutinas.

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/exercises` | 🔒 Privado | Listar todos los ejercicios del catálogo |
| `GET` | `/exercises/:id` | 🔒 Privado | Obtener un ejercicio específico |
| `POST` | `/exercises` | 🔒 Admin | Agregar un nuevo ejercicio al catálogo |

#### Ejemplo: Crear ejercicio

```bash
POST http://localhost:3000/api/exercises \
  {
    "id": "ej-1700000000",
    "name": "Sentadilla con Barra",
    "muscleGroup": "Piernas / Glúteos",
    "type": "reps",
    "description": "Baja flexionando rodillas a 90 grados manteniendo la espalda recta.",
    "mediaUrl": "https://ejemplo.com/sentadilla.jpg",
    "defaultRestSec": 60
  }'
```

**Respuesta (201)**:
```json
{
  "id": "ej-1700000000",
  "name": "Sentadilla con Barra",
  "muscleGroup": "Piernas / Glúteos",
  "type": "reps",
  "description": "Baja flexionando rodillas a 90 grados...",
  "mediaUrl": "https://ejemplo.com/sentadilla.jpg",
  "defaultRestSec": 60
}
```

> 💡 El campo `type` puede ser `"reps"` (por repeticiones) o `"time"` (por tiempo, tipo plancha).

---

### 📋 Rutinas (`/api/routines`)

Creación, edición y asignación de rutinas de entrenamiento.

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/routines` | 🔒 Privado | Listar rutinas (opcional `?coachId=...` o `?clientId=...`) |
| `GET` | `/routines/:id` | 🔒 Privado | Obtener una rutina con sus ejercicios configurados |
| `POST` | `/routines` | 🔒 Coach/Admin | Crear o actualizar una rutina completa |
| `PUT` | `/routines/:id/assign` | 🔒 Coach/Admin | Asignar una rutina a un cliente específico |
| `DELETE` | `/routines/:id` | 🔒 Coach/Admin | Eliminar una rutina |

#### Ejemplo: Crear una rutina

```bash
POST http://localhost:3000/api/routines \
  -H "Content-Type: application/json" \
  -H "X-User-Email: coach@gym.com" \
  -d '{
    "name": "Fuerza Piernas",
    "coachId": "coach-1",
    "coachName": "Carlos Méndez",
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
        "mediaUrl": "https://ejemplo.com/sentadilla.jpg"
      }
    ]
  }'
```

**Respuesta (201)**:
```json
{
  "id": "rutina-1700000000",
  "name": "Fuerza Piernas",
  "coachId": "coach-1",
  "coachName": "Carlos Méndez",
  "assignedToClientId": null,
  "dias": "Lunes, Jueves",
  "description": "Rutina de hipertrofia para tren inferior",
  "ejercicios": [ /* ... */ ]
}
```

#### Ejemplo: Asignar rutina a un cliente

```bash
PUT http://localhost:3000/api/routines/rutina-1700000000/assign \
  -H "Content-Type: application/json" \
  -H "X-User-Email: coach@gym.com" \
  -d '{
    "clientId": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06"
  }'
```

**Respuesta (200)**:
```json
{
  "message": "Rutina asignada correctamente."
}
```

---

### 🏆 Sesiones (`/api/sessions`)

Guardado y consulta del historial de entrenamientos ejecutados.

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `GET` | `/sessions` | 🔒 Privado | Listar todas las sesiones (opcional `?clientId=...`) |
| `GET` | `/sessions/client/:clientId` | 🔒 Privado | Historial completo de un cliente específico |
| `POST` | `/sessions` | 🔒 Cliente | Guardar una sesión de entrenamiento completa |

#### Ejemplo: Guardar una sesión

```bash
POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -H "X-User-Email: cliente@gym.com" \
  -d '{
    "id": "sesion-1700000000",
    "clienteId": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06",
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
  }'
```

**Respuesta (201)**:
```json
{
  "message": "Sesión guardada.",
  "id": "sesion-1700000000"
}
```

#### Ejemplo: Consultar historial de un cliente

```bash
http://localhost:3000/api/sessions/client/924dd10d-1cd3-4f9d-8429-c2e8d7504a06 \
  -H "X-User-Email: coach@gym.com"
```

**Respuesta (200)** — array de sesiones con sus detalles:
```json
[
  {
    "id": "sesion-1700000000",
    "clienteId": "924dd10d-...",
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
]
```

---

### 🤖 Asistente IA (`/api/ai`)

Endpoints para interactuar con el chat de Inteligencia Artificial (GymBot / CoachIA).

| Método | Endpoint | Acceso | Descripción |
|--------|----------|:------:|-------------|
| `POST` | `/ai/chat` | 🔒 Cliente | Enviar un mensaje al asistente IA |
| `GET` | `/ai/history/:userId` | 🔒 Privado | Obtener el historial de conversación |
| `DELETE` | `/ai/history/:userId` | 🔒 Privado | Borrar el historial de conversación |

#### Ejemplo: Enviar mensaje a la IA

```bash
POST http://localhost:3000/api/ai/chat \
  "Content-Type: application/json" \
  '{
    "userId": "924dd10d-1cd3-4f9d-8429-c2e8d7504a06",
    "message": "¿Qué ejercicios tengo hoy?"
  }'
```

**Respuesta (200)**:
```json
{
  "reply": "¡Hola Juan! Hoy es viernes, 4 de octubre de 2026. Tu rutina \"Fuerza Piernas\" está programada para Lunes y Jueves, así que **hoy no te toca entrenar piernas**. Aprovecha para descansar, hidratarte bien y estirar. Mañana tampoco toca, pero el próximo lunes vuelves con todo. 💪"
}
```

#### Ejemplo: Obtener historial de chat

```bash
http://localhost:3000/api/ai/history/924dd10d-1cd3-4f9d-8429-c2e8d7504a06 \
  "X-User-Email: cliente@gym.com"
```

**Respuesta (200)**:
```json
[
  {
    "role": "user",
    "content": "¿Qué ejercicios tengo hoy?",
    "created_at": "2026-10-04 15:00:12"
  },
  {
    "role": "assistant",
    "content": "¡Hola Juan! Hoy es viernes...",
    "created_at": "2026-10-04 15:00:15"
  }
]
```

---

### 📊 Códigos de estado HTTP

| Código | Significado | Cuándo aparece |
|:------:|-------------|----------------|
| `200` | OK | Petición exitosa (GET, PUT) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `304` | Not Modified | Recurso sin cambios (caché del navegador) |
| `400` | Bad Request | Faltan campos obligatorios |
| `401` | Unauthorized | Credenciales inválidas o sesión no activa |
| `403` | Forbidden | Rol sin permisos para esa acción |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Email ya registrado o duplicado |
| `500` | Server Error | Error interno del servidor |

---

### 🔒 Sobre la autenticación

Actualmente el sistema usa una **autenticación simplificada** donde el email del usuario se envía en el header `X-User-Email`. Esto es suficiente para un proyecto académico, pero en producción se recomienda migrar a **JWT (JSON Web Tokens)** con expiración y refresh tokens.

### 📈 Estadísticas de uso de la API

El sistema registra **todas las peticiones** en el archivo `activity.log` con este formato:

```
FECHA Y HORA | USUARIO | ACTIVIDAD | DETALLE
2026-10-04 15:00:12 | cliente@gym.com | CONSULTA | GET /api/routines → 200
2026-10-04 15:00:45 | cliente@gym.com | REGISTRO | Sesión completada: "Fuerza Piernas"
2026-10-04 15:05:30 | coach@gym.com   | REGISTRO | Rutina "Full Body" asignada a "Juan Pérez"
```

Las actividades registradas son:

| Actividad | Descripción |
|-----------|-------------|
| `LOGIN` | Inicio de sesión (exitoso o fallido) |
| `LOGOUT` | Cierre de sesión |
| `CONSULTA` | Cada petición GET exitosa |
| `REGISTRO` | Cada creación o edición (POST, PUT) |
| `ELIMINACION` | Cada borrado (DELETE) |
