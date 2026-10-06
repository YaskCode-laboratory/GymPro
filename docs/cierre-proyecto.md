<h1>Cierre del Proyecto</h1>

**GymPro** nació como respuesta a la necesidad de digitalizar la gestión de
rutinas de entrenamiento en gimnasios y para entrenadores personales. El
proyecto buscó crear una alternativa accesible, gratuita y con soporte de IA
contextualizada frente a soluciones comerciales como **Hevy**, **Strong**,
**Gym WP** o **Ejercicios en Casa: Sin equipo**.

Después de **18 semanas de trabajo** distribuidas en análisis, diseño,
desarrollo, pruebas y despliegue, se obtuvo un sistema web completo con:

- 🎭 **3 roles diferenciados** (Administrador, Entrenador, Cliente)
- 🤖 **Asistente de IA** integrado con Google Gemini
- 📊 **Seguimiento completo** del progreso físico
- 📝 **Auditoría total** de actividades en archivo plano
- 🎨 **Interfaz moderna** con tema oscuro deportivo
- 🌐 **Desplegado en producción**: [gympro-24ly.onrender.com](https://gympro-24ly.onrender.com/)

---

## ✅ Objetivos Alcanzados

### 🎯 Objetivo general

> Desarrollar un sistema web que automatice la creación, asignación, ejecución
> y seguimiento de rutinas de entrenamiento en gimnasios.

**Estado: ✅ Completado al 100%**

### 🎯 Objetivos específicos

| # | Objetivo | Estado | Evidencia |
|---|----------|:------:|-----------|
| 1 | Implementar autenticación por roles con contraseñas cifradas | ✅ | bcrypt + 3 roles funcionales |
| 2 | Permitir a instructores crear y asignar rutinas personalizadas | ✅ | Constructor visual + asignación |
| 3 | Guiar al cliente durante la ejecución con cronómetros y objetivos | ✅ | Reproductor con cronómetros |
| 4 | Registrar el historial de sesiones con métricas de progreso | ✅ | Tabla `sessions` + `session_details` |
| 5 | Integrar un asistente de IA consciente del contexto del usuario | ✅ | GymBot con Gemini 2.5 Flash |
| 6 | Garantizar trazabilidad total mediante un sistema de auditoría | ✅ | `activity.log` con 5 actividades |

**Todos los objetivos específicos fueron cumplidos satisfactoriamente.**

---

## 📊 Resultados Obtenidos

### 📈 Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| 📅 **Duración total** | 18 semanas |
| 📁 **Archivos creados** | 35+ |
| 📝 **Líneas de código** | ~8,000 |
| 🗄️ **Tablas en BD** | 7 |
| 🔌 **Endpoints REST** | 25+ |
| 🤖 **Modelos IA integrados** | 1 (Gemini 2.5 Flash) |
| 🧪 **Casos de prueba** | 34 (100% aprobados) |
| 🐛 **Bugs corregidos** | 8 |
| 📚 **Diagramas UML** | 2 |

### 🎨 Entregables finales

| # | Entregable | Formato | Estado |
|---|-----------|---------|:------:|
| 1 | Código fuente completo | Repositorio GitHub | ✅ |
| 2 | Base de datos con esquema y seed | SQLite + SQL | ✅ |
| 3 | Documentación técnica | Markdown | ✅ |
| 4 | Diagramas UML | Mermaid + PlantUML | ✅ |
| 5 | Manual de instalación | README.md | ✅ |
| 6 | Informe de pruebas | README (sección) | ✅ |
| 7 | Despliegue en producción | Render | ✅ |
| 8 | Presentación para defensa | Slides | ✅ |

### 🏆 Logros destacados

- 🥇 **Sistema desplegado en producción** y accesible públicamente
- 🥇 **100% de los casos de prueba aprobados**
- 🥇 **Asistente de IA funcional** con contexto real de la BD
- 🥇 **Auditoría completa** sin ruido de sincronización
- 🥇 **Código modular** y documentado
- 🥇 **Arquitectura escalable** (preparada para migrar a PostgreSQL)

---

## 💡 Conclusiones

### 1. 🎯 Sobre el cumplimiento de objetivos

Se desarrolló **GymPro**, un sistema web funcional que automatiza la gestión
de rutinas y el entrenamiento guiado, sustituyendo los métodos manuales por
una plataforma unificada de tres roles. Todos los objetivos planteados al
inicio del proyecto fueron alcanzados.

### 2. 🏗️ Sobre la arquitectura elegida

La combinación de **Node.js + Express + SQLite** demostró ser suficiente para
un proyecto de complejidad media. La arquitectura **cliente-servidor con
separación MVC** permitió:

- Mantener el código organizado y fácil de mantener
- Escalar horizontalmente si el proyecto crece

### 3. 🤖 Sobre la integración con IA

La incorporación de **Google Gemini** aportó un **valor diferencial** frente a
las alternativas comerciales: el asistente **conoce la fecha actual, la rutina
del usuario y su progreso**, brindando respuestas contextualizadas y no
genéricas. Esto se logró mediante la **inyección dinámica de contexto** en el
prompt del sistema.

### 4. 📝 Sobre el sistema de auditoría

La implementación de un **log en archivo plano** (`activity.log`) con formato
`FECHA | USUARIO | ACTIVIDAD | DETALLE` cumple con requisitos de trazabilidad
típicos de contextos institucionales. El middleware transversal que captura
automáticamente las peticiones HTTP demuestra **madurez técnica** y
pensamiento orientado a producción.

### 5. 🔄 Sobre la metodología aplicada

El **modelo incremental con enfoque ágil** permitió:

- Entregas tempranas y funcionales en cada iteración
- Retroalimentación continua del equipo
- Detección y corrección temprana de bugs
- Reducción del riesgo de "todo o nada" al final del proyecto

### 6. 🎨 Sobre la experiencia de usuario

El **tema oscuro deportivo** inspirado en Hevy, Strong y Nike Training,
combinado con **cronómetros gigantes**, **chips de días** y **modales
informativos**, logró una interfaz moderna, intuitiva y adecuada para el
contexto de uso: **un gimnasio, en movimiento, con iluminación variable**.

### 7. 🔒 Sobre la seguridad implementada

Tras la revisión de transferencia, se implementó un **sistema de seguridad completo** con JWT, middleware de autenticación y autorización por roles. Esto elevó el proyecto de un prototipo académico a una aplicación con estándares de producción:

- **Autenticación real**: token firmado con expiración configurable.
- **Autorización granular**: cada operación valida el rol del usuario.
- **Registro público restringido**: los usuarios no pueden auto-asignarse roles elevados.
- **Expiración automática**: la sesión se cierra de forma transparente y segura.
- **Gestión de secretos**: `.env` fuera del repositorio, `.env.example` como plantilla.

Este cambio demostró que **la seguridad no es un extra, sino un requisito fundamental** desde las primeras etapas del diseño.

---

## 🎓 Aprendizajes Clave

### 👨‍💻 Técnicos

| Área | Aprendizaje |
|------|-------------|
| **Backend** | Uso profesional de Express, middleware, REST y separación de rutas |
| **Base de datos** | Diseño de esquemas relacionales con FK, CASCADE y SET NULL |
| **IA generativa** | Integración de Gemini con contexto dinámico y prompts por rol |
| **Seguridad** | Hash de contraseñas con bcrypt, gestión de API keys con `.env` |
| **Frontend** | Fetch API, async/await, manipulación del DOM sin frameworks |
| **Seguridad** | Implementación de JWT, middleware de autenticación y autorización por roles (RBAC) |
| **Variables de entorno** | Gestión de secretos con `.env`, `.env.example` y `.gitignore` |
| **Expiración de sesión** | Decodificación de JWT en cliente + temporizador + recarga automática |
| **Auditoría** | Implementación de logging con `fs.appendFile` y middleware transversal |

### 🧠 Metodológicos

- **Planificación por iteraciones**: cada feature entregada antes de empezar la siguiente
- **Priorización**: primero lo crítico (auth, rutas), luego lo deseable (chat IA)
- **Documentación continua**: el README y los diagramas UML se actualizaron junto al código

### 🤝 Blandos (Soft skills)

- **Autogestión** del tiempo en un proyecto de 18 semanas
- **Resolución de problemas** complejos (bugs de lógica temporal, caching, IA)
- **Comunicación técnica** al documentar el sistema para futuras defensas
- **Adaptabilidad** ante cambios de requisitos y alcance

---

## 🚀 Recomendaciones

### 📌 Para el equipo de desarrollo

1. **Migrar a PostgreSQL** si el sistema escala a más de 1,000 usuarios concurrentes.
2. **Automatizar pruebas** con Jest + Supertest + Playwright antes de la siguiente versión.
3. **Documentar la API con Swagger/OpenAPI** para facilitar integraciones futuras.

### 📌 Para el usuario final (gimnasios y entrenadores)

1. **Capacitar a los coaches** en el uso del constructor de rutinas.
2. **Configurar días de entrenamiento realistas** (2–5 días por semana).
3. **Aprovechar el resumen semanal** para detectar estancamientos tempranos.
4. **Motivar a los alumnos** a usar el chat con IA para consultas frecuentes.
5. **Revisar el `activity.log`** periódicamente para auditar el uso del sistema.

### 📌 Para futuros desarrolladores

1. **Leer primero la sección de Arquitectura** del README antes de modificar código.
2. **Respetar la separación de capas**: cada archivo tiene una única responsabilidad.
3. **Ejecutar el sistema en local** antes de proponer cambios significativos.
4. **Añadir tests** al crear nuevas funcionalidades.
5. **Mantener actualizado el `activity.log`** al añadir nuevas acciones.

---

## 🔮 Trabajo Futuro

### 🚧 Corto plazo (3 meses)

- [ ] **Endpoint y vista de auditoría** en el panel del administrador
- [ ] **Notificaciones toast** reemplazando los `alert()` nativos
- [ ] **Exportación de historial** a CSV/PDF por cliente
- [ ] **Recorte interactivo del avatar** (drag & zoom estilo Instagram)

### 🔄 Mediano plazo (6 meses)

- [ ] **Migración a PostgreSQL** para escalabilidad
- [ ] **Chat coach-alumno** dentro de la app (WebSockets)
- [ ] **Gráficos de progresión** de peso por ejercicio (SVG puro)
- [ ] **PWA** con soporte offline parcial

### 🚀 Largo plazo (12 meses)

- [ ] **Modo multi-sede** para cadenas de gimnasios
- [ ] **Integración con wearables** (Fitbit, Apple Watch, Garmin)
- [ ] **Generación automática de rutinas** con IA a partir de parámetros
- [ ] **Notificaciones push** con Service Workers
- [ ] **App móvil nativa** (React Native o Flutter)
- [ ] **Sistema de pagos** y membresías por suscripción
- [ ] **Integración con calendarios** (Google Calendar)

---

## 🙏 Agradecimientos

Este proyecto no habría sido posible sin el apoyo de:

- 🎓 **Universidad del Zulia** — Facultad Experimental de Ciencias
- 📚 **Profesora Yaskelly** — por compartir su experiencia y conocimiento, y por formarnos no solo como desarrolladores, sino como profesionales capaces de enfrentar proyectos reales. 
- 👥 **Compañeros de equipo** — Por el trabajo y la retroalimentación
- 🌐 **Comunidad open source** — Por las herramientas y librerías utilizadas
- 🤖 **Google AI Studio** — Por el acceso gratuito a Gemini 2.5 Flash
- 💻 **GitHub** — Por el hosting del código y la posibilidad de desplegar en Render

---

## 📚 Referencias

### 📖 Bibliografía

### 🌐 Documentación oficial

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Google Gemini API](https://ai.google.dev/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

### 🛠️ Librerías utilizadas

- [`express`](https://www.npmjs.com/package/express) — Framework HTTP
- [`sqlite`](https://www.npmjs.com/package/sqlite) — Cliente SQLite
- [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) — Hash de contraseñas
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) — SDK oficial de Gemini
- [`dotenv`](https://www.npmjs.com/package/dotenv) — Variables de entorno
- [`cors`](https://www.npmjs.com/package/cors) — Habilitar CORS
- [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken) — Generación y verificación de JWT

---

## 📞 Contacto

### 👨‍💻 Desarrolladores

**[Audio Andrés Silva Barrios]**
- 🎓 Universidad del Zulia — Licenciatura en Computación
- 📧 [audioasilvab.06@gmail.com](mailto:tu-email@example.com)
- 🐙 [@audioasilvab](https://github.com/audioasilvab)

**[Santiago José Verges Lizardo]**
- 🎓 Universidad del Zulia — Licenciatura en Computación
- 📧 [sthiagoverges@gmail.com](mailto:sthiagoverges@gmail.com)
- 🐙 [@Judgetstation](https://github.com/Judgetstation)

**[Angel Enrique Trejo Marcelo]**
- 🎓 Universidad del Zulia — Licenciatura en Computación
- 📧 [angeltrejomarcelo@gmail.com](mailto:angeltrejomarcelo@gmail.com)

### 🎓 Tutor académico

**[Yaskelly Yedra]**
- 📚 Profesora de Ingeniería de Software
- 🏫 Universidad del Zulia — Facultad Experimental de Ciencias
- 📧 [profesorayedra@gmail.com](mailto:profesorayedra@gmail.com)
- 🐙 [@yaskelly](https://github.com/yaskelly)

### 🌐 Enlaces del proyecto

| Recurso | Enlace |
|---------|--------|
| 🐙 **Repositorio GitHub** | [github.com/tu-usuario/gympro](https://github.com/audioasilvab/GymPro/) |
| 🌐 **Demo en producción** | [gympro-24ly.onrender.com](https://gympro-24ly.onrender.com/) |
| 📖 **Documentación** | [README.md](https://github.com/audioasilvab/GymPro/blob/main/README.md) |
| 🐛 **Reportar bugs** | [Issues](https://github.com/audioasilvab/GymPro/issues) |
| 💡 **Sugerencias** | [Discussions](https://github.com/audioasilvab/GymPro/discussions) |

---

## 🏁 Estado Final del Proyecto

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅  PROYECTO COMPLETADO AL 100%                         ║
║                                                           ║
║   🎯  Todos los objetivos cumplidos                       ║
║   🧪  34/34 casos de prueba aprobados                     ║
║   🐛  8/8 bugs corregidos                                 ║
║   🌐  Desplegado en producción                            ║
║   📚  Documentación completa                              ║
║                                                           ║
║   🎓  Listo para defensa                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

<div align="center">

### 🎉 ¡Gracias por llegar hasta aquí!

**GymPro** representa el esfuerzo, la dedicación y el aprendizaje de un
proyecto académico completo. Esperamos que este sistema sea útil para
gimnasios, entrenadores y personas que buscan mejorar su salud a través
del entrenamiento guiado.

**⭐ Si te gustó el proyecto, dale una estrella en GitHub ⭐**

---

**Universidad del Zulia — 2026**

</div>
