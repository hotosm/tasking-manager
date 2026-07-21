# Diseño de Pruebas E2E — Flujo de Mapeo (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Diseño de Pruebas de Sistema (Caja Negra)  
**Caso de Prueba Asociado:** CP-E2E-MAP-001  
**Módulo Funcional Relacionado:** MOD-03 — Ejecución de Mapeo (Tasking)  
**Escenario Funcional Relacionado:** ESC-3001 — Solicitud de Bloqueo e Inicio de Tarea de Mapeo  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Contexto

Este documento describe el diseño de la prueba End-to-End del flujo de mapeo ejecutado contra el backend real de HOT Tasking Manager. El objetivo es validar el "happy path" de un usuario `MAPPER` que inicia sesión, explora proyectos publicados, selecciona una tarea en estado `READY` y la abre en el editor iD, verificando la integración completa frontend-backend-base de datos.

Para el detalle de actores, restricciones y reglas de negocio del módulo de mapeo, referirse al [Diseño de Pruebas Funcionales — MOD-03](/tests-docs/02-diseno-de-pruebas/funcionales/03-ejecucion-de-mapeo.md).

## 2. Estrategia de Diseño

### 2.1. Enfoque general

- Prueba E2E automatizada con Playwright.
- Navegación real por la interfaz de usuario.
- Backend real con base de datos PostgreSQL/PostGIS.
- Validación de estados y navegación, además de métricas de desempeño.

### 2.2. Técnicas de caja negra aplicadas

| Técnica | Aplicación |
| :--- | :--- |
| **Transición de estados** | Verificar que la tarea seleccionada pasa de `READY` a `LOCKED_FOR_MAPPING` tras el bloqueo. |
| **Partición de equivalencia** | Editor web (`iD`) como clase válida; el flujo no evalúa editores locales ni estados inválidos. |
| **Análisis de valores límite** | Tiempos de respuesta en cada etapa del flujo, con umbrales generosos para entorno de desarrollo. |

## 3. Características a probar

| Característica | Descripción |
| :--- | :--- |
| Autenticación de sesión | Login mediante callback `/authorized/` con token de sesión válido. |
| Exploración de proyectos | Renderizado de tarjetas de proyectos publicados desde `/api/v2/projects/`. |
| Detalle de proyecto | Navegación a `/projects/{id}` y carga de resumen. |
| Selección de tarea | Búsqueda de tarea por ID en `/projects/{id}/tasks`. |
| Apertura de editor | Navegación a `/projects/{id}/map` y carga del contenedor `#id-container`. |

## 4. Condiciones de prueba

### 4.1. Precondiciones

1. Backend real y base de datos levantados con `docker-compose.e2e.yml`.
2. Script `scripts/e2e-seed.py` ejecutado.
3. Proyecto `E2E Mapping Project` publicado con al menos una tarea en estado `READY`.
4. Usuario `e2e_mapper` con rol mapper, email verificado y sesión válida.

### 4.2. Datos de entrada

| Dato | Valor | Origen |
| :--- | :--- | :--- |
| Usuario | `e2e_mapper` | Seed |
| Proyecto | `E2E Mapping Project` | Seed |
| Tarea a mapear | `#2` (READY) | Seed |
| Editor | iD (`#id-container`) | Configuración del proyecto |

### 4.3. Factores ambientales

- `E2E_BACKEND=real` debe estar configurado.
- `TM_APP_API_URL=http://127.0.0.1:5000/api` para que el frontend apunte al backend real.
- El overlay de webpack-dev-server se oculta durante la prueba para evitar interferencias.

## 5. Caso de prueba derivado

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-E2E-MAP-001** | Usuario `e2e_mapper`, proyecto `E2E Mapping Project`, tarea `#2` READY, editor iD. | El sistema permite el bloqueo de la tarea (`LOCKED_FOR_MAPPING`) y carga el editor iD. El usuario navega por login → explore → project detail → task selection → map editor. | Transición de estados, Partición de equivalencia |

## 6. Criterios de aceptación

- El usuario inicia sesión exitosamente.
- El proyecto de prueba es visible en la página de exploración.
- La navegación al detalle del proyecto es correcta.
- La tarea `#2` puede seleccionarse y abrirse en el editor iD.
- Los tiempos medidos no superan los umbrales establecidos.

## 7. Criterios de éxito adicionales (desempeño)

| Métrica | Umbral |
| :--- | :--- |
| `loginToExplore` | < 10 000 ms |
| `exploreToProjectDetail` | < 10 000 ms |
| `projectDetailToTaskSelection` | < 10 000 ms |
| `taskSelectionToEditor` | < 90 000 ms |

## 8. Postcondiciones

- La tarea `#2` queda bloqueada para mapeo por el usuario `e2e_mapper` en la base de datos.
- El entorno puede re-seedearse para ejecutar la prueba nuevamente.

## 9. Trazabilidad

- Requisito funcional: un mapper debe poder seleccionar y abrir una tarea lista para mapear.
- Flujo de usuario automatizado: `frontend/e2e/flows/mapping-flow.spec.js`.
- Datos de prueba: `scripts/e2e-seed.py`.
- Diseño funcional base: [MOD-03](/tests-docs/02-diseno-de-pruebas/funcionales/03-ejecucion-de-mapeo.md).
