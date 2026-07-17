# Reporte de Ejecución: Módulo de Gestión de Proyectos (Project Management)

Este documento contiene los resultados de la ejecución de las pruebas de integración diseñadas y ampliadas para el módulo de **Gestión de Proyectos**.

El objetivo principal fue incrementar la cobertura del módulo hasta alcanzar el umbral mínimo de **85%**, reforzando pruebas sobre controladores, servicios, modelos PostGIS y DTOs relacionados con proyectos.

---

## 1. Alcance de la cobertura

La cobertura se calculó sobre los archivos fuente propios de **Project Management**. Se ejecutaron suites de pruebas de integración y el reporte se filtró para medir exclusivamente los controladores de proyectos, servicios de proyectos, modelos PostGIS y sus respectivos DTOs.

### Resultado general

| Métrica                       | Resultado                                 |
| :---------------------------- | :---------------------------------------- |
| Módulo evaluado               | Project Management (Gestión de Proyectos) |
| Tipo de pruebas               | Integración                               |
| Pruebas ejecutadas            | 208                                       |
| Pruebas exitosas              | 208                                       |
| Pruebas fallidas              | 0                                         |
| Archivos medidos              | 21                                        |
| Líneas ejecutables analizadas | 3126                                      |
| Líneas no cubiertas           | 471                                       |
| Cobertura total               | 85%                                       |

### Cobertura por archivo

| Archivo                                           |    Stmts |    Miss |   Cover |
| :------------------------------------------------ | -------: | ------: | ------: |
| `backend/api/projects/__init__.py`                |        0 |       0 |    100% |
| `backend/api/projects/actions.py`                 |       92 |       7 |     92% |
| `backend/api/projects/activities.py`              |       35 |      12 |     66% |
| `backend/api/projects/campaigns.py`               |       32 |       0 |    100% |
| `backend/api/projects/contributions.py`           |       27 |       6 |     78% |
| `backend/api/projects/favorites.py`               |       26 |       0 |    100% |
| `backend/api/projects/partnerships.py`            |       55 |       3 |     95% |
| `backend/api/projects/resources.py`               |      292 |      83 |     72% |
| `backend/api/projects/statistics.py`              |       18 |       2 |     89% |
| `backend/api/projects/teams.py`                   |       57 |      16 |     72% |
| `backend/models/dtos/project_dto.py`              |      406 |      50 |     88% |
| `backend/models/dtos/project_partner_dto.py`      |       41 |       5 |     88% |
| `backend/models/postgis/priority_area.py`         |       33 |       4 |     88% |
| `backend/models/postgis/project.py`               |      733 |     103 |     86% |
| `backend/models/postgis/project_chat.py`          |       48 |       1 |     98% |
| `backend/models/postgis/project_info.py`          |       85 |      18 |     79% |
| `backend/models/postgis/project_partner.py`       |       75 |       9 |     88% |
| `backend/services/project_admin_service.py`       |      194 |      17 |     91% |
| `backend/services/project_partnership_service.py` |       85 |       6 |     93% |
| `backend/services/project_search_service.py`      |      424 |      28 |     93% |
| `backend/services/project_service.py`             |      368 |     101 |     73% |
| **TOTAL**                                         | **3126** | **471** | **85%** |

---

## 2. Ejecución de pruebas de integración

Se ejecutaron las pruebas de integración correspondientes al módulo empleando el siguiente comando:

```sh
docker compose exec -T tm-backend coverage run -m pytest tests/api/integration/api/projects/ tests/api/integration/models/test_project.py tests/api/integration/models/test_project_clone.py tests/api/integration/models/test_project_chat.py tests/api/integration/services/test_project_service_permissions.py tests/api/integration/services/test_project_admin_service.py tests/api/integration/services/test_project_service.py tests/api/integration/services/test_project_search_service.py tests/api/integration/services/test_featured_projects_services.py -p no:warnings
```

### Resultado de la ejecución

