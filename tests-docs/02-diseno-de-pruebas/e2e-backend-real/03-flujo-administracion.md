# Diseño de Pruebas E2E — Flujo de Administración / Crear Proyecto (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Diseño de Pruebas de Sistema (Caja Negra)  
**Caso de Prueba Asociado:** CP-E2E-ADM-001  
**Módulo Funcional Relacionado:** MOD-02 — Gestión de Proyectos  
**Escenario Funcional Relacionado:** ESC-2001 — Creación de un Nuevo Proyecto  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Contexto

Este documento describe el diseño de la prueba End-to-End del flujo de administración para crear un proyecto ejecutado contra el backend real de HOT Tasking Manager. El objetivo es validar que un usuario `ADMIN` puede iniciar sesión, acceder al panel de gestión, crear un nuevo proyecto importando un AOI GeoJSON, definir la grilla de tareas y guardar el proyecto como borrador.

## 2. Estrategia de Diseño

### 2.1. Enfoque general

- Prueba E2E automatizada con Playwright.
- Navegación real por el wizard de creación de proyectos.
- Backend real con base de datos PostgreSQL/PostGIS.
- Validación de pasos del wizard, creación exitosa y redirección al proyecto creado.

### 2.2. Técnicas de caja negra aplicadas

| Técnica | Aplicación |
| :--- | :--- |
| **Flujo de trabajo** | Recorrer secuencialmente los 4 pasos del wizard (AOI, tamaño de tareas, recorte y revisión). |
| **Partición de equivalencia** | AOI válido en formato GeoJSON; se descartan formatos inválidos y AOIs fuera de límites. |
| **Análisis de valores límite** | AOI pequeño (≈1 km²) que genera una única tarea, acotando el tiempo de procesamiento. |

## 3. Características a probar

| Característica | Descripción |
| :--- | :--- |
| Autenticación de sesión | Login mediante callback `/authorized/` con token de sesión de administrador. |
| Panel de gestión | Renderizado de `/manage` y acceso a "Create new project". |
| Wizard de creación | Navegación por `/manage/projects/new/` y sus 4 pasos. |
| Importación de AOI | Carga de archivo GeoJSON y cálculo de área/grilla. |
| Selección de organización | Selección de la organización de prueba en el paso de revisión. |
| Creación de borrador | Envío del formulario y redirección a `/manage/projects/{id}`. |

## 4. Condiciones de prueba

### 4.1. Precondiciones

1. Backend real y base de datos levantados con `docker-compose.e2e.yml`.
2. Script `scripts/e2e-seed.py` ejecutado.
3. Usuario `e2e_admin` con rol `ADMIN` (`role = 1`), email verificado y sesión válida.
4. Organización `E2E Organisation` creada y visible para el administrador.
5. Archivo AOI de prueba disponible en `frontend/e2e/fixtures/test-aoi.geojson`.

### 4.2. Datos de entrada

| Dato | Valor | Origen |
| :--- | :--- | :--- |
| Usuario | `e2e_admin` | Seed |
| Organización | `E2E Organisation` | Seed |
| Nombre del proyecto | `E2E Admin Project {timestamp}` | Test |
| AOI | `test-aoi.geojson` (polígono pequeño) | Fixture |

### 4.3. Factores ambientales

- `E2E_BACKEND=real` debe estar configurado.
- `TM_APP_API_URL=http://127.0.0.1:5000/api` para que el frontend apunte al backend real.
- El overlay de webpack-dev-server se oculta durante la prueba para evitar interferencias.

## 5. Caso de prueba derivado

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-E2E-ADM-001** | Usuario `e2e_admin`, AOI `test-aoi.geojson`, organización `E2E Organisation`. | El sistema permite completar el wizard, crea el proyecto como borrador y redirige a `/manage/projects/{id}`. | Flujo de trabajo, Partición de equivalencia |

## 6. Criterios de aceptación

- El usuario inicia sesión exitosamente y accede al panel de gestión.
- El wizard de creación de proyectos se carga correctamente.
- El AOI se importa y se calculan área y número de tareas.
- Es posible avanzar por los pasos Set Task Sizes, Trim Task Grid y Review.
- El nombre del proyecto y la organización son obligatorios y habilitan el botón **Create**.
- Tras crear, el sistema redirige a la página de administración del proyecto recién creado.

## 7. Criterios de éxito adicionales (desempeño)

| Métrica | Umbral |
| :--- | :--- |
| `loginToManage` | < 10 000 ms |
| `createProjectWizard` | < 120 000 ms |

## 8. Postcondiciones

- Un nuevo proyecto en estado `DRAFT` queda registrado en la base de datos.
- El proyecto queda asociado a la organización `E2E Organisation`.

## 9. Trazabilidad

- Requisito funcional: un administrador debe poder crear proyectos en el sistema.
- Flujo de usuario automatizado: `frontend/e2e/flows/admin-create-project-flow.spec.js`.
- Datos de prueba: `scripts/e2e-seed.py` y `frontend/e2e/fixtures/test-aoi.geojson`.
