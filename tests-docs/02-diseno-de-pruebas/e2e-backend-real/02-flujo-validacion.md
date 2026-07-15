# Diseño de Pruebas E2E — Flujo de Validación (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Diseño de Pruebas de Sistema (Caja Negra)  
**Caso de Prueba Asociado:** CP-E2E-VAL-001  
**Módulo Funcional Relacionado:** MOD-04 — Validación de Tareas  
**Escenario Funcional Relacionado:** ESC-4001 — Solicitud de Bloqueo y Validación de Tarea Mapeada  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Contexto

Este documento describe el diseño de la prueba End-to-End del flujo de validación ejecutado contra el backend real de HOT Tasking Manager. El objetivo es validar el "happy path" de un usuario `VALIDATOR` que inicia sesión, localiza una tarea en estado `MAPPED`, la bloquea para validación, selecciona el estado `VALIDATED` y envía el formulario, verificando la integración completa frontend-backend-base de datos.

## 2. Estrategia de Diseño

### 2.1. Enfoque general

- Prueba E2E automatizada con Playwright.
- Navegación real por la interfaz de usuario.
- Backend real con base de datos PostgreSQL/PostGIS sembrada con datos controlados.
- Validación de estados, navegación y métricas de desempeño.

### 2.2. Técnicas de caja negra aplicadas

| Técnica | Aplicación |
| :--- | :--- |
| **Transición de estados** | Verificar que la tarea pasa de `MAPPED` → `LOCKED_FOR_VALIDATION` → `VALIDATED`. |
| **Partición de equivalencia** | Validación individual de una tarea (`VALIDATED` / `INVALIDATED`); el flujo no evalúa validación masiva. |
| **Análisis de valores límite** | Tiempos de respuesta en cada etapa, con umbrales generosos para entorno de desarrollo. |

## 3. Características a probar

| Característica | Descripción |
| :--- | :--- |
| Autenticación de sesión | Login mediante callback `/authorized/` con token de sesión válido del validador. |
| Exploración de proyecto | Renderizado del detalle del proyecto publicado. |
| Selección de tarea mapeada | Búsqueda de tarea por ID en `/projects/{id}/tasks`. |
| Bloqueo para validación | Clic en **Validate selected task** (o **Resume validation**) y redirección a `/projects/{id}/validate`. |
| Panel de validación | Cambio a la pestaña **Completion** y selección de `VALIDATED`. |
| Envío de validación | Clic en **Submit task** y redirección a la lista de tareas. |

## 4. Condiciones de prueba

### 4.1. Precondiciones

1. Backend real y base de datos levantados con `docker-compose.e2e.yml`.
2. Script `scripts/e2e-seed.py` ejecutado (limpia y recrea el proyecto de prueba).
3. Proyecto `E2E Mapping Project` publicado con al menos una tarea en estado `MAPPED`.
4. Usuario `e2e_validator` con rol mapper, email verificado y sesión válida.
5. Archivo `frontend/e2e/.e2e-seed.json` generado y accesible.

### 4.2. Datos de entrada

| Dato | Valor | Origen |
| :--- | :--- | :--- |
| Usuario | `e2e_validator` | Seed |
| Proyecto | `E2E Mapping Project` | Seed |
| Tarea a validar | `#1` (MAPPED) | Seed |
| Estado objetivo | `VALIDATED` | Interacción del usuario |

### 4.3. Factores ambientales

- `E2E_BACKEND=real` debe estar configurado.
- `TM_APP_API_URL=http://127.0.0.1:5000/api` para que el frontend apunte al backend real.
- El overlay de webpack-dev-server se oculta durante la prueba para evitar interferencias.

## 5. Caso de prueba derivado

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-E2E-VAL-001** | Usuario `e2e_validator`, proyecto `E2E Mapping Project`, tarea `#1` MAPPED. | El sistema bloquea la tarea para validación, permite seleccionar `VALIDATED`, envía el formulario y redirige a la lista de tareas con la tarea en estado `VALIDATED`. | Transición de estados, Partición de equivalencia |

## 6. Criterios de aceptación

- El usuario inicia sesión exitosamente.
- El proyecto de prueba es visible.
- La tarea `#1` aparece como mapeada y se puede bloquear para validación.
- La navegación a la vista de validación es correcta.
- El panel de validación se muestra al seleccionar la pestaña **Completion**.
- Es posible seleccionar `VALIDATED` y enviar la tarea.
- La redirección final es la lista de tareas del proyecto.

## 7. Criterios de éxito adicionales (desempeño)

| Métrica | Umbral |
| :--- | :--- |
| `loginToExplore` | < 10 000 ms |
| `taskSelectionToValidation` | < 90 000 ms |
| `validationToSubmit` | < 30 000 ms |

## 8. Postcondiciones

- La tarea `#1` queda en estado `VALIDATED` en la base de datos.
- El entorno puede re-seedearse para ejecutar la prueba nuevamente.

## 9. Trazabilidad

- Requisito funcional: un validador debe poder revisar y validar tareas mapeadas.
- Flujo de usuario automatizado: `frontend/e2e/flows/validation-flow.spec.js`.
- Datos de prueba: `scripts/e2e-seed.py`.
