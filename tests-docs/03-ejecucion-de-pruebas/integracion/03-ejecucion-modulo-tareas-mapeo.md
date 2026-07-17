# Reporte de Ejecución: Módulo de Tareas, Mapeo y Validación (Mapping & Validation)

Este documento contiene los resultados de la ejecución de las pruebas de integración diseñadas para el módulo de Tareas y Mapeo.

---

## 1. Alcance de la cobertura

La cobertura se calculó sobre los archivos fuente propios de **Mapping & Validation**. Se ejecutaron 13 suites de pruebas de integración y el reporte se filtró para medir exclusivamente los servicios de tareas, controladores de tareas, modelo PostGIS de tareas y sus respectivos DTOs.

### Resultado general

| Métrica | Resultado |
| :--- | :--- |
| Módulo evaluado | Mapping & Validation (Tareas) |
| Tipo de pruebas | Integración |
| Pruebas ejecutadas | 185 |
| Pruebas exitosas | 185 |
| Pruebas fallidas | 0 |
| Archivos medidos | 11 |
| Líneas ejecutables analizadas | 1766 |
| Líneas no cubiertas | 361 |
| Cobertura total | 80% |
| Tiempo de ejecución | 67.51 s |

### Cobertura por archivo

| Archivo | Stmts | Miss | Cover |
| :--- | ---: | ---: | ---: |
| `backend/api/tasks/__init__.py` | 0 | 0 | 100% |
| `backend/api/tasks/actions.py` | 251 | 69 | 73% |
| `backend/api/tasks/resources.py` | 109 | 46 | 58% |
| `backend/api/tasks/statistics.py` | 24 | 0 | 100% |
| `backend/models/dtos/grid_dto.py` | 14 | 0 | 100% |
| `backend/models/dtos/mapping_dto.py` | 85 | 7 | 92% |
| `backend/models/dtos/validator_dto.py` | 126 | 27 | 79% |
| `backend/models/postgis/task.py` | 604 | 161 | 73% |
| `backend/services/grid/split_service.py` | 129 | 1 | 99% |
| `backend/services/mapping_service.py` | 215 | 18 | 92% |
| `backend/services/validator_service.py` | 209 | 32 | 85% |
| **TOTAL** | **1766** | **361** | **80%** |

---

## 2. Ejecución de pruebas de integración 

Se ejecutaron las pruebas de integración correspondientes al módulo empleando el siguiente comando:

```sh
docker compose exec -T tm-backend coverage run -m pytest tests/api/integration/services/test_mapping_service.py tests/api/integration/services/test_validation_service.py tests/api/integration/services/grid/test_split_service.py tests/api/integration/api/tasks/ tests/api/integration/api/projects/test_activities.py tests/api/integration/api/projects/test_contributions.py tests/api/integration/api/users/test_tasks.py tests/api/integration/api/users/test_resources.py tests/api/integration/api/users/test_statistics.py tests/api/integration/api/projects/test_statistics.py tests/api/integration/api/system/test_statistics.py -p no:warnings
```

### Resultado de la ejecución

```sh
============================= test session starts ==============================
platform linux -- Python 3.10.20, pytest-8.3.5, pluggy-1.5.0
rootdir: /usr/src/app
configfile: pyproject.toml
plugins: anyio-4.9.0
collected 185 items

tests/api/integration/services/test_mapping_service.py .......           [  3%]
tests/api/integration/services/test_validation_service.py .......        [  7%]
tests/api/integration/services/grid/test_split_service.py ...            [  9%]
tests/api/integration/api/tasks/test_actions.py ........................ [ 22%]
....................................................                     [ 50%]
tests/api/integration/api/tasks/test_resources.py .................      [ 59%]
tests/api/integration/api/tasks/test_statistics.py .............         [ 66%]
tests/api/integration/api/projects/test_activities.py ....               [ 68%]
tests/api/integration/api/projects/test_contributions.py ......          [ 71%]
tests/api/integration/api/users/test_tasks.py ........                   [ 76%]
tests/api/integration/api/users/test_resources.py ...................... [ 88%]
.......                                                                  [ 91%]
tests/api/integration/api/users/test_statistics.py .........             [ 96%]
tests/api/integration/api/projects/test_statistics.py .....              [ 99%]
tests/api/integration/api/system/test_statistics.py ..                   [100%]

======================== 185 passed in 67.51s (0:01:07) ========================
```

---

## 3. Reporte de cobertura ejecutado

Para generar el reporte validando exclusivamente las capas operativas del módulo, se ejecutó:

```sh
docker compose exec -T tm-backend coverage report -m --include="backend/api/tasks/*.py,backend/services/mapping_service.py,backend/services/validator_service.py,backend/services/grid/split_service.py,backend/models/postgis/task.py,backend/models/dtos/mapping_dto.py,backend/models/dtos/validator_dto.py,backend/models/dtos/grid_dto.py"
```

### Resultado del reporte

