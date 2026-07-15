# Diseño de Pruebas de Integración: Módulo de Tareas, Mapeo y Validación

## 1. Criterios de Selección y Módulo

Para que una prueba de integración sea diseñada para el módulo **Mapping & Validation**, debe validar al menos una de las siguientes condiciones lógicas:

| Condición a Validar | Descripción Técnica |
| :--- | :--- |
| **Manipulación de Estado** | Transición de estados de la entidad `Task` (READY, MAPPED, VALIDATED, BADIMAGERY, etc.). |
| **Lógica Espacial (GIS)** | Subdivisión geométrica (*splitting*) y recálculo de áreas de las tareas. |
| **Gestión de Bloqueos (Locks)** | Asignación y liberación concurrente de tareas a usuarios, evitando condiciones de carrera. |
| **Exposición Cartográfica** | Interacción con metadatos y exportaciones de formatos GIS (XML/GPX). |
| **Trazabilidad** | Generación de históricos inmutables de acciones (`TaskHistory`). |

---

## 2. Interfaces a Integrar

Las pruebas diseñadas para este módulo evalúan la correcta comunicación técnica y de negocio a través de múltiples capas. Las interacciones principales son:

| Capa de Origen | Capa de Destino | Propósito de la Integración |
| :--- | :--- | :--- |
| **API Gateway** (FastAPI) | **Servicios de Tareas** (`MappingService`, etc.) | Validación de DTOs HTTP y enrutamiento hacia la lógica de dominio. |
| **Servicios de Tareas** | **Modelos ORM** (`Task`, `TaskHistory`) | Traducción de reglas de negocio a estructuras y relaciones de SQLAlchemy. |
| **Modelos ORM** | **Motor de Base de Datos** (PostGIS) | Ejecución de queries SQL y manipulación de tipos geométricos espaciales. |
| **Capa de Servicios** | **Sistemas Externos / Parsers** | Generación de XML estructurado y compatible con el estándar de JOSM. |

---

## 3. Dependencias y Simulaciones (Mocks)

Para aislar las pruebas y prevenir falsos negativos por fallos de infraestructura externa, se definen las siguientes estrategias de aislamiento:

| Dependencia | Naturaleza | Estrategia de Simulación en el Entorno de Pruebas |
| :--- | :--- | :--- |
| **Autenticación OSM** | Externa (Red) | **Simulada (Mocked).** Se inyecta un token válido o un usuario de prueba directamente en el entorno efímero para omitir el flujo OAuth. |
| **PostGIS (GIS)** | Interna (Persistencia) | **No simulada (Real).** Es obligatorio usar una instancia real de PostgreSQL/PostGIS para garantizar que el *clipping* de polígonos funcione. |
| **Notificaciones** | Interna (Eventos) | **Simulada (Mocked).** Se interceptan los eventos al *bus* interno para evitar tiempos de espera de red, validando únicamente la emisión de la orden. |

---

## 4. Condiciones y Escenarios de Prueba

A continuación se detallan los escenarios lógicos base de integración a validar. Cada escenario ha sido diseñado para estresar la comunicación entre las capas del sistema.

### INT-MAP-01: Bloqueo Exitoso de Tarea para Mapeo

| Componente | Especificación del Escenario |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Base de Datos (ORM + SQL) |
| **Precondición** | Proyecto publicado y tarea en estado `READY`. Usuario `MAPPER` autenticado. |
| **Entrada (Input)** | Petición `POST` a `/lock-for-mapping/{task_id}` enviando el token de sesión. |
| **Criterios de Éxito** | **1.** La API responde `HTTP 200 OK`.<br>**2.** El estado de la tarea en PostGIS cambia a `LOCKED_FOR_MAPPING`.<br>**3.** Se inserta un nuevo registro de auditoría en la tabla `task_history`. |

### INT-MAP-02: Bloqueo Concurrente (Race Condition)

| Componente | Especificación del Escenario |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Transaccionalidad de Base de Datos |
| **Precondición** | Tarea ya encuentra en estado `LOCKED_FOR_MAPPING` por el usuario A. |
| **Entrada (Input)** | Petición `POST` a `/lock-for-mapping/{task_id}` iniciada por el usuario B. |
| **Criterios de Éxito** | **1.** La API responde `HTTP 409 Conflict` o `HTTP 403 Forbidden`.<br>**2.** El estado y usuario asignado originalmente se preservan intactos en PostGIS.<br>**3.** No se registran eventos anómalos en el historial de la tarea. |

### INT-MAP-03: Subdivisión de Tareas (Split)

| Componente | Especificación del Escenario |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `SplitService` ➔ Motor Espacial PostGIS |
| **Precondición** | Tarea activa con polígono geométrico válido y área suficientemente extensa. |
| **Entrada (Input)** | Petición `POST` a `/split/{task_id}`. |
| **Criterios de Éxito** | **1.** La API responde `HTTP 200 OK`.<br>**2.** La tarea original (padre) es inhabilitada en el sistema.<br>**3.** PostGIS registra 4 nuevas tareas (hijas) con geometrías válidas (SRID 4326), cuya área sumada es igual al polígono original. |

### INT-MAP-04: Exportación Estructural JOSM (XML)

| Componente | Especificación del Escenario |
| :--- | :--- |
| **Interfaces Evaluadas** | HTTP Endpoint ➔ `MappingService` ➔ Exportador/Serializador XML |
| **Precondición** | Tarea correctamente delimitada geográficamente en Base de Datos. |
| **Entrada (Input)** | Petición `GET` solicitando los recursos en formato XML. |
| **Criterios de Éxito** | **1.** El servidor responde con el header `Content-Type: application/xml`.<br>**2.** El XML generado cumple la validación estructural requerida por JOSM.<br>**3.** El atributo *Bounds* del XML coincide con la geometría de PostGIS. |

---

## 5. Requisitos de Cobertura y Nivel de Confianza Objetivo

El diseño de las pruebas de integración para este módulo persigue las siguientes métricas de calidad técnica:

> **Objetivo de Cobertura de Sentencias:** Mayor o igual a **85%** de cobertura cruzada. Este porcentaje debe englobar las rutas HTTP en los controladores (`api/tasks/`) interactuando simultáneamente con los Servicios de Negocio correspondientes (`mapping_service.py`, `validator_service.py`, `split_service.py`).

| Operación de Negocio | Nivel de Confianza Exigido | Justificación del Riesgo |
| :--- | :--- | :--- |
| **Operaciones Geométricas (`SplitService`)** | **Extremo (100%)** | Un fallo algorítmico de clipping corrompería de forma permanente e irrecuperable la topología cartográfica en la Base de Datos. |
| **Lógica Transaccional (Locks / Estados)** | **Muy Alto (>90%)** | Fundamental para prevenir colisiones, como la asignación cruzada de múltiples mapeadores sobre el mismo territorio al mismo tiempo. |
