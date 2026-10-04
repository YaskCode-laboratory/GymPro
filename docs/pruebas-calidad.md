<h1>🧪 Pruebas y Calidad</h1>

## 🎯 Estrategia de Pruebas

GymPro aplica una estrategia de pruebas en **3 niveles**, adaptada a un proyecto académico con enfoque ágil:

| Nivel | Tipo | Herramienta | Frecuencia |
|-------|------|-------------|-----------|
| **1. Unitarias** | Funciones aisladas | Manual | Al programar |
| **2. Integrales** | Flujos end-to-end | Manual en navegador | Al cerrar una feature |
| **3. Regresión** | Casos críticos | Manual + checklist | Antes de cada release |

### 📋 Objetivos de calidad

- ✅ Cobertura funcional de los 3 roles (admin, coach, client)
- ✅ Validación de los flujos críticos del negocio
- ✅ Verificación de seguridad (bcrypt, XSS, inyección SQL)
- ✅ Comprobación de UX responsive (320px – 1920px)
- ✅ Trazabilidad completa mediante `activity.log`

---

## ✅ Pruebas Funcionales

Casos ejecutados manualmente sobre la aplicación en funcionamiento.

### 🔐 Autenticación

| ID | Caso | Resultado esperado | Estado |
|----|------|-------------------|:------:|
| PF-01 | Login con credenciales válidas | Redirige al dashboard según rol | ✅ |
| PF-02 | Login con contraseña incorrecta | Mensaje: "Contraseña incorrecta" | ✅ |
| PF-03 | Login con email no registrado | Mensaje: "El correo no está registrado" | ✅ |
| PF-04 | Registro con email duplicado | Mensaje: "Este correo ya está registrado" | ✅ |
| PF-05 | Registro exitoso de nuevo cliente | Usuario visible en panel admin | ✅ |
| PF-06 | Cierre de sesión | Vuelve al login + registro en log | ✅ |

### 👑 Panel de Administrador

| ID | Caso | Resultado esperado | Estado |
|----|------|-------------------|:------:|
| PF-07 | Crear usuario desde el modal | Aparece en la tabla con avatar | ✅ |
| PF-08 | Editar usuario existente | Datos actualizados en la tabla | ✅ |
| PF-09 | Eliminar usuario | Fila desaparece + log de auditoría | ✅ |
| PF-10 | Crear ejercicio en el catálogo | Aparece con grupo muscular y tipo | ✅ |
| PF-11 | Ver métricas globales | Contadores correctos (clientes, coaches, rutinas, sesiones) | ✅ |

### 💪 Panel de Instructor / Coach

| ID | Caso | Resultado esperado | Estado |
|----|------|-------------------|:------:|
| PF-12 | Crear rutina con 3 ejercicios | Guardada con todos los datos | ✅ |
| PF-13 | Seleccionar días con chips (Lun, Mié, Vie) | Chips activos en verde + guardado correcto | ✅ |
| PF-14 | Editar rutina existente | Chips pre-marcados + ejercicios cargados | ✅ |
| PF-15 | Asignar rutina a un cliente | Cliente ve la rutina en su dashboard | ✅ |
| PF-16 | Desasignar rutina (dejar como plantilla) | Cliente deja de verla | ✅ |
| PF-17 | Ver progreso de un alumno | Modal con historial + resumen semanal | ✅ |
| PF-18 | Comparativa semanal (↑↓=) | Badges con tendencias correctas | ✅ |

### 🏃 Panel de Cliente

| ID | Caso | Resultado esperado | Estado |
|----|------|-------------------|:------:|
| PF-19 | Ver rutina asignada | Tarjeta con ejercicios y días | ✅ |
| PF-20 | Badge "🔥 Hoy toca" en el día correcto | Visible solo si el día actual está programado | ✅ |
| PF-21 | Bloqueo si hoy no toca entrenar | Botón deshabilitado + aviso naranja | ✅ |
| PF-22 | Iniciar entrenamiento | Reproductor con cronómetros activos | ✅ |
| PF-23 | Completar serie | Avance de serie + descanso automático | ✅ |
| PF-24 | Saltar ejercicio | Series marcadas como saltadas | ✅ |
| PF-25 | Agregar serie extra | Contador incrementado | ✅ |
| PF-26 | Pausar/reanudar | Cronómetros congelados y reanudados | ✅ |
| PF-27 | Ver resumen final | Duración total vs efectiva | ✅ |
| PF-28 | Guardar sesión en historial | Visible en "Mi Historial" | ✅ |
| PF-29 | Reanudar sesión tras recargar | Banner de recuperación + restauración | ✅ |

### 🤖 Chat con IA

