# Roles y Responsabilidades del Equipo

## 1. Propósito

Este documento resume la organización del equipo, su misión, visión, roles principales y lineamientos básicos para el uso de GitHub Actions, GitHub Pages, GitHub Wiki, labels y plantillas de Issues.

---

## 2. Misión

Desarrollar un proceso de pruebas organizado sobre el software seleccionado, aplicando buenas prácticas de análisis, diseño de casos, documentación y seguimiento mediante herramientas de GitHub.

---

## 3. Visión

Consolidarnos como un equipo QA capaz de planificar, documentar y sustentar un proceso de pruebas completo, manteniendo orden en las responsabilidades, evidencias y entregables de cada hito.

---

## 4. Organización del equipo

Durante el primer hito se definieron roles temporales para investigar GitHub Projects, GitHub Pages, GitHub Wiki y GitHub Actions, ya que el equipo aún no tenía mucha experiencia usando estas herramientas de forma integrada.

Después de esta etapa inicial, se propone una estructura más estable basada en roles de testing, adaptada a los seis integrantes del equipo.

**Equipo:** 1 Test Lead, 2 Test Analyst, 2 Test Design, 1 Test Architect

| Rol | Cantidad | Justificación |
| ------------------ | -------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Lead** | 1 | Coordina el equipo, controla hitos, tablero, entregables y revisión general del avance. |
| **Test Analyst** | 2 | Analizan el software, identifican funcionalidades y definen qué se evaluará en el plan de pruebas. |
| **Test Design** | 2 | Elaboran casos de prueba, entradas, pasos, resultados esperados y criterios de aceptación. |
| **Test Architect** | 1 | Define la estructura técnica del proceso de pruebas, organización del repositorio, estrategia de pruebas y, cuando toque, apoyo en CI/CD o GitHub Actions. |

---

## 5. Indicaciones por rol

| Rol | Indicaciones |
|---|---|
| **Test Lead** | Revisar el avance del tablero, controlar fechas y verificar que cada entregable esté completo. |
| **Test Analyst** | Revisar el software, identificar flujos importantes y seleccionar funcionalidades para el plan de pruebas. |
| **Test Design** | Redactar casos de prueba claros, con entradas, pasos, resultados esperados y criterios de aceptación. |
| **Test Architect** | Ordenar la estructura técnica del proceso de pruebas y apoyar la integración con GitHub Actions cuando corresponda. |

---

## 6. Lineamientos de herramientas

### GitHub Actions

Se usará para automatizar validaciones, ejecución de pruebas o integración CI/CD cuando corresponda. Los workflows deberán ubicarse en `.github/workflows/` y no deben incluir datos sensibles.

Ruta sugerida para detalle técnico:

```text
03-automatizacion/github-actions.md
```

### GitHub Pages

Se usará para presentar el software seleccionado. Debe incluir nombre del producto, descripción general, propósito, funcionalidades principales y enlaces del repositorio.

Ruta sugerida:

```text
01-introduccion/producto-seleccionado.md
```

### GitHub Wiki

Se usará para documentar el plan de pruebas unitarias, incluyendo alcance, funcionalidades, casos de prueba, resultados esperados y evidencias.

Ruta sugerida para lineamientos:

```text
04-estandares/uso-github-wiki.md
```

---

## 7. Labels sugeridas

| Label | Uso |
|---|---|
| `documentación` | Archivos Markdown, Wiki, Pages o README. |
| `testing` | Planificación, diseño o ejecución de pruebas. |
| `análisis` | Revisión del software y selección de funcionalidades. |
| `github-projects` | Tablero Kanban/Scrum. |
| `github-pages` | Presentación del producto. |
| `github-wiki` | Plan de pruebas. |
| `github-actions` | Automatización o CI/CD. |
| `revisión` | Validación antes de cerrar una tarea. |
| `hito-1` | Tareas del primer hito. |

---

## 8. Plantilla básica de Issue

```md
## Descripción

Indicar qué se debe realizar.

## Responsable

Nombre del integrante encargado.

## Entregables

- [ ] Entregable 1
- [ ] Entregable 2

## Criterios de aceptación

- [ ] La tarea fue completada.
- [ ] La información fue revisada.
- [ ] Se agregó evidencia si corresponde.
- [ ] La Issue fue actualizada en el tablero.
```

---

## 9. Criterios para cerrar la tarea

- [x] Se documentó la misión del equipo.
- [x] Se documentó la visión del equipo.
- [x] Se definió la estructura del equipo.
- [x] Se detallaron roles y responsabilidades.
- [x] Se indicaron lineamientos para GitHub Actions.
- [x] Se indicaron lineamientos para GitHub Pages.
- [x] Se indicaron lineamientos para GitHub Wiki.
- [x] Se propusieron labels.
- [x] Se propuso una plantilla básica de Issue.

---