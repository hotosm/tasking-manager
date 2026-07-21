# Diseño de Pruebas de Integración: Módulo de Tareas, Mapeo y Validación

## 1. Criterios de Selección y Alcance del Módulo

El diseño de las pruebas de integración correspondientes al módulo de **Mapeo y Validación** se fundamenta en la validación de, al menos, una de las siguientes condiciones lógicas críticas para el negocio:

| Condición Lógica | Descripción Técnica |
| :--- | :--- |
| **Manipulación de Estado** | Verificación de la correcta transición de estados de la entidad `Task` (e.g., de `READY` a `MAPPED`, `VALIDATED` o `BADIMAGERY`). |
| **Lógica Espacial (GIS)** | Comprobación de la precisión en la subdivisión geométrica (*splitting*) y el recálculo dinámico de las áreas de las tareas. |
| **Gestión de Bloqueos Concurrentes** | Validación de los mecanismos de asignación y liberación concurrente de tareas, garantizando la ausencia de condiciones de carrera (*race conditions*). |
| **Exposición Cartográfica** | Confirmación de la correcta integración con metadatos y la exportación fidedigna a formatos GIS estándar (XML/GPX). |
| **Auditoría y Trazabilidad** | Aserción sobre la inmutabilidad y correcta generación de los registros históricos de acciones sobre las tareas (`TaskHistory`). |
| **Operaciones Masivas y Reversión** | Validación de la integridad transaccional durante la modificación en bloque de múltiples tareas y el retroceso (rollback) controlado de operaciones. |

---

## 2. Integración de Interfaces y Flujo de Datos

Las pruebas diseñadas para este módulo aseguran la integridad en la comunicación a través de las múltiples capas arquitectónicas del sistema. Las interacciones principales sujetas a verificación son:

| Capa de Origen | Capa de Destino | Propósito de la Integración |
| :--- | :--- | :--- |
| **API Gateway** (FastAPI) | **Capa de Servicios** (`MappingService`, etc.) | Validación de la correcta interpretación de los DTOs entrantes y el enrutamiento adecuado hacia la lógica de dominio. |
| **Capa de Servicios** | **Modelos ORM** (`Task`, `TaskHistory`) | Traducción fidedigna de las reglas de negocio en estructuras de datos y relaciones gestionadas por SQLAlchemy. |
| **Modelos ORM** | **Motor Base de Datos** (PostGIS) | Ejecución precisa de las consultas SQL y manipulación adecuada de los tipos de datos geométricos espaciales. |
| **Capa de Servicios** | **Sistemas Externos** (Parsers JOSM) | Generación de documentos XML estructurados de acuerdo con los estándares esperados por herramientas de mapeo externas. |

---

## 3. Estrategia de Dependencias y Simulaciones (Mocks)

Para garantizar el aislamiento de las pruebas de integración y prevenir falsos negativos derivados de fallos en la infraestructura externa, se ha definido la siguiente estrategia de simulación:

| Dependencia Estructural | Clasificación | Estrategia de Aislamiento en Pruebas |
| :--- | :--- | :--- |
| **Autenticación OSM** | Externa (Red) | **Simulada (Mocked).** Se inyecta un token válido o un usuario de prueba en el entorno efímero, omitiendo el flujo OAuth real para evitar latencias de red. |
| **PostGIS (GIS)** | Interna (Persistencia) | **No simulada (Real).** Es estrictamente obligatorio el uso de una instancia real de PostgreSQL con la extensión PostGIS para asegurar la validez matemática del *clipping* de polígonos. |
| **Servicio de Notificaciones** | Interna (Eventos) | **Simulada (Mocked).** Se interceptan los eventos emitidos hacia el *bus* interno, validando la emisión de la orden sin incurrir en esperas asíncronas de red. |

---

## 4. Escenarios y Condiciones de Integración

Se han modelado los siguientes escenarios lógicos de integración. Cada escenario somete a estrés a la cadena de comunicación entre las capas del sistema.