| ID | Caso | Resultado esperado | Estado |
|----|------|-------------------|:------:|
| PF-30 | Enviar mensaje a GymBot | Respuesta en menos de 5 segundos | ✅ |
| PF-31 | Preguntar "¿Qué día es hoy?" | Responde con fecha real del servidor | ✅ |
| PF-32 | Preguntar "¿Hoy toca entrenar?" | Responde basándose en los días programados | ✅ |
| PF-33 | Consultar peso máximo registrado | Devuelve datos reales de la BD | ✅ |
| PF-34 | Borrar historial de chat | Conversación limpiada en BD y UI | ✅ |

---

## ⚡ Pruebas No Funcionales

### 🎨 Usabilidad y diseño

| ID | Aspecto | Criterio | Estado |
|----|---------|----------|:------:|
| PNF-01 | Responsive móvil | Usable desde 320px | ✅ |
| PNF-02 | Responsive tablet | Usable entre 768px – 1024px | ✅ |
| PNF-03 | Responsive desktop | Usable hasta 1920px | ✅ |
| PNF-04 | Tema oscuro | Contraste AA en textos principales | ✅ |
| PNF-05 | Navegación por teclado | Tab y Enter funcionan en formularios | ✅ |

### ⚙️ Rendimiento

| ID | Aspecto | Criterio | Estado |
|----|---------|----------|:------:|
| PNF-06 | Carga inicial | Menos de 2 segundos en localhost | ✅ |
| PNF-07 | Respuesta de API | Menos de 200ms promedio | ✅ |
| PNF-08 | Respuesta de IA | Menos de 5 segundos con Gemini Flash | ✅ |
| PNF-09 | Redimensionado de avatar | Imagen de 2MB procesada en menos de 1s | ✅ |
| PNF-10 | Consultas SQLite | Índices aplicados, menos de 50ms | ✅ |

### 🔒 Seguridad

| ID | Aspecto | Criterio | Estado |
|----|---------|----------|:------:|
| PNF-11 | Hash de contraseñas | bcrypt con 10 rondas | ✅ |
| PNF-12 | Exposición de API key | Solo en backend (`.env`) | ✅ |
| PNF-13 | Inyección SQL | Uso de sentencias preparadas | ✅ |
| PNF-14 | XSS en contenido de usuario | Renderizado con `textContent` | ✅ |
| PNF-15 | CORS | Configurado con `cors()` | ✅ |

### 📝 Auditoría

| ID | Aspecto | Criterio | Estado |
|----|---------|----------|:------:|
| PNF-16 | Registro de LOGIN | Cada login escribe línea en `activity.log` | ✅ |
| PNF-17 | Registro de LOGOUT | Cada logout escribe línea en `activity.log` | ✅ |
| PNF-18 | Registro de REGISTRO | Cada POST/PUT escribe línea | ✅ |
| PNF-19 | Registro de ELIMINACION | Cada DELETE escribe línea | ✅ |
| PNF-20 | Sin ruido de sincronización | Los GET automáticos NO se loguean | ✅ |

---

## 🔬 Pruebas Unitarias

### 🧩 Funciones críticas testeadas manualmente + GitHub Copilot

<details>
<summary><strong>1. <code>normalizeDayName()</code></strong> — Normalización de días</summary>

**Ubicación**: `services/contextBuilder.js`

**Casos probados**:
| Entrada | Salida esperada |
|---------|----------------|
| `"Miércoles"` | `"miercoles"` |
| `"Sábado"` | `"sabado"` |
| `"  Lunes  "` | `"lunes"` |
| `"MIERCOLES"` | `"miercoles"` |
| `"míércoles"` | `"miercoles"` |
| `""` | `""` |
| `null` | `""` |

**Resultado**: ✅ Todas las variantes normalizan correctamente.
</details>

<details>
<summary><strong>2. <code>isRoutineScheduledForToday()</code></strong> — Validación de días</summary>

**Ubicación**: `public/js/coach.js`

**Casos probados**:
| Rutina con días | Hoy | Resultado |
|-----------------|-----|-----------|
| `"Lunes, Miércoles, Viernes"` | Lunes | `true` |
| `"Lunes, Miércoles, Viernes"` | Martes | `false` |
| `""` (sin días) | Cualquiera | `true` |
| `null` | Cualquiera | `true` |
| `"lunes,miercoles"` | Lunes | `true` |

**Resultado**: ✅ Validación consistente sin importar formato o tildes.
</details>

<details>
<summary><strong>3. <code>formatTime()</code></strong> — Formato MM:SS</summary>

**Ubicación**: `public/js/workoutPlayer.js`