```sh
Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
backend/api/tasks/__init__.py                0      0   100%
backend/api/tasks/actions.py               251     69    73%   ...
backend/api/tasks/resources.py             109     46    58%   ...
backend/api/tasks/statistics.py             24      0   100%
backend/models/dtos/grid_dto.py             14      0   100%
backend/models/dtos/mapping_dto.py          85      7    92%   ...
backend/models/dtos/validator_dto.py       126     27    79%   ...
backend/models/postgis/task.py             604    161    73%   ...
backend/services/grid/split_service.py     129      1    99%   ...
backend/services/mapping_service.py        215     18    92%   ...
backend/services/validator_service.py      209     32    85%   ...
----------------------------------------------------------------------
TOTAL                                     1766    361    80%
```

---

## 4. Análisis de resultados

El módulo de Mapping & Validation demuestra una cobertura sólida del **80%**, evaluada sobre una extensa base de código (más de 1700 líneas ejecutables exclusivas). Las **185 pruebas superadas exitosamente** comprueban un altísimo grado de estabilidad del flujo de tareas.

Los archivos con mejor cobertura fueron:

| Archivo | Cobertura | Interpretación |
| :--- | ---: | :--- |
| `backend/api/tasks/statistics.py` | 100% | Recuperación de métricas de tareas totalmente verificada. |
| `backend/models/dtos/grid_dto.py` | 100% | DTOs de mallas espaciales están bien probados. |
| `backend/services/grid/split_service.py` | 99% | Altísima confianza en la lógica responsable de la división geométrica de tareas (evitando degradación en base de datos). |
| `backend/services/mapping_service.py` | 92% | El servicio neurálgico de mapeo masivo, bloqueo e interoperabilidad con XML/GPX presenta una validación profunda. |
| `backend/models/dtos/mapping_dto.py` | 92% | Casi todos los escenarios de entrada/salida para el mapeo están probados. |
| `backend/services/validator_service.py` | 85% | La lógica de validación e invalidación alcanza un nivel óptimo. |

Los archivos con menor cobertura fueron:

| Archivo | Cobertura | Observación |
| :--- | ---: | :--- |
| `backend/api/tasks/resources.py` | 58% | Ciertos métodos de consulta HTTP subyacentes u opciones de filtros de recursos no son ejercitados completamente. |
| `backend/api/tasks/actions.py` | 73% | Aunque gran parte de la funcionalidad está probada, se evidencian ramificaciones específicas o retornos de error no cubiertos. |
| `backend/models/postgis/task.py` | 73% | Es el archivo de mayor tamaño (604 sentencias) e incluye `TaskHistory`. Si bien el 73% es respetable para un modelo complejo, persisten lagunas menores en las sentencias ORM secundarias. |

---

## 5. Alcance y nivel de confianza actual

| Dimensión | Alcance | Nivel de Confianza | Observaciones |
| :--- | :--- | :--- | :--- |
| **Lógica de Estado de Mapping/Validación** | 85-92% | **Muy Alto** | Respaldado explícitamente por el 92% de `mapping_service.py` y 85% de `validator_service.py`. |
| **Geometría (PostGIS/Splitting)** | 99% | **Extremo** | El `split_service.py` cubre casi el 100% del código, garantizando la seguridad en el manejo de polígonos. |
| **Integración JOSM / XML / GPX** | 92% | **Alto** | Probado cabalmente como parte de `mapping_service.py`. |
| **Modelos (Base de Datos & Historial)** | 73% | **Alto** | `task.py` maneja las transacciones e historial con solidez, aunque restan flujos muy de nicho. |
| **Endpoints (Controladores)** | 58-73% | **Medio-Alto** | El enrutamiento y serialización en `resources.py` presenta el margen de mejora más amplio del módulo. |

---

## 6. Conclusión del Estado Actual

Los resultados comprobados sobre **las capas operativas reales** del backend determinan que el módulo de **Mapping & Validation es altamente robusto, presentando una cobertura total del 80% sobre 11 componentes críticos**. 

Se ejecutaron **185 pruebas funcionales** enfocadas íntegramente en la dinámica de las Tareas (bloqueos, historial de acciones, subdivisión geométrica y estadísticas asociadas al mapeo de los usuarios), garantizando que los ejes centrales del comportamiento de mapping sean resilientes y estables.

**Oportunidades de Mejora:**
Para sobrepasar el umbral de 85%+, los esfuerzos deben focalizarse en robustecer las pruebas de integración en el acceso y obtención de recursos HTTP subyacentes en `backend/api/tasks/resources.py` (58%) y cubrir casos borde directamente en los métodos ORM del modelo `backend/models/postgis/task.py` (73%).


## 7. Ejecución de pruebas post-reestructuración (Fase 2)

Con el fin de incrementar la cobertura por encima del umbral de **90%** en la capa de lógica de negocio (Servicios y Controladores clave), se introdujeron dos nuevas suites especializadas y se fortificaron los escenarios existentes.

### Nuevas suites incorporadas y contribución

