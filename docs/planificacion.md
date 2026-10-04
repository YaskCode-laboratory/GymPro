# Planificación del Proyecto — GymPro

## 1. Cronograma general

El proyecto se desarrolló en **5 sprints** de 3 semanas cada uno, cubriendo las **18 semanas durante el semestre**.

---

## 2. Sprints y entregables

| Sprint | Semana | Objetivo | Entregable |
|--------|---------|----------|-----------|
| **Sprint 1** | 1-2 | Análisis, planificación + análisis de requisitos | Entregable I: propuesta + área wellness seleccionada |
| **Sprint 2** | 2-4 | Plan de actividades + gestión de riesgos | Entregable II: Planificación |
| **Sprint 2** | 4-7 | Selección de la metodología | Entregable III: Diagrama de Gantt - Metodología de Desarrollo |
| **Sprint 4** | 7-8 | Caso de uso UML | Entregable IV: Diagramas de UML de Casos de uso + descripción |
| **Sprint 5** | 8-9 | Caso de clases UML | Entregable V: UML sobre Diagramas de clase + descripción + código |

---

## 3. Actividades e hitos

### Hito 1: Análisis + Planificación (semana 1-2)
- ✅ Definición del problema.
- ✅ Area wellness seleccionada.
- ✅ Comparación entre aplicaciones correspondientes al wellness propuesto.
- ✅ Problemas o desventajas que tienen las apps.
- ✅ Solución que resuelve nuestra app frente a otras.
- ✅ Requisitos funcionales y no funcionales.

### Hito 2: Diseño UML (semana 7-8)
- ✅ Documentacion detallada por cada caso de uso y relacion con su requisito funcionales.
- ✅ Diagrama de clases.
- ✅ Diagramas de casos de uso.
- ✅ Código en PlantUML de los diagramas Caso de uso y de Clases
- ✅ Implementacion del codigo de los Objetos/Clases en Javascript

### Hito 3: Implementación y desarrollo de la app (semana 10-14)
- ✅ Autenticación segun rol correspondiente.
- ✅ Crear, actulizar, eliminar y modificar datos de usuarios, ejercicios, rutinas.
- ✅ Implementación de las relaciones entre las tablas con SQLite.

### Hito 4: Interfaz completa (semana 13)
- ✅ Todos los dashboards.
- ✅ Modo entrenamiento guiado.
- ✅ Historial y progreso.

### Hito 5: IA y pulido (semana 13-14)
- ✅ Chat con IA contextual.
- ✅ Responsive móvil.
- ✅ Log de actividades.

### Hito 6: Entrega final (semana 12)
- ✅ Documentación completa.
- ✅ Pruebas.

---

## 4. Diagrama de Gantt

Ver `docs/gantt.png`

[![Diagrama de Gantt](diagramas/gantt.png)](diagramas/gantt.png)

---

## 5. Asignación de responsabilidades

| Integrante | Rol | Responsabilidades |
|-----------|-----|------------------|
| *[Nombre 1]* | Full-stack Lead | Backend, base de datos, integración IA |
| *[Nombre 2]* | Frontend Lead | UI/UX, estilos, responsive móvil |
| *[Nombre 3]* | QA / Docs | Pruebas, documentación, UML |

---

## 6. Análisis y gestión de riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| R-01 | Falta de experiencia con IA | Media | Medio | Documentación oficial de Gemini + prototipo temprano |
| R-02 | Conflictos Git | Alta | Bajo | Uso de ramas feature/* + PRs |
| R-03 | Pérdida de datos | Baja | Alto | Backup del .db + commits frecuentes |
| R-04 | Cuota de IA agotada | Media | Medio | Fallback si API falla + caché de respuestas |
| R-05 | Falta de tiempo | Alta | Alto | Priorizar MVP primero, extras después |
| R-06 | Incompatibilidad navegador | Baja | Bajo | Testing en Chrome/Firefox/Safari |
| R-07 | Fuga de API key | Baja | Crítico | Solo backend, .env, .gitignore |
| R-08 | SQL injection | Baja | Alto | Queries parametrizadas (sqlite3 driver) |
| R-09 | XSS | Media | Medio | Escape de HTML en el frontend |
| R-10 | Dependencias rotas | Baja | Bajo | package-lock.json versionado |

---

## 7. Herramientas de gestión

- **Trello** para el tablero de tareas.
- **GitHub Projects** para issues.
- **Google Meet** para reuniones semanales.
- **Discord** para comunicación diaria.
- **GitHub Actions** para CI.