```sh
============================= test session starts ==============================
platform linux -- Python 3.10.20, pytest-8.3.5, pluggy-1.5.0
rootdir: /usr/src/app
configfile: pyproject.toml
plugins: anyio-4.9.0
collected 208 items

tests/api/integration/api/projects/test_actions.py ..................... 
tests/api/integration/api/projects/test_actions_additional.py ...
tests/api/integration/api/projects/test_activities.py ....
tests/api/integration/api/projects/test_campaigns.py ...............
tests/api/integration/api/projects/test_contributions.py ......
tests/api/integration/api/projects/test_favourites.py ..........
tests/api/integration/api/projects/test_partnerships.py ........
tests/api/integration/api/projects/test_resources.py ...................
..............................................................
tests/api/integration/api/projects/test_statistics.py .....
tests/api/integration/api/projects/test_teams.py .........
tests/api/integration/models/test_project.py .......
tests/api/integration/models/test_project_clone.py ..
tests/api/integration/models/test_project_chat.py ...
tests/api/integration/services/test_project_service_permissions.py .
tests/api/integration/services/test_project_admin_service.py ...........
.......
tests/api/integration/services/test_project_service.py ......
tests/api/integration/services/test_project_search_service.py ......
tests/api/integration/services/test_featured_projects_services.py .

======================== 208 passed ========================
```

---

## 3. Reporte de cobertura ejecutado

Para generar el reporte validando exclusivamente las capas operativas del módulo, se ejecutó:

```sh
docker compose exec -T tm-backend coverage report -m --include="backend/api/projects/*.py,backend/services/project_service.py,backend/services/project_admin_service.py,backend/services/project_search_service.py,backend/services/project_partnership_service.py,backend/models/postgis/project.py,backend/models/postgis/project_info.py,backend/models/postgis/project_partner.py,backend/models/postgis/project_chat.py,backend/models/postgis/priority_area.py,backend/models/dtos/project_dto.py,backend/models/dtos/project_partner_dto.py"
```

### Resultado del reporte

```sh
Name                                              Stmts   Miss  Cover   Missing
-------------------------------------------------------------------------------
backend/api/projects/__init__.py                      0      0   100%
backend/api/projects/actions.py                      92      7    92%   79-80, 178-180, 449, 465
backend/api/projects/activities.py                   35     12    66%   58-74, 119-135
backend/api/projects/campaigns.py                    32      0   100%
backend/api/projects/contributions.py                27      6    78%   53-69
backend/api/projects/favorites.py                    26      0   100%
backend/api/projects/partnerships.py                 55      3    95%   143, 230, 298
backend/api/projects/resources.py                   292     83    72%   ...
backend/api/projects/statistics.py                   18      2    89%   30-31
backend/api/projects/teams.py                        57     16    72%   ...
backend/models/dtos/project_dto.py                  406     50    88%   ...
backend/models/dtos/project_partner_dto.py           41      5    88%   10-19
backend/models/postgis/priority_area.py              33      4    88%   37, 40, 57, 76
backend/models/postgis/project.py                   733    103    86%   ...
backend/models/postgis/project_chat.py               48      1    98%   180
backend/models/postgis/project_info.py               85     18    79%   47-50, 136-137, 145-184
backend/models/postgis/project_partner.py            75      9    88%   51, 62, 203-209
backend/services/project_admin_service.py           194     17    91%   ...
backend/services/project_partnership_service.py      85      6    93%   21, 77, 106, 133, 150, 166
backend/services/project_search_service.py          424     28    93%   ...
backend/services/project_service.py                 368    101    73%   ...
-------------------------------------------------------------------------------
TOTAL                                              3126    471    85%
```

---

## 4. Análisis de resultados

El módulo de **Project Management** demuestra una cobertura sólida del **85%**, evaluada sobre una base amplia de código de **3126 líneas ejecutables exclusivas**. Las **208 pruebas superadas exitosamente** comprueban un nivel alto de estabilidad en los flujos principales de gestión de proyectos.

Los archivos con mejor cobertura fueron:

| Archivo                                      | Cobertura | Interpretación                                                                                                |
| :------------------------------------------- | --------: | :------------------------------------------------------------------------------------------------------------ |
| `backend/api/projects/campaigns.py`          |      100% | Los flujos de campañas asociadas a proyectos están totalmente verificados.                                    |
| `backend/api/projects/favorites.py`          |      100% | Las operaciones de favoritos sobre proyectos se encuentran completamente cubiertas.                           |
| `backend/models/postgis/project_chat.py`     |       98% | La creación, sanitización y consulta paginada de mensajes de chat está casi totalmente validada.              |
| `backend/api/projects/partnerships.py`       |       95% | Los flujos de alianzas o partnerships de proyectos presentan una cobertura muy alta.                          |
| `backend/services/project_search_service.py` |       93% | El filtrado y búsqueda avanzada de proyectos tiene una cobertura sólida.                                      |
| `backend/api/projects/actions.py`            |       92% | Las acciones administrativas de proyectos fueron reforzadas mediante nuevos casos de éxito, error y permisos. |
| `backend/services/project_admin_service.py`  |       91% | La lógica administrativa del proyecto presenta alta confiabilidad.                                            |

Los archivos con menor cobertura fueron:

| Archivo                               | Cobertura | Observación                                                                                              |
| :------------------------------------ | --------: | :------------------------------------------------------------------------------------------------------- |
| `backend/api/projects/activities.py`  |       66% | Ciertos flujos de consulta de actividades no se ejercitan completamente.                                 |
| `backend/api/projects/resources.py`   |       72% | Es uno de los controladores más extensos del módulo y conserva ramas HTTP no cubiertas.                  |
| `backend/api/projects/teams.py`       |       72% | Persisten casos borde relacionados con permisos y errores en operaciones de equipos.                     |
| `backend/services/project_service.py` |       73% | Aunque se reforzaron reglas críticas de permisos, todavía existen ramas complejas de negocio pendientes. |

---

## 5. Alcance y nivel de confianza actual

| Dimensión                                 | Alcance                     | Nivel de Confianza | Observaciones                                                                                                |
| :---------------------------------------- | :-------------------------- | :----------------- | :----------------------------------------------------------------------------------------------------------- |
| **Acciones administrativas de proyectos** | 92%                         | **Muy Alto**       | Respaldado por pruebas sobre `feature`, `remove_feature` y `set_interests`.                                  |
| **Búsqueda avanzada de proyectos**        | 93%                         | **Muy Alto**       | El servicio de búsqueda cubre filtros, exportación y escenarios principales de consulta.                     |
| **Partnerships de proyectos**             | 95%                         | **Muy Alto**       | Las alianzas vinculadas a proyectos presentan alta validación.                                               |
| **Chat de proyectos**                     | 98%                         | **Muy Alto**       | La lógica de mensajes, sanitización y paginación está casi completamente cubierta.                           |
| **Clonación de proyectos**                | 86% en `project.py`         | **Alto**           | Se validó la copia de entidades relacionadas y reinicio de atributos del nuevo proyecto.                     |
| **Permisos de mapeo y validación**        | 73% en `project_service.py` | **Medio-Alto**     | Se cubrieron reglas críticas como usuario bloqueado, proyecto no publicado, equipo, nivel y tarea bloqueada. |
| **Endpoints generales de recursos**       | 72% en `resources.py`       | **Medio-Alto**     | Persisten ramas HTTP y casos borde sin ejercitar.                                                            |

---

## 6. Conclusión del Estado Actual

Los resultados comprobados sobre **las capas operativas reales** del backend determinan que el módulo de **Project Management es robusto, presentando una cobertura total del 85% sobre 21 componentes críticos**.

Se ejecutaron **208 pruebas funcionales e integrales** enfocadas en los flujos centrales de gestión de proyectos: acciones administrativas, clonación de proyectos, permisos de mapeo y validación, búsqueda avanzada, partnerships, equipos, favoritos, recursos, estadísticas y mensajería de proyectos.

La mejora más relevante se observó en `backend/api/projects/actions.py`, que alcanzó **92%** de cobertura tras incorporar pruebas para destacar proyectos, remover destacados y actualizar intereses. Asimismo, `backend/models/postgis/project_chat.py` llegó a **98%**, reforzando la confianza sobre la creación, sanitización y consulta de mensajes asociados a proyectos.

**Oportunidades de Mejora:**
Para sobrepasar el umbral de 90% en futuras iteraciones, los esfuerzos deben focalizarse en robustecer las pruebas de integración en `backend/api/projects/resources.py` (72%), `backend/api/projects/activities.py` (66%), `backend/api/projects/teams.py` (72%) y ramas complejas de negocio dentro de `backend/services/project_service.py` (73%).

