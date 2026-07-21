# Especificación de Pruebas Unitarias: [Nombre de la Suite, ej. Servicios Core]

**Responsable:** [Nombre del Integrante]

## 1. Base de Pruebas (Test Basis)
*(Indicar qué archivos, requisitos o épicas del proyecto cubre esta suite).*
*   **Componente(s):** `backend/services/project_service.py`
*   **Dependencias Mokeadas:** Base de datos, API externa de OSM.

## 2. Condiciones de Prueba (TD2) y Cobertura (TD3)
Identificación de las funcionalidades a probar dentro del módulo aplicando técnicas ISO 29119-4 (ej. Valores límite).

| ID Condición | Funcionalidad a Evaluar | Técnica Aplicada |
| :--- | :--- | :--- |
| COND-01 | Crear proyecto con parámetros válidos | Partición de Equivalencia |
| COND-02 | Crear proyecto con área excediendo límite | Valor Límite (Boundary Value) |
| COND-03 | Manejo de DTOs con campos faltantes | Tabla de Decisiones |

## 3. Casos de Prueba (TD4 y TD6)
*(Mapeo de pruebas existentes y diseño de pruebas faltantes).*

### 3.1 Pruebas Implementadas Existentes (Test Scripts)
Estas pruebas ya existen en el repositorio.
| ID Caso | ID Condición | Descripción | URL del Test Script (GitHub) | Estado |
| :--- | :--- | :--- | :--- | :--- |
| TC-001 | COND-01 | Retorna HTTP 201 al crear proyecto | `[Enlace a test_project.py#L45]` | Automatizado |
| TC-002 | COND-03 | Error 400 si falta 'author_id' | `[Enlace a test_dto.py#L12]` | Automatizado |

### 3.2 Brechas / Nuevas Pruebas a Implementar (TDD)
Pruebas diseñadas que aún no existen en código y deben desarrollarse.
| ID Caso | ID Condición | Descripción de la Prueba | Input Esperado | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-003 | COND-02 | Rechazar proyecto si polígono > 5000km2 | Polígono = 5001km2 | Excepción `AreaTooLargeError` | Pendiente TDD |
| TC-004 | COND-02 | Aceptar proyecto si polígono = 5000km2 | Polígono = 5000km2 | Proyecto Creado con Éxito | Pendiente TDD |

## 4. Métricas de Cobertura de Diseño (ISO 29119)
*   **Total de Elementos de Cobertura Identificados (T):** 4 (Casos TC-001 al TC-004)
*   **Total de Elementos Ejecutados/Automatizados (N):** 2 (Casos TC-001 y TC-002)
*   **Fórmula de Cobertura ($N/T * 100\%$):** 50%
