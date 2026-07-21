# Especificación Técnica: Pruebas de Rendimiento
**Proyecto:** HOT OSM Tasking Manager
**Componentes Evaluados:** API REST (FastAPI) y Motor Geoespacial (PostgreSQL/PostGIS)

---

## 1. Estrategia y Objetivos de Ejecución

| Fase de Prueba | Propósito Técnico | Métrica Crítica de Validación | Justificación de Diseño |
| :--- | :--- | :--- | :--- |
| **Prueba de Carga (Load Testing)** | Medir latencia de respuesta procesando 50 sesiones concurrentes interactuando con tareas. | P95 < 2000ms; Error Rate = 0%. | Validar que el *event loop* de FastAPI no sufra bloqueos de E/S bajo el tráfico nominal esperado durante campañas de mapeo activo. |
| **Prueba de Estrés (Stress Testing)** | Sobrecargar intencionalmente el motor PostGIS (150 VUs enviando polígonos densos) para ubicar el umbral crítico de fallo (Timeouts / HTTP 504). | Identificación del punto exacto de OOM (Out Of Memory) o agotamiento de CPU. | Determinar la resiliencia del *connection pool* de AsyncPG y los límites de las operaciones espaciales de inserción. |
| **Prueba de Resistencia (Endurance)** | Inyectar 20 VUs continuos durante 120 minutos sobre un flujo mixto (Búsqueda y Mapeo). | Consumo de RAM estable post-recolección de basura (Garbage Collector). | Evidenciar fugas de memoria (Memory Leaks) en la instanciación de modelos de SQLAlchemy/GeoAlchemy tras exposición prolongada. |

## 2. Stack Tecnológico y Topología

| Componente | Herramienta Asignada | Justificación Técnica de la Selección |
| :--- | :--- | :--- |
| **Motor de Inyección** | **k6 (Grafana)** | Escrito en Go, utiliza *goroutines* garantizando altísima concurrencia con mínimo consumo de RAM en el nodo atacante, evitando falsos cuellos de botella locales (habituales en JMeter). Permite aserciones nativas (*Thresholds*) automatizables en pipelines. |
| **Telemetría de Recursos** | **Docker Stats** | Intercepta el cgroup del kernel de Linux, proporcionando el consumo real de RAM/CPU de los contenedores sin instalar agentes invasivos que alteren el rendimiento del backend bajo prueba. |

**Topología de Red:** El motor k6 se despliega en el host local inyectando peticiones a la interfaz de loopback (`localhost:5000`) ruteadas hacia la red interna `tm-net`. Esto suprime la latencia de WAN/LAN externa, asegurando que las métricas reflejen puramente los tiempos de procesamiento de FastAPI y PostGIS.

## 3. Preparación del Entorno y Datos de Prueba

| Requisito / Artefacto | Configuración Técnica y Procedimiento |
| :--- | :--- |
| **Límites de Contenedores** | Restringir el servicio `tm-backend` en `docker-compose.yml` obligatoriamente a `cpus: "1"` y `memory: "1500M"`. Condición sine qua non para reflejar el entorno de staging. |
| **Población Inicial (Seed)** | Ejecutar `docker compose exec tm-backend python scripts/e2e-seed.py` pre-iniciando 1 proyecto con 1000 tareas para dotar a PostGIS de índices B-Tree y GiST realistas. |
| **Pool de Autenticación** | Pre-firmar 100 tokens JWT. Exportarlos a un archivo `tokens.json` para que k6 rote aleatoriamente las cabeceras `Authorization: Bearer <token>`, evitando el caché de sesión del backend en un solo usuario. |
| **Cargas Útiles Geoespaciales** | Proveer arreglos de multipolígonos GeoJSON (mínimo 500 vértices) en `/tests-docs/02-diseno-de-pruebas/sistema/payloads/` para estresar el motor de intersección espacial. |

## 4. Escenarios de Prueba y Configuración de k6

