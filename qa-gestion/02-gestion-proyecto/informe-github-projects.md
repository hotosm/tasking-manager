# Informe Técnico: Investigación e Implementación de GitHub Projects (Kanban)

**Responsable:** Alexandra Raquel Quispe Arratea  
**Rol:** Gestora de Proyecto / Analista QA  
**Fecha:** 27 de mayo de 2026  
**Proyecto:** Gestor de Tareas (Fork Open Source)

---

## 1. Resumen Ejecutivo
Como parte de la estrategia de organización y control de calidad (QA) del equipo, el presente documento certifica la investigación, diseño e implementación del entorno de trabajo colaborativo utilizando **GitHub Projects**.

El objetivo principal de esta implementación es proporcionar una única fuente de verdad para el estado del proyecto, garantizando la trazabilidad de las tareas, la correcta asignación de responsabilidades y la automatización del flujo de vida de los requerimientos (Issues) bajo un marco de trabajo ágil (Kanban).

---

## 2. Investigación sobre GitHub Projects

**GitHub Projects** es la herramienta nativa de gestión de proyectos de GitHub que permite enlazar directamente la planificación con el código fuente. 

### 2.1 Análisis: Projects Classic vs. Projects (New)
Durante la fase de investigación, se evaluaron las dos versiones disponibles en la plataforma:
1.  **Projects (Classic):** Basado únicamente en un tablero Kanban básico. Ha sido marcado como obsoleto por GitHub debido a sus limitaciones de personalización y falta de métricas automatizadas.
2.  **Projects (New):** Construido como una base de datos relacional sobre los repositorios. Permite vistas dinámicas (Tableros, Tablas, Roadmaps), campos personalizados (Custom Fields) y gráficos en tiempo real (Insights).

**Decisión Técnica:** Se adoptó **GitHub Projects (New)** para el proyecto "Metamorfosis" por su capacidad de escalar, sus vistas de tabla agrupadas y la integración nativa con Workflows de automatización.

---

## 3. Implementaciones Realizadas (Configuración Base)

Se ha desplegado un entorno de gestión robusto que estandariza la forma en que el equipo documenta, reporta y soluciona tareas.

### 3.1 Diseño del Flujo Kanban
Se estableció un tablero central ("Proyecto Metamorfosis") con tres estados principales que reflejan el ciclo de vida de las tareas:
*    **Para hacer (To Do):** Backlog de tareas e investigaciones pendientes.
*    **En progreso (In Progress):** Tareas asignadas que están siendo activamente desarrolladas.
*    **Hecho (Done):** Tareas finalizadas, validadas y cerradas en el repositorio.

### 3.2 Integración de Metadatos y Trazabilidad
Para un control detallado, cada Issue dentro del tablero ha sido enriquecido con metadatos específicos:
*   **Milestones (Hitos):** Se configuró el `Primer Hito (Sprint 1)` con fecha de entrega límite (27 de mayo de 2026) para agrupar las tareas correspondientes a la entrega actual y medir el porcentaje de avance.
*   **Labels (Etiquetas):** Se creó una taxonomía visual para categorizar el trabajo, incluyendo etiquetas como `gestión`, `QA`, `testing`, `análisis` y `documentación`.
*   **Assignees:** Cada tarjeta cuenta con un responsable único asignado, lo que permite filtrar el tablero mediante vistas de Tabla agrupadas por usuario.

### 3.3 Plantillas de Issues (Issue Templates)
Para estandarizar el ingreso de nuevas tareas y reporte de errores, se configuraron **Issue Templates** en el repositorio. Esto asegura que cualquier nuevo bug o requerimiento cuente con la estructura y descripción necesaria antes de ingresar al tablero Kanban.

---

## 4. Automatizaciones de Estados (Workflows Nativos)

Para minimizar el trabajo administrativo manual y evitar inconsistencias entre el código y el tablero, se activaron los **Workflows nativos** de GitHub Projects:

1.  **Auto-ingreso:** Todo Issue nuevo que se asigne al "Proyecto Metamorfosis" ingresa por defecto a la columna *Para hacer*.
2.  **Auto-cierre (Item Closed):** Cuando un desarrollador culmina su trabajo y cierra el Issue (o se aprueba un Pull Request vinculado), la tarjeta se desplaza automáticamente a la columna *Hecho*. 
3.  **Generación de Ramas (Branches):** Se instruyó al equipo a utilizar el panel de *Development* de los Issues para autogenerar ramas vinculadas, asegurando que el código de solución quede directamente conectado a la tarjeta Kanban.

---

## 5. Recomendaciones y Reglas de Uso para el Equipo

Para asegurar la integridad del tablero en los siguientes Sprints, el equipo deberá adherirse a las siguientes convenciones:

*   **Evitar movimientos manuales a "Hecho":** Ningún miembro debe arrastrar tarjetas a la columna de finalizado. Debe cerrarse el Issue desde la pestaña de código para que el bot de automatización actúe.
*   **Uso obligatorio de Milestones:** Ningún Issue debe existir sin pertenecer a un Hito o Sprint definido.
*   **Checklists en descripciones:** Fomentar el uso de listas de tareas Markdown (`- [ ]`) dentro de los Issues para visualizar barras de progreso antes de cerrar una tarea grande.

---

## 6. Criterios de Aceptación (Checklist)

* [x] **Investigación:** Diferencias analizadas y justificadas entre versiones de Projects.
* [x] **Flujo Visual:** Tablero Kanban funcional, priorizado e integrado con el repositorio.
* [x] **Automatización:** Configuración de estados automáticos validada.
* [x] **Trazabilidad:** Integración absoluta con Issues, Labels y Milestones.
* [x] **Documentación:** Informe técnico estructurado y entregado como commit formal.

**Fin del reporte - Listo para revisión en el Hito 1.**