---

## 7. Ejecución de pruebas post-reestructuración (Fase 2)

Con el fin de incrementar la cobertura hasta el umbral de **85%** en el módulo de Gestión de Proyectos, se incorporaron nuevas suites especializadas y se ampliaron escenarios existentes sobre acciones administrativas, modelos PostGIS y servicios de permisos.

### Nuevas suites incorporadas y contribución

* **`tests/api/integration/models/test_project_clone.py`**: Añadida para cubrir la clonación completa de proyectos. Esta suite permitió validar la copia de información relacionada, equipos, campañas, intereses, editor personalizado, reinicio de contadores y cambio de estado del nuevo proyecto a `DRAFT`.
* **`tests/api/integration/models/test_project_chat.py`**: Añadida para validar la creación de mensajes de chat, sanitización de contenido Markdown/HTML y recuperación paginada de mensajes asociados a proyectos. Contribuyó a elevar `backend/models/postgis/project_chat.py` hasta **98%**.
* **`tests/api/integration/services/test_project_service_permissions.py`**: Añadida para cubrir reglas críticas de permisos de mapeo y validación, incluyendo usuario bloqueado, proyecto en borrador, permisos por equipo, nivel insuficiente, tarea bloqueada y flujo permitido para manager.
* **`tests/api/integration/api/projects/test_actions_additional.py`**: Añadida para aislar flujos administrativos de `actions.py`: destacar proyecto, remover destacado y actualizar intereses. Su contribución elevó `backend/api/projects/actions.py` de **63% a 92%**.
* Se conservaron y ejecutaron las suites existentes de `test_project.py`, `test_project_admin_service.py`, `test_project_service.py`, `test_project_search_service.py`, `test_featured_projects_services.py` y las pruebas de controladores bajo `tests/api/integration/api/projects/`.

### Resultado general actualizado

| Métrica                       | Resultado                                 |
| :---------------------------- | :---------------------------------------- |
| Módulo evaluado               | Project Management (Gestión de Proyectos) |
| Tipo de pruebas               | Integración                               |
| Pruebas ejecutadas            | 208                                       |
| Pruebas exitosas              | 208                                       |
| Pruebas fallidas              | 0                                         |
| Archivos medidos              | 21                                        |
| Líneas ejecutables analizadas | 3126                                      |
| Líneas no cubiertas           | 471                                       |
| Cobertura total               | 85%                                       |

### Cobertura por archivo post-implementación

| Archivo                                           |    Stmts |    Miss |   Cover |
| :------------------------------------------------ | -------: | ------: | ------: |
| `backend/api/projects/__init__.py`                |        0 |       0 |    100% |
| `backend/api/projects/actions.py`                 |       92 |       7 |     92% |
| `backend/api/projects/activities.py`              |       35 |      12 |     66% |
| `backend/api/projects/campaigns.py`               |       32 |       0 |    100% |
| `backend/api/projects/contributions.py`           |       27 |       6 |     78% |
| `backend/api/projects/favorites.py`               |       26 |       0 |    100% |
| `backend/api/projects/partnerships.py`            |       55 |       3 |     95% |
| `backend/api/projects/resources.py`               |      292 |      83 |     72% |
| `backend/api/projects/statistics.py`              |       18 |       2 |     89% |
| `backend/api/projects/teams.py`                   |       57 |      16 |     72% |
| `backend/models/dtos/project_dto.py`              |      406 |      50 |     88% |
| `backend/models/dtos/project_partner_dto.py`      |       41 |       5 |     88% |
| `backend/models/postgis/priority_area.py`         |       33 |       4 |     88% |
| `backend/models/postgis/project.py`               |      733 |     103 |     86% |
| `backend/models/postgis/project_chat.py`          |       48 |       1 |     98% |
| `backend/models/postgis/project_info.py`          |       85 |      18 |     79% |
| `backend/models/postgis/project_partner.py`       |       75 |       9 |     88% |
| `backend/services/project_admin_service.py`       |      194 |      17 |     91% |
| `backend/services/project_partnership_service.py` |       85 |       6 |     93% |
| `backend/services/project_search_service.py`      |      424 |      28 |     93% |
| `backend/services/project_service.py`             |      368 |     101 |     73% |
| **TOTAL**                                         | **3126** | **471** | **85%** |