### INT-MAP-01: Bloqueo Transaccional Exitoso
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Base de Datos (ORM + SQL) |
| **Precondiciones** | Proyecto publicado; tarea en estado `READY`; usuario con rol `MAPPER` autenticado. |
| **Entrada Requerida** | Petición `POST` a `/lock-for-mapping/{task_id}` con token de sesión válido. |
| **Criterios de Aceptación** | **1.** Respuesta HTTP 200 OK.<br>**2.** Transición de estado a `LOCKED_FOR_MAPPING` confirmada en PostGIS.<br>**3.** Registro de auditoría correctamente insertado en `task_history`. |

### INT-MAP-02: Gestión de Concurrencia (Race Condition)
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Transaccionalidad de Base de Datos |
| **Precondiciones** | Tarea previamente bloqueada (estado `LOCKED_FOR_MAPPING`) por el Usuario A. |
| **Entrada Requerida** | Petición concurrente `POST` a `/lock-for-mapping/{task_id}` originada por el Usuario B. |
| **Criterios de Aceptación** | **1.** Respuesta de rechazo (HTTP 409 Conflict o 403 Forbidden).<br>**2.** Preservación del estado y asignación original en la base de datos.<br>**3.** Ausencia de anomalías en el historial de transacciones de la tarea. |

### INT-MAP-03: Subdivisión de Geometrías (Split)
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `SplitService` ➔ Motor Espacial PostGIS |
| **Precondiciones** | Tarea activa con un polígono geométrico que supera el umbral de área definido. |
| **Entrada Requerida** | Petición `POST` a `/split/{task_id}`. |
| **Criterios de Aceptación** | **1.** Respuesta HTTP 200 OK.<br>**2.** Inhabilitación de la tarea matriz original.<br>**3.** Creación en PostGIS de 4 nuevas tareas derivadas, con geometrías SRID 4326 cuya sumatoria de áreas equivale con exactitud al polígono de la tarea matriz. |

### INT-MAP-04: Exportación de Interfaz Externa JOSM (XML)
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Serializador XML |
| **Precondiciones** | Tarea con delimitación geográfica consolidada en la Base de Datos. |
| **Entrada Requerida** | Petición `GET` solicitando los recursos cartográficos en formato XML. |
| **Criterios de Aceptación** | **1.** Respuesta con cabecera `Content-Type: application/xml`.<br>**2.** Cumplimiento estricto del esquema de validación XML requerido por JOSM.<br>**3.** Concordancia exacta entre el atributo *Bounds* del XML y la geometría original de PostGIS. |

### INT-MAP-05: Ejecución de Operaciones Masivas (Bulk Actions)
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint (`actions.py`) ➔ `ValidatorService` / `MappingService` ➔ Base de Datos |
| **Precondiciones** | Proyecto publicado con múltiples tareas en estados transicionales. Usuario autenticado con privilegios de Administración o Gestión de Proyectos (PM). |
| **Entrada Requerida** | Peticiones HTTP a los endpoints masivos (`map-all`, `validate-all`, `reset-all`). |
| **Criterios de Aceptación** | **1.** Verificación estricta de permisos administrativos.<br>**2.** Mutación masiva exitosa del estado de todas las tareas elegibles.<br>**3.** Sincronización precisa de los contadores estadísticos maestros del proyecto. |

### INT-MAP-06: Mecanismos de Reversión y Control Temporal
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint (`actions.py`) ➔ `ValidatorService` / `MappingService` ➔ Base de Datos |
| **Precondiciones** | Existencia de tareas en estado de revisión, marcadas con imágenes defectuosas (`BADIMAGERY`), o con bloqueos próximos a caducar. |
| **Entrada Requerida** | Peticiones HTTP para la extensión de bloqueos (`extend-lock-time`) o solicitudes administrativas de reversión de asignaciones de un usuario en particular (`revert-user-tasks`). |
| **Criterios de Aceptación** | **1.** Para reversiones por calidad, retorno íntegro de las tareas al estado `READY`.<br>**2.** Para extensiones de tiempo, ampliación exitosa del margen transaccional garantizando la persistencia del bloqueo original sin interrupciones. |

