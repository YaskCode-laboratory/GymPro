# Planificación del Proyecto — GymPro

## 1. Cronograma general

El proyecto se desarrolló en **5 sprints** de 3 semanas cada uno, cubriendo las **18 semanas durante el semestre**.

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
- ✅ 
- ✅ Crear, actulizar, eliminar y modificar datos de usuarios, ejercicios, rutinas.
- ✅ Implementación de las relaciones entre las tablas con SQLite.

### Hito 4: Interfaz completa (semana 14)
- ✅ Todos los dashboards.
- ✅ Modo entrenamiento guiado.
- ✅ Historial y progreso.

### Hito 5: IA y pulido (semana 14-16)
- ✅ Chat con IA contextual.
- ✅ Responsive móvil.
- ✅ Log de actividades.

### Hito 6: Entrega final (semana 18)
- ✅ Documentación completa.
- ✅ Pruebas.

---

## 4. Diagrama de Gantt

Ver [aquí](https://share.goodday.work/fa6cef0c-0001-43f6-ad5e-4b5ee089d03b), el cual se uso GoodDay Work.

[![Diagrama de Gantt](diagramas/gantt.png)](diagramas/gantt.png)

---

## 5. Análisis y gestión de riesgos

|  | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| Personal | Falta de experiencia | Media | Medio | Documentación oficial + realización de prototipos |
| R-03 | Pérdida de datos en local | Baja | Alto | Revisar lo ultimo subido a Github y extraer código fuente |
| R-05 | Falta de tiempo | Alta | Alto | Priorizar requsitos del proyecto más importantes, extras después (diseño de los botones, organizacion de la interfaz...) |
| R-06 | Incompatibilidad navegador | Baja | Bajo | Probar en otros navegadores: Chrome/Firefox/Safari |
| R-07 | Fuga de API key | Baja | Crítico | Cancelar clave digital para que deje de funcionar por completo y generar una nueva |
| R-08 | SQL injection | Baja | Alto | Queries parametrizadas (sqlite3 driver) |
| R-09 | XSS | Media | Medio | Escape de HTML en el frontend |
| R-10 | Dependencias rotas | Baja | Bajo | package-lock.json versionado |

---

## 6. Herramientas de gestión

- **Good Day Work** para el llevar los dias en los que se hizo cada fase del proyecto.
- **GitHub** para subir proyecto y realizar cambios al mismo.
- **Google Meet** para reuniones semanales.