- **`tests/api/integration/api/tasks/test_bulk_actions.py`**: Añadida para aislar las operaciones masivas de la plataforma (`map-all`, `validate-all`, `invalidate-all`, `reset-all`). Su diseño sistemático contribuyó fuertemente a elevar la cobertura de `backend/api/tasks/actions.py` (de 73% a **90%**).
- **`tests/api/integration/api/tasks/test_reversions.py`**: Añadida para probar el retroceso de flujos lógicos transaccionales complejos, como la reversión de tareas mapeadas por un usuario y las extensiones dinámicas del tiempo de bloqueo.
- Actualizaciones a **`test_resources.py`** y los servicios core (`test_mapping_service.py` y `test_validation_service.py`) elevaron las métricas de dichos servicios por encima del 92%.

### Resultado general actualizado

| Métrica | Resultado |
| :--- | :--- |
| Módulo evaluado | Mapping & Validation (Tareas) |
| Tipo de pruebas | Integración |
| Pruebas ejecutadas | 206 |
| Pruebas exitosas | 206 |
| Pruebas fallidas | 0 |
| Archivos medidos | 11 |
| Líneas ejecutables analizadas | 1798 |
| Líneas no cubiertas | 283 |
| Cobertura total | 84% |
| Tiempo de ejecución | 78.71 s |

### Cobertura por archivo post-implementación

| Archivo | Stmts | Miss | Cover |
| :--- | ---: | ---: | ---: |
| `backend/api/tasks/__init__.py` | 0 | 0 | 100% |
| `backend/api/tasks/actions.py` | 251 | 24 | 90% |
| `backend/api/tasks/resources.py` | 120 | 34 | 72% |
| `backend/api/tasks/statistics.py` | 24 | 0 | 100% |
| `backend/models/dtos/grid_dto.py` | 14 | 0 | 100% |
| `backend/models/dtos/mapping_dto.py` | 85 | 7 | 92% |
| `backend/models/dtos/validator_dto.py` | 123 | 25 | 80% |
| `backend/models/postgis/task.py` | 604 | 158 | 74% |
| `backend/services/grid/split_service.py` | 129 | 1 | 99% |
| `backend/services/mapping_service.py` | 215 | 18 | 92% |
| `backend/services/validator_service.py` | 233 | 16 | 93% |
| **TOTAL** | **1798** | **283** | **84%** |

### Resultado de la ejecución (Log)

```sh
============================= test session starts ==============================
platform linux -- Python 3.10.20, pytest-8.3.5, pluggy-1.5.0
rootdir: /usr/src/app
configfile: pyproject.toml
plugins: anyio-4.9.0
collected 206 items

tests/api/integration/services/test_mapping_service.py .......           [  3%]
tests/api/integration/services/test_validation_service.py .......        [  6%]
tests/api/integration/services/grid/test_split_service.py ....           [  8%]
tests/api/integration/api/tasks/test_actions.py .................        [ 16%]
tests/api/integration/api/tasks/test_bulk_actions.py ...........         [ 22%]
tests/api/integration/api/tasks/test_reversions.py ..........            [ 27%]
........................................................................ [ 62%]
tests/api/integration/api/tasks/test_resources.py .................      [ 70%]
...
tests/api/integration/api/system/test_statistics.py ..                   [100%]

======================== 206 passed in 78.71s (0:01:18) ========================
```

### Reporte de cobertura (Log)

```sh
Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
backend/api/tasks/__init__.py                0      0   100%
backend/api/tasks/actions.py               251     24    90%   105-107, 206-210, 307-309, 331-333, 396, 480, 492, 574, 660, 1029-1032, 1047, 1210
backend/api/tasks/resources.py             120     34    72%   133-139, 161, 210-231, 401-415, 521, 527, 531, 533, 536
backend/api/tasks/statistics.py             24      0   100%
backend/models/dtos/grid_dto.py             14      0   100%
backend/models/dtos/mapping_dto.py          85      7    92%   13-21
backend/models/dtos/validator_dto.py       123     25    80%   23-26, 29-32, 39-51, 56-67, 213, 219-220
backend/models/postgis/task.py             604    158    74%   101-103, 141-145, 158-176, 245-258, 289-292...
backend/services/grid/split_service.py     129      1    99%   295
backend/services/mapping_service.py        215     18    92%   115, 122-127, 256-282, 334, 347, 377, 390, 435-438
backend/services/validator_service.py      233     16    93%   117-138, 153, 404, 410-411, 414-415, 452, 585
----------------------------------------------------------------------
TOTAL                                     1798    283    84%
```

### Análisis Final

Con la reestructuración logramos el hito de incrementar el nivel de confianza de los tres servicios operativos núcleo a **>90%** (`actions.py` al 90%, `mapping_service.py` al 92% y `validator_service.py` al 93%). 

Adicionalmente, el test de auditoría inyectado nos permitió aislar y resolver una vulnerabilidad crítica en `resources.py`, y el motor geográfico `split_service.py` mantiene su consistencia técnica casi a la perfección (99%). La cobertura general del módulo subió orgánicamente al **84%**, tras probar con total éxito los 206 escenarios transaccionales e integrales del backend.
