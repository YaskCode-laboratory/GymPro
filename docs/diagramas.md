# Diagramas UML
## Diagrama de clases
```mermaid
classDiagram
    direction TB

    %% ============================================
    %% JERARQUÍA DE USUARIOS
    %% ============================================
    class User {
        <<abstract>>
        +String id
        +String name
        +String email
        +String password
        +String role
        +String avatar
        +Date createdAt
        +getInfo()
    }

    class Client {
        +String rutinaAsignada
        +Array historialProgreso
        +registrarProgreso(ejercicioId, pesoUsado, seriesCompletadas)
    }

    class Coach {
        +crearRutinaPersonalizada(name, objetivo)
        +asignarRutinaACliente(cliente, rutina)
    }

    class Administrator {
        +crearEjercicioGlobal(bancoEjercicios, name, grupoMuscular)
    }

    User <|-- Client
    User <|-- Coach
    User <|-- Administrator

    %% ============================================
    %% CATÁLOGO
    %% ============================================
    class Ejercicio {
        +String id
        +String name
        +String muscleGroup
        +String type
        +String description
        +String mediaUrl
        +Number defaultRestSec
    }

    %% ============================================
    %% RUTINAS
    %% ============================================
    class Rutina {
        +String id
        +String name
        +String coachId
        +String coachName
        +String assignedToClientId
        +String dias
        +String description
        +Array ejercicios
        +agregarEjercicio(ejercicioConfig)
    }

    class RoutineExercise {
        <<configuration>>
        +String ejercicioId
        +String nombre
        +String muscleGroup
        +String tipo
        +Number series
        +Number reps
        +Number peso_sugerido
        +Number descanso_seg
        +Number tiempo_objetivo_seg
        +String mediaUrl
    }

    Rutina "1" *-- "*" RoutineExercise : contiene
    RoutineExercise "*" --> "1" Ejercicio : referencia

    %% ============================================
    %% SESIONES DE ENTRENAMIENTO
    %% ============================================
    class SesionEntrenamiento {
        +String id
        +String clienteId
        +String rutinaId
        +String rutinaNombre
        +Date fechaInicio
        +Date fechaFin
        +Number duracionTotalSeg
        +Number duracionEfectivaSeg
        +Boolean completada
        +Array detalles
        +agregarDetalle(detalle)
        +finalizar(duracionTotalSeg)
    }

    class SessionDetail {
        <<record>>
        +String ejercicioId
        +String ejercicioNombre
        +Number serieNum
        +Number tiempoEjercicioSeg
        +Number pesoReal
        +Boolean completada
        +Boolean saltada
    }

    SesionEntrenamiento "1" *-- "*" SessionDetail : registra

    %% ============================================
    %% CHAT CON IA
    %% ============================================
    class ChatMessage {
        +Integer id
        +String userId
        +String role
        +String content
        +Date createdAt
    }

    %% ============================================
    %% SERVICIOS DEL BACKEND (no son clases JS puras, pero son componentes lógicos)
    %% ============================================
    class AIService {
        <<service>>
        -GoogleGenAI client
        -String model
        -Number maxTokens
        -Number temperature
        +getAIResponse(systemPrompt, history, userMessage)
    }

    class ContextBuilder {
        <<service>>
        +buildClientContext(user)
        +buildCoachContext(user)
        +getTodayName()
        +routineIncludesToday(rutina)
    }

    class Prompts {
        <<service>>
        +buildClientSystemPrompt(user, ctx)
        +buildCoachSystemPrompt(user, ctx)
    }

    class Logger {
        <<service>>
        -String LOG_FILE
        +logActivity(userEmail, activity, detail)
        +formatDate(date)
        +sanitize(text)
    }

    class AuditMiddleware {
        <<middleware>>
        +auditMiddleware(req, res, next)
    }

    %% ============================================
    %% RELACIONES ENTRE CLASES DEL DOMINIO
    %% ============================================
    Coach "1" --> "*" Rutina : crea
    Client "1" --> "0..1" Rutina : tiene asignada
    Client "1" --> "*" SesionEntrenamiento : realiza
    Rutina "1" --> "*" SesionEntrenamiento : origina
    User "1" --> "*" ChatMessage : conversa

    %% ============================================
    %% RELACIONES CON SERVICIOS
    %% ============================================
    AIService ..> Prompts : usa
    AIService ..> ContextBuilder : usa
    AIService ..> ChatMessage : persiste
    AuditMiddleware ..> Logger : usa
    ContextBuilder ..> Rutina : consulta
    ContextBuilder ..> SesionEntrenamiento : consulta
```

## Diagrama de Casos de Uso
[![Diagrama de casos de uso](/diagramas/casodeUsoUml.drawio.png)](/diagramas/casodeUsoUml.drawio.png)