**Casos probados**:
| Entrada (seg) | Salida esperada |
|---------------|-----------------|
| `0` | `"00:00"` |
| `5` | `"00:05"` |
| `60` | `"01:00"` |
| `75` | `"01:15"` |
| `3600` | `"60:00"` |
| `-10` | `"00:00"` (clamp) |
| `NaN` | `"00:00"` (fallback) |

**Resultado**: ✅ Manejo robusto de valores inválidos.
</details>

<details>
<summary><strong>4. <code>resizeImage()</code></strong> — Redimensionado de avatares</summary>

**Ubicación**: `public/js/app.js`

**Casos probados**:
| Imagen original | Resultado |
|-----------------|-----------|
| 2000×1500 px | 400×300 px (mantiene ratio) |
| 400×400 px | Sin cambios (ya está en límite) |
| 3000×3000 px | 400×400 px |
| PNG con transparencia | Convertida a JPEG con fondo blanco |
| Archivo > 2 MB | Rechazado con alerta |

**Resultado**: ✅ Compresión efectiva, peso final menor a 80 KB.
</details>

<details>
<summary><strong>5. <code>logActivity()</code></strong> — Escritura de auditoría</summary>

**Ubicación**: `services/logger.js`

**Casos probados**:
| Escenario | Resultado |
|-----------|-----------|
| Escritura normal | Línea añadida al final del archivo |
| Texto con `\|` | Sanitizado a `/` |
| Texto con saltos de línea | Convertido a espacio |
| Email `null` | Reemplazado por `"anonimo"` |
| Archivo no existe | Creado automáticamente |

**Resultado**: ✅ Formato consistente, archivo nunca corrupto.
</details>

---

## 🐛 Bugs Encontrados y Corregidos

Bitácora de bugs detectados durante el desarrollo y sus soluciones:

| # | Bug | Causa raíz | Solución |
|---|-----|-----------|----------|
| 1 | **Duración total inflada en resumen** | El cronómetro general sumaba los segundos de descanso | Añadida métrica `duracionEfectivaSeg` calculada desde `tiemposPorEjercicio` |
| 2 | **Rutinas plantilla visibles para todos los clientes** | Fallback en `appClient.js` que mostraba rutinas sin asignar | Eliminado el fallback; ahora solo se muestran rutinas asignadas explícitamente |
| 3 | **IA no conocía la fecha actual** | El prompt no incluía la fecha del sistema | Inyección dinámica de `fechaFormateada`, `hoyNombre` y `tocaHoyInfo` |
| 4 | **Log con ruido de sincronización** | El middleware logueaba todos los `GET /api/*` automáticos | Filtro `SYNC_PATHS` para excluir rutas de sincronización |
| 5 | **Email inconsistente en el log** | Algunas rutas usaban `coachName` en vez del email | Estandarizado el uso de `req.headers['x-user-email']` |
| 6 | **Avatar no persistía tras logout** | El `avatar` no se limpiaba al cerrar sesión | Reset del estado y ocultamiento del FAB del chat al hacer logout |
| 7 | **Días con tilde no coincidían** | Comparación estricta de strings `"Miércoles" !== "miercoles"` | Función `normalizeDayName()` con `NFD` + regex |
| 8 | **Serie extra rompía el flujo de descanso** | No se actualizaba `seriesTotales` al agregar | Actualización dinámica del contador + persistencia en state |

---

## ⚠️ Casos Borde Soportados

El sistema maneja correctamente estos escenarios límite:

| # | Caso borde | Comportamiento |
|---|-----------|----------------|
| 1 | Recargar la página durante un entrenamiento | Banner "Reanudar" + restauración del estado desde `localStorage` |
| 2 | Cerrar el navegador sin guardar | Se conserva la sesión activa temporalmente |
| 3 | Saltar todas las series de un ejercicio | Se registra como "Saltado parcialmente" en el resumen |
| 4 | Agregar series extra en medio de la sesión | Contador incrementado sin perder progreso |
| 5 | Rutina sin días configurados | Disponible todos los días |
| 6 | Sesiones antiguas sin `duracionEfectivaSeg` | Se usa `duracionTotalSeg` como fallback |
| 7 | Ejercicio eliminado del catálogo | El historial conserva el nombre y peso original |
| 8 | Coach eliminado con rutinas creadas | Las rutinas quedan como plantillas (FK `SET NULL`) |
| 9 | Avatar de más de 2 MB | Rechazado con alerta |
| 10 | Avatar con formato no-imagen | Rechazado con validación `file.type.startsWith('image/')` |
| 11 | Email con mayúsculas/minúsculas | Comparación con `LOWER()` en SQL |
| 12 | Falla de conexión con Gemini | Mensaje amigable + no rompe la app |
| 13 | Cuota de Gemini agotada | Error 429 manejado con mensaje claro |
| 14 | Petición a endpoint protegido sin sesión | Redirección automática al login |