| Parámetro | Escenario 1: Carga Nominal (Flujo de Bloqueo de Tareas) |
| :--- | :--- |
| **Vector de Carga** | 1. `GET /api/v2/projects/1/tasks/` <br> 2. `sleep(2 a 5s)` <br> 3. `POST /api/v2/tasks/1/lock/` |
| **Configuración VUs (k6 stages)** | `{ duration: '1m', target: 50 }` (Ramp-up) <br> `{ duration: '10m', target: 50 }` (Sostenimiento) <br> `{ duration: '1m', target: 0 }` (Ramp-down) |
| **Justificación del Flujo** | Simula el comportamiento humano exacto: obtener la grilla espacial, visualizar (think time) y enviar la orden transaccional de bloqueo. Pone a prueba las condiciones de carrera (Race Conditions) de la base de datos al realizar locks concurrentes. |
| **Validación (Thresholds)** | `http_req_duration: ['p(95)<2000']` (Latencia estricta para garantizar usabilidad del mapa). <br> `http_req_failed: ['rate==0.0']` (Tolerancia cero a fallos transaccionales). |

<br>

| Parámetro | Escenario 2: Estrés Geoespacial (Creación de Proyectos) |
| :--- | :--- |
| **Vector de Carga** | `POST /api/v2/projects/` (Inyección iterativa de polígonos GeoJSON de alta densidad). |
| **Configuración VUs (k6 stages)** | `{ duration: '2m', target: 150 }` (Ramp-up agresivo) <br> `{ duration: '5m', target: 150 }` (Sostenimiento en sobrecarga) |
| **Justificación del Flujo** | La transformación de GeoJSON a tipos `geometry` en PostGIS demanda procesamiento matemático intensivo. 150 solicitudes paralelas obligarán a la CPU a encolar procesos, evaluando cómo FastAPI rechaza peticiones (*Load Shedding*) sin colapsar el proceso principal. |
| **Validación (Thresholds)** | Recolección de logs de caídas. Aceptación de tasa de errores `502 Bad Gateway` y `504 Gateway Timeout` controlados (FastAPI descartando conexiones en lugar de sufrir un evento de *OOM kill* por parte del kernel). |

## 5. Procedimiento de Ejecución y Monitoreo

| Etapa | Comando de Consola | Propósito Técnico |
| :--- | :--- | :--- |
| **1. Arranque Limpio** | `docker compose down -v && docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d` | Destruir volúmenes previos para purgar caché de PostgreSQL y asegurar que PostGIS cargue los índices a RAM desde cero (*Cold Start*). |
| **2. Siembra (Seed)** | `docker compose exec tm-backend python scripts/e2e-seed.py` | Estabilización del modelo relacional previo al estrés. |
| **3. Monitoreo Activo** | `docker stats tm-backend tm-db --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"` | Vigilancia ininterrumpida para detectar si se cruza el límite de 1.5GB RAM o 100% de CPU. |
| **4. Inyección k6** | `k6 run scripts-k6/load-test.js --out json=results_load.json` | Despliegue del ataque de carga, serializando telemetría en JSON para agregación automatizada. |
| **5. Análisis Forense** | Evaluación del volcado JSON (`results_load.json`). | Contraste empírico contra los Thresholds. Si P95 > 2s, se procede a auditar los logs de *Slow Queries* en PostgreSQL para identificar cuellos de botella en índices. |

## 6. Consideraciones de Riesgo y Tolerancias

| Factor de Riesgo | Justificación del Impacto | Mecanismo de Mitigación Integrado |
| :--- | :--- | :--- |
| **Agotamiento del Connection Pool** | Si los 50 VUs exceden las conexiones permitidas por AsyncPG, el middleware de la API colgará transacciones esperando hilos libres (Timeout interno). | Configurar la variable `POOL_SIZE` en `tasking-manager.env` con un valor `>= 50` previo al inicio, garantizando que el límite evaluado sea el de procesamiento y no un estrangulamiento artificial de la BD. |
| **Interferencia de IOps del Host** | Sistemas de archivos locales lentos ralentizan los `fsync` del WAL de PostgreSQL, contaminando las latencias medidas. | Asegurar que el entorno de ejecución k6 resida sobre almacenamiento NVMe/SSD, o usar `tmpfs` para el volumen de datos de Docker si únicamente se requiere medir el rendimiento puramente computacional de la API. |
