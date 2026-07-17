# Diseño de Pruebas de Rendimiento
**Proyecto:** HOT OSM Tasking Manager
**Versión del Documento:** 1.0

---

## 1. Introducción
El presente diseño detalla la estrategia de ejecución para validar el comportamiento del backend (FastAPI y PostGIS) bajo distintas cargas, teniendo en cuenta las restricciones de los contenedores Docker locales (`cpus: "1"`, `memory: 1500M`).

## 2. Perfiles de Carga Operacionales

A continuación, se definen los tres escenarios principales de pruebas de rendimiento.

### 2.1. Prueba de Carga (Load Testing)
Evalúa el sistema bajo el volumen de tráfico esperado (Peak Load).

| Parámetro | Valor | Descripción |
| :--- | :--- | :--- |
| **Usuarios Concurrentes (VUs)** | 50 | Simulación de 50 mapeadores simultáneos. |
| **Ramp-Up** | 1 minuto | 0 a 50 VUs progresivamente. |
| **Tiempo de Sostenimiento** | 10 minutos | Mantenimiento de la carga. |
| **Flujos Prioritarios** | Mapeo de Tareas | Interacción continua de obtención y bloqueo de tareas. |

### 2.2. Prueba de Estrés (Stress Testing)
Determina el límite máximo antes del punto de quiebre (Degradación severa o caída por OOM en el contenedor de 1.5GB RAM).

| Parámetro | Valor | Descripción |
| :--- | :--- | :--- |
| **Usuarios Concurrentes (VUs)** | 150 | Sobrecarga deliberada de la API. |
| **Ramp-Up** | 2 minutos | 0 a 150 VUs. |
| **Tiempo de Sostenimiento** | 5 minutos | Carga extrema rápida. |
| **Flujos Prioritarios** | Búsqueda Geoespacial | Endpoints que hacen peticiones intensivas a PostGIS. |

### 2.3. Prueba de Resistencia (Endurance / Soak Testing)
Evalúa si ocurren "Memory Leaks" en FastAPI o degradación paulatina.

| Parámetro | Valor | Descripción |
| :--- | :--- | :--- |
| **Usuarios Concurrentes (VUs)** | 20 | Carga base sostenible. |
| **Ramp-Up** | 1 minuto | Aceleración inicial corta. |
| **Tiempo de Sostenimiento** | 120 minutos | Ejecución prolongada para verificar la recolección de basura. |
| **Flujos Prioritarios** | Navegación mixta | Búsqueda, Mapeo y Validación combinados. |

---

## 3. Flujos Críticos a Evaluar

| ID Flujo | Descripción / Endpoint | Tecnología Relacionada | Riesgo Identificado |
| :--- | :--- | :--- | :--- |
| **PRF-01** | `POST /api/v2/projects/` | GeoAlchemy2 / PostGIS | Alta carga de CPU por el procesamiento del polígono AOI (Área de Interés). |
| **PRF-02** | `GET /api/v2/projects/{id}/tasks/` | FastAPI / PostgreSQL | Búsqueda geoespacial concurrente que puede agotar los hilos del pool de la base de datos. |
| **PRF-03** | `POST /api/v2/tasks/{id}/lock/` | FastAPI | Concurrencia alta de bloqueos y actualizaciones de estado. |

## 4. Métricas a Recolectar
* **Tiempos de Respuesta (P95 y P99):** Deben mantenerse por debajo de 2 segundos.
* **Throughput (RPS - Requests Per Second):** Tasa máxima de solicitudes soportadas.
* **Tasa de Error:** Debe ser del 0% bajo Prueba de Carga.
* **Consumo de Contenedor:** RAM y CPU monitoreados vía `docker stats` para no exceder los límites configurados.