---

## 📊 Métricas de Calidad

### 📈 Cobertura funcional

| Módulo | Casos | Probados | Cobertura |
|--------|:-----:|:--------:|:---------:|
| Autenticación | 6 | 6 | 🟢 100% |
| Panel Admin | 5 | 5 | 🟢 100% |
| Panel Coach | 7 | 7 | 🟢 100% |
| Panel Cliente | 11 | 11 | 🟢 100% |
| Chat IA | 5 | 5 | 🟢 100% |
| **TOTAL** | **34** | **34** | **🟢 100%** |

### 🎯 Indicadores de calidad

| Métrica | Objetivo | Actual | Estado |
|---------|:--------:|:------:|:------:|
| Casos funcionales aprobados | 100% | 100% | ✅ |
| Bugs críticos abiertos | 0 | 0 | ✅ |
| Bugs medios abiertos | 0 | 0 | ✅ |
| Bugs menores abiertos | 0 | 0 | ✅ |
| Tiempo de respuesta API | < 200ms | ~50ms | ✅ |
| Tiempo de respuesta IA | < 5s | ~2s | ✅ |
| Cobertura responsive | 320–1920px | Sí | ✅ |
| Contraste AA (WCAG) | Cumplido | Sí | ✅ |
| Log de auditoría | 100% de acciones | Sí | ✅ |

### 🏆 Distribución de bugs por severidad

```
🔴 Críticos:  ████████████████████ 8 (100% corregidos)
🟠 Medios:    ████████████████████ 0
🟡 Menores:   ████████████████████ 0
```

> Todos los bugs detectados fueron corregidos antes del cierre del proyecto.

---

## 🛡️ Estándares Aplicados

### 📐 Principios de diseño

| Principio | Aplicación en GymPro |
|-----------|---------------------|
| **SRP** (Single Responsibility) | Cada archivo hace una sola cosa: `auth.js` maneja autenticación, `routines.js` maneja rutinas, etc. |
| **DRY** (Don't Repeat Yourself) | `apiFetch()` centraliza todas las llamadas HTTP; `formatTime()` unifica el formato de tiempo |
| **KISS** (Keep It Simple) | JavaScript vanilla en el frontend, sin frameworks innecesarios |
| **YAGNI** (You Aren't Gonna Need It) | No se implementaron funcionalidades fuera del alcance del proyecto |
| **MVC** | Separación clara entre Model (models/), View (index.html + CSS) y Controller (app.js, admin.js, etc.) |

### 🔒 Buenas prácticas de seguridad

- ✅ Contraseñas con **bcrypt** (10 rondas de salt)
- ✅ **API key** de Gemini aislada en `.env` (nunca en el código)
- ✅ **Prepared statements** en SQLite para prevenir inyección SQL
- ✅ **Validación en backend** de todos los datos de entrada
- ✅ **CORS** habilitado para peticiones controladas
- ✅ **Sanitización** de logs para evitar corrupción del archivo
- ✅ **Content-Type** forzado a JSON en todas las respuestas

### 📏 Convenciones de código

- **Nombres descriptivos** en camelCase para variables y funciones
- **Comentarios de bloque** con `/** ... */` en funciones críticas
- **Separación de secciones** con `// ==========` en archivos grandes
- **Archivos por dominio**: un archivo por cada responsabilidad
- **Consistencia**: mismo estilo en todo el proyecto (frontend y backend)

---

## 📝 Notas finales

- Todas las pruebas se ejecutaron en **entorno local** (`http://localhost:3000`).
- El sistema fue validado en **Chrome 120+**, **Firefox 121+** y **Edge 120+**.
- Las pruebas en producción (`https://gympro-24ly.onrender.com/`) fueron exitosas.
- El `activity.log` sirve como **fuente de verdad** para auditar el uso real de la app.

<details>
<summary>📋 Checklist de cierre de pruebas</summary>

- [x] Todos los casos funcionales ejecutados
- [x] Todas las pruebas no funcionales ejecutadas
- [x] Bugs críticos corregidos y re-verificados
- [x] Casos borde documentados y probados
- [x] Auditoría funcionando al 100%
- [x] Documentación actualizada
- [x] Despliegue en Render verificado
- [x] Repositorio de GitHub actualizado con este README

</details>

---

<p align="center">
  🧪 <strong>Calidad garantizada</strong> — 34/34 casos aprobados
</p>

<p align="right">
  <em>Última actualización: octubre 2026</em>
</p>