### Resultado de la ejecución (Log)

```sh
============================= test session starts ==============================
platform linux -- Python 3.10.20, pytest-8.3.5, pluggy-1.5.0
rootdir: /usr/src/app
configfile: pyproject.toml
plugins: anyio-4.9.0
collected 208 items

tests/api/integration/api/projects/test_actions.py .....................
tests/api/integration/api/projects/test_actions_additional.py ...
tests/api/integration/api/projects/test_activities.py ....
tests/api/integration/api/projects/test_campaigns.py ...............
tests/api/integration/api/projects/test_contributions.py ......
tests/api/integration/api/projects/test_favourites.py ..........
tests/api/integration/api/projects/test_partnerships.py ........
tests/api/integration/api/projects/test_resources.py ...................
..............................................................
tests/api/integration/api/projects/test_statistics.py .....
tests/api/integration/api/projects/test_teams.py .........
tests/api/integration/models/test_project.py .......
tests/api/integration/models/test_project_clone.py ..
tests/api/integration/models/test_project_chat.py ...
tests/api/integration/services/test_project_service_permissions.py .
tests/api/integration/services/test_project_admin_service.py ...........
.......
tests/api/integration/services/test_project_service.py ......
tests/api/integration/services/test_project_search_service.py ......
tests/api/integration/services/test_featured_projects_services.py .

======================== 208 passed ========================
```

### Reporte de cobertura (Log)

```sh
Name                                              Stmts   Miss  Cover   Missing
-------------------------------------------------------------------------------
backend/api/projects/__init__.py                      0      0   100%
backend/api/projects/actions.py                      92      7    92%   79-80, 178-180, 449, 465
backend/api/projects/activities.py                   35     12    66%   58-74, 119-135
backend/api/projects/campaigns.py                    32      0   100%
backend/api/projects/contributions.py                27      6    78%   53-69
backend/api/projects/favorites.py                    26      0   100%
backend/api/projects/partnerships.py                 55      3    95%   143, 230, 298
backend/api/projects/resources.py                   292     83    72%   ...
backend/api/projects/statistics.py                   18      2    89%   30-31
backend/api/projects/teams.py                        57     16    72%   ...
backend/models/dtos/project_dto.py                  406     50    88%   ...
backend/models/dtos/project_partner_dto.py           41      5    88%   10-19
backend/models/postgis/priority_area.py              33      4    88%   37, 40, 57, 76
backend/models/postgis/project.py                   733    103    86%   ...
backend/models/postgis/project_chat.py               48      1    98%   180
backend/models/postgis/project_info.py               85     18    79%   47-50, 136-137, 145-184
backend/models/postgis/project_partner.py            75      9    88%   51, 62, 203-209
backend/services/project_admin_service.py           194     17    91%   ...
backend/services/project_partnership_service.py      85      6    93%   21, 77, 106, 133, 150, 166
backend/services/project_search_service.py          424     28    93%   ...
backend/services/project_service.py                 368    101    73%   ...
-------------------------------------------------------------------------------
TOTAL                                              3126    471    85%
```

### Análisis Final

Con la incorporación de las nuevas pruebas de integración se logró alcanzar el objetivo de cobertura del módulo, elevando el total hasta **85%**. La mejora se obtuvo sin modificar la lógica de negocio del backend, sino ampliando únicamente la base de pruebas.

El avance más significativo se produjo en `backend/api/projects/actions.py`, que aumentó de **63% a 92%** al cubrir flujos de permisos, éxito y errores en acciones administrativas. Además, `backend/models/postgis/project_chat.py` alcanzó **98%**, fortaleciendo la confianza sobre el manejo de mensajes asociados a proyectos.

El módulo queda con un nivel de confianza alto en sus funcionalidades principales: gestión administrativa, clonación, búsqueda, permisos, partnerships y chat. Las oportunidades futuras se concentran en `resources.py`, `activities.py`, `teams.py` y ramas complejas de `project_service.py`.
