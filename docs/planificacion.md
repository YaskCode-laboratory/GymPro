# Planificación del Proyecto — GymPro

## 1. Cronograma general

El proyecto se desarrolló en **4 sprints** de 3 semanas cada uno, cubriendo las **12 semanas del semestre**.

---

## 2. Sprints y entregables

| Sprint | Semanas | Objetivo | Entregable |
|--------|---------|----------|-----------|
| **Sprint 1** | 1-2 | Análisis, planificación + análisis de requisitos | Entregable I: propuesta |
| **Sprint 2** | 2-3 | Plan de actividades + gestión de riesgos | Entregable II: Planificación |
| **Sprint 2** | 7-9 | Modo entrenamiento + progreso | Demo intermedia |
| **Sprint 3** | 10-12 | IA + responsive + pruebas | Entregable III: final |

---

## 3. Actividades e hitos

### Hito 1: Análisis (semana 2)
- ✅ Definición del problema.
- ✅ Requisitos funcionales y no funcionales.
- ✅ Casos de uso.

### Hito 2: Diseño UML (semana 3)
- ✅ Diagrama de clases.
- ✅ Diagramas de casos de uso.
- ✅ Modelo de base de datos.

### Hito 3: Backend MVP (semana 6)
- ✅ Autenticación con roles.
- ✅ CRUD usuarios, ejercicios, rutinas.
- ✅ Base de datos SQLite.

### Hito 4: Interfaz completa (semana 9)
- ✅ Todos los dashboards.
- ✅ Modo entrenamiento guiado.
- ✅ Historial y progreso.

### Hito 5: IA y pulido (semana 11)
- ✅ Chat con IA contextual.
- ✅ Responsive móvil.
- ✅ Log de actividades.

### Hito 6: Entrega final (semana 12)
- ✅ Documentación completa.
- ✅ Pruebas.
- ✅ CI con GitHub Actions.

---

## 4. Diagrama de Gantt

Ver `docs/03-diagramas/gantt.png`



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
