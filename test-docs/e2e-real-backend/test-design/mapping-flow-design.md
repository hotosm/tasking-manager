# Especificación de Diseño de Pruebas — Flujo de Mapeo (Backend Real)

## 1. Identificación

- **Identificador del diseño**: TD-E2E-MAP-001
- **Nombre**: Flujo de Mapeo contra Backend Real
- **Caso de prueba asociado**: TC-E2E-MAP-001
- **Fecha**: 2026-07-15

## 2. Introducción

### 2.1 Propósito

Definir cómo se prueba el flujo completo de mapeo utilizando el backend real de HOT Tasking Manager, incluyendo la base de datos PostgreSQL/PostGIS y la autenticación de sesión.

### 2.2 Alcance

- Verificar que un usuario mapper autenticado puede visualizar la lista de proyectos publicados.
- Verificar que el usuario puede acceder al detalle de un proyecto.
- Verificar que el usuario puede seleccionar una tarea en estado `READY`.
- Verificar que el usuario puede abrir el editor iD para mapear la tarea seleccionada.
- Medir tiempos de respuesta clave del flujo.

### 2.3 Referencias

- `frontend/e2e/flows/mapping-flow.spec.js`
- `frontend/e2e/fixtures/auth.js`
- `frontend/e2e/fixtures/e2e-seed.js`
- `scripts/e2e-seed.py`

## 3. Características a probar

| Característica | Descripción |
|---|---|
| Autenticación de sesión | Login mediante callback `/authorized/` con token de sesión válido. |
| Exploración de proyectos | Renderizado de tarjetas de proyectos publicados desde `/api/v2/projects/`. |
| Detalle de proyecto | Navegación a `/projects/{id}` y carga de resumen. |
| Selección de tarea | Búsqueda de tarea por ID en `/projects/{id}/tasks`. |
| Apertura de editor | Navegación a `/projects/{id}/map` y carga del contenedor `#id-container`. |

## 4. Condiciones de prueba

### 4.1 Precondiciones

- Backend real y base de datos levantados con `docker-compose.e2e.yml`.
- Script `scripts/e2e-seed.py` ejecutado.
- Proyecto `E2E Mapping Project` publicado con al menos una tarea en estado `READY`.
- Usuario `e2e_mapper` con rol mapper y sesión válida.

### 4.2 Datos de entrada

| Dato | Valor | Origen |
|---|---|---|
| Usuario | `e2e_mapper` | Seed |
| Proyecto | `E2E Mapping Project` | Seed |
| Tarea a mapear | `#2` (READY) | Seed |
| Editor | iD (`#id-container`) | Configuración del proyecto |

### 4.3 Factores ambientales

- `E2E_BACKEND=real` debe estar configurado.
- `TM_APP_API_URL=http://127.0.0.1:5000/api` para que el frontend apunte al backend real.
- El overlay de webpack-dev-server se oculta durante la prueba para evitar interferencias.

## 5. Estrategia de diseño

### 5.1 Tipo de prueba

- Funcional, E2E, caja negra.

### 5.2 Técnica

- Automatizada con Playwright.
- Navegación real por la interfaz.
- Verificaciones de elementos visibles y de URL.
- Medición de tiempos con `performance.now()`.

### 5.3 Cobertura

- Un caso de prueba principal que recorre el flujo completo.
- Métricas de desempeño en cuatro puntos del flujo.

## 6. Criterios de aceptación

- El usuario inicia sesión exitosamente.
- El proyecto de prueba es visible en la página de exploración.
- La navegación al detalle del proyecto es correcta.
- La tarea `#2` puede seleccionarse y abrirse en el editor iD.
- Los tiempos medidos no superan los umbrales establecidos.

## 7. Riesgos y supuestos

- Se asume que la base de datos se encuentra en estado limpio tras ejecutar el seed.
- Se asume que el backend real responde en `127.0.0.1:5000`.
- Se asume disponibilidad del editor iD en el frontend.