### INT-MAP-07: Consultas de Auditoría e Historial Protegido
| Atributo | Especificación Técnica |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint (`resources.py`) ➔ `ValidatorService` ➔ SQLAlchemy |
| **Precondiciones** | Historial poblado de tareas mapeadas por un usuario y consecuentemente invalidadas por validadores. |
| **Entrada Requerida** | Petición HTTP a `/queries/own/invalidated/` con provisión de cabecera `Authorization`. |
| **Criterios de Aceptación** | **1.** Validación de identidad del token contra el usuario solicitado, emitiendo HTTP 401/403 en caso de discrepancia (protección de privacidad).<br>**2.** Ensamblaje correcto de la paginación y cruce de datos históricos retornando un DTO estructuralmente coherente. |

---

## 5. Diseño y Arquitectura de las Suites de Integración

Con el objetivo de preservar una alta cohesión y facilitar el mantenimiento continuo, los escenarios descritos se han segmentado lógicamente en las siguientes suites de pruebas:

| Suite de Pruebas de Integración | Propósito Principal | Justificación Técnica de su Aislamiento |
| :--- | :--- | :--- |
| **`tests/api/integration/api/tasks/test_bulk_actions.py`** | Comprobación de endpoints administrativos que operan de forma masiva sobre colecciones de tareas. | Previene la contaminación y saturación de los tests transaccionales estándar, garantizando que las modificaciones estructurales masivas mantengan la integridad referencial del sistema (Cubre INT-MAP-05). |
| **`tests/api/integration/api/tasks/test_reversions.py`** | Validación de los flujos de retroceso, deshacer transacciones y gestión del ciclo de vida de los bloqueos temporales. | Los flujos de retroceso exigen la construcción de precondiciones de base de datos sumamente complejas. Su aislamiento reduce la fragilidad de las pruebas y simplifica su depuración (Cubre INT-MAP-06). |
| **`tests/api/integration/api/tasks/test_resources.py`** | Aserción del comportamiento de consultas (Queries), exposición de datos históricos y validación de políticas de seguridad perimetral. | Asegura la resiliencia del sistema ante vulnerabilidades de exposición de datos (ej. manipulación de tokens), comprobando el comportamiento esperado ante errores de autorización (Cubre INT-MAP-07). |
| **`tests/api/integration/services/test_mapping_service.py`** | Validación pura de la lógica de dominio y transiciones de estado, prescindiendo del ruido inducido por la capa de transporte HTTP. | Permite alcanzar un alto grado de cobertura sobre las reglas de negocio núcleo, validando casos de borde como excepciones de permisos cruzados y retrocesos anómalos de estado. |

---

## 6. Métricas de Cobertura y Niveles de Riesgo Aceptable

El diseño de las pruebas para este módulo se ha regido por estándares rigurosos de calidad de software. Se establece el siguiente objetivo de cobertura, respaldado por la criticidad de los componentes evaluados:

> **Objetivo de Cobertura de Sentencias:** Mayor o igual al **90%** en la capa de servicios principales y controladores. Esta métrica se certifica empíricamente sobre la implementación de `mapping_service.py`, `validator_service.py` y los endpoints del dominio (`actions.py` y `resources.py`).

| Operación / Lógica de Negocio | Nivel de Confianza Exigido | Justificación del Riesgo Asumido |
| :--- | :--- | :--- |
| **Operaciones Geométricas (`SplitService`)** | **Extremo (100%)** | Un fallo algorítmico en la subdivisión espacial provocaría una corrupción permanente de la topología cartográfica almacenada. |
| **Operaciones Masivas (Bulk Actions)** | **Muy Alto (>90%)** | Dado su impacto sistémico, una falla inadvertida en este componente posee el potencial de invalidar miles de aportes comunitarios simultáneamente. |
| **Lógica Transaccional (Locks / Estados)** | **Muy Alto (>90%)** | La precisión en los bloqueos es el mecanismo primario para evitar colisiones operativas y superposición de trabajos concurrentes sobre un mismo polígono territorial. |
