# Diseño de Pruebas de Seguridad
**Proyecto:** HOT OSM Tasking Manager
**Versión del Documento:** 1.0
**Estándares de Referencia:** IEEE 829, OWASP Top 10

---

## 1. Introducción
El presente diseño estipula las pruebas de seguridad ofensiva y defensiva enfocadas en proteger la integridad del backend (FastAPI), la base de datos (PostGIS) y los flujos de autorización.

## 2. Vectores de Ataque Específicos (Mapeo OWASP)

| Riesgo OWASP | Vector de Ataque Identificado en la Arquitectura | Componente Afectado |
| :--- | :--- | :--- |
| **A01:2021-Broken Access Control** | Manipulación de IDs (BOLA - Broken Object Level Authorization) para modificar tareas de proyectos no asignados. | FastAPI (Endpoints `/api/v2/tasks/`) |
| **A03:2021-Injection** | Inyección SQL mediante el paso de polígonos GeoJSON malformados hacia las funciones de PostGIS/GeoAlchemy2. | Base de Datos (PostGIS) |
| **A05:2021-Security Misconfiguration** | Exposición de variables críticas en el archivo `tasking-manager.env` o puertos locales (ej. el puerto `:5678` de debug). | Infraestructura (Docker) |
| **A07:2021-Identification and Authentication Failures** | Reutilización de Tokens JWT (sesiones OAuth) o secuestro de la sesión firmada localmente en pruebas E2E. | FastAPI (Autenticación) |

---

## 3. Casos de Prueba de Seguridad (Atómicos)

### 3.1. Caso SEC-01: Inyección SQL (PostGIS GeoJSON Injection)
| Parámetro | Detalle |
| :--- | :--- |
| **Objetivo** | Verificar que el backend sanitice las entradas geométricas (AOI) antes de pasarlas a GeoAlchemy2. |
| **Precondiciones** | Autenticación con rol `e2e_admin` (Admin). |
| **Datos de Entrada** | Payload GeoJSON malformado con secuencias de escape SQL en los arreglos de coordenadas: `{"type": "Polygon", "coordinates": [[[0,0], [1,0], [1,1], [0,1], [0,0]]]'; DROP TABLE projects;--}` |
| **Método de Ejecución** | DAST (Dynamic Application Security Testing) mediante petición HTTP directa a `POST /api/v2/projects/`. |
| **Comportamiento Esperado** | El backend (FastAPI / Pydantic) debe rechazar la petición con un error HTTP `400 Bad Request` o `422 Unprocessable Entity` antes de que llegue a la base de datos. Ninguna tabla debe ser alterada. |

### 3.2. Caso SEC-02: Broken Object Level Authorization (BOLA)
| Parámetro | Detalle |
| :--- | :--- |
| **Objetivo** | Verificar que un usuario normal no pueda validar una tarea sin tener los permisos de `Validator` para ese proyecto específico. |
| **Precondiciones** | Autenticación con rol `e2e_mapper` (Voluntario normal sin rol de validador). |
| **Datos de Entrada** | Petición a `POST /api/v2/tasks/[ID_TAREA_Mapeada]/validate/` usando el token del `e2e_mapper`. |
| **Método de Ejecución** | DAST (Prueba funcional de permisos). |
| **Comportamiento Esperado** | El servidor debe responder con HTTP `403 Forbidden` indicando insuficiencia de permisos. |

### 3.3. Caso SEC-03: Exposición de Configuración
| Parámetro | Detalle |
| :--- | :--- |
| **Objetivo** | Asegurar que el entorno de producción no exponga configuraciones sensibles. |
| **Precondiciones** | Contenedores levantados con `docker-compose.yml`. |
| **Datos de Entrada** | N/A (Escaneo de red). |
| **Método de Ejecución** | SAST (Static Analysis) / Revisión de puertos expuestos en el Docker. |
| **Comportamiento Esperado** | El archivo `tasking-manager.env` no debe ser accesible externamente; el puerto de debug (`[CONFIG_PARAM_DEBUG_PORT]`, referenciado en docker-compose.yml como `5678`) no debe estar mapeado en un perfil productivo real. |
