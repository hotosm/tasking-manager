# Plan de Pruebas de Sistema
**Proyecto:** HOT OSM Tasking Manager
**Versión del Documento:** 2.0
**Estándares de Referencia:** ISO/IEC/IEEE 29119-3, IEEE 829

---

## 1. Introducción y Alcance

### 1.1. Objetivo
Definir la estrategia global, el alcance, los recursos y el cronograma para la ejecución de las **Pruebas de Sistema**. Este documento unifica y reemplaza todos los planes anteriores (incluyendo planes aislados de E2E). Validará que todos los componentes (Frontend en React, Backend en FastAPI, Base de Datos PostGIS) funcionan conjuntamente bajo escenarios funcionales, de rendimiento y de seguridad.

### 1.2. Alcance
El alcance incluye las siguientes tres dimensiones integradas de pruebas a nivel de sistema:
* **E2E Funcional:** Flujos de negocio priorizados y completos (Mapeo, Validación y Administración de Proyectos).
* **Rendimiento:** Validación de los límites de carga, estrés y resistencia del backend en su infraestructura de contenedores.
* **Seguridad:** Análisis de vulnerabilidades y exposición de endpoints.

**Quedan excluidos del alcance:**
* Pruebas unitarias y de integración (aisladas).
* Flujo de autenticación OAuth real contra servidores de OSM de producción en pruebas automatizadas E2E (se usarán tokens de sesión controlados).

---

## 2. Necesidades del Entorno

La siguiente tabla describe la configuración exacta requerida, alineada con la infraestructura de despliegue (`docker-compose.yml` y `docker-compose.e2e.yml`):

| Componente | Especificación Técnica | Configuración de Contenedor |
| :--- | :--- | :--- |
| **Backend API** | FastAPI, Python 3.10+ | `ghcr.io/hotosm/tasking-manager/backend:main` (Límites: 1 CPU, 1.5GB RAM). Puerto expuesto (E2E): `:5000` |
| **Base de Datos** | PostgreSQL 14 / PostGIS 3.3 | `postgis/postgis:14-3.3`. Puerto expuesto (E2E): `:5434`. Inicialización mediante Alembic. |
| **Frontend UI** | React, Node.js | `ghcr.io/hotosm/tasking-manager/frontend:main`. Expuesto vía Traefik en puerto `:3000` (Dev). |
| **Orquestación** | Docker Engine, Docker Compose | Red aislada: `tm-net`. |
| **Automatización E2E** | Playwright Test, Chromium | Configurado en `frontend/e2e` con entorno `E2E_BACKEND=real`. |

---

## 3. Criterios de Aceptación y Rechazo

### 3.1. Criterios de Aceptación
| Tipo de Prueba | Criterios Mínimos Aprobatorios |
| :--- | :--- |
| **E2E Funcional** | 100% de los casos de flujos críticos aprobados sin errores de bloqueo; ejecución del seed script idempotente exitosa. |
| **Rendimiento** | Tiempos de respuesta para endpoints críticos (ej. guardado de tareas) en el percentil 95 (P95) < 2 segundos bajo carga base. 0% tasa de error. |
| **Seguridad** | 0 vulnerabilidades críticas u altas identificadas (según OWASP Top 10) en análisis estáticos o dinámicos. |

### 3.2. Criterios de Rechazo (Suspensión)
* Defectos bloqueantes que impidan la autenticación o visualización del mapa.
* Tasa de error superior al 5% durante las pruebas de carga iniciales.
* Consumo de recursos de backend superior al límite de contenedor (1.5GB RAM, 1 CPU) induciendo caídas por OOM (Out Of Memory).

---

## 4. Riesgos y Contingencias

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- | :--- |
| Intermitencia de red y dependencia de OSM | Alta | Alto | Utilizar la función `storageState` de Playwright para inyectar tokens de autenticación firmados sin llamar a OAuth real. |
| Cuellos de botella en la inicialización de PostGIS | Media | Medio | Emplear `healthcheck` estricto de PostgreSQL en Docker y ejecutar dependencias (`tm-migration`) solo tras salud de BD. |
| Estado inconsistente de los datos de prueba | Baja | Alto | Ejecutar `scripts/e2e-seed.py` obligatoriamente antes de cada suite automatizada. |

---

## 5. Estrategia y Enfoques de Prueba

### 5.1. E2E Funcional
Técnica de caja negra validando flujos completos (Happy Paths) usando automatización 100% con Playwright simulando navegadores Chromium, respaldado por la pre-carga controlada de usuarios (`e2e_mapper`, `e2e_admin`).

### 5.2. Rendimiento (Carga y Estrés)
Uso de herramientas de inyección de carga contra los endpoints de backend (`:5000`) más demandantes, priorizando aquellos con consultas espaciales en PostGIS (creación de AOI, listado de tareas espaciales).

### 5.3. Seguridad (Análisis de Vulnerabilidades)
Evaluación focalizada en Inyecciones SQL (PostGIS), controles de acceso a nivel de objeto (BOLA) y manejo adecuado de los tokens JWT de sesión.

---

## 6. Entregables
* **Planes de Prueba:** Presente documento.
* **Diseños de Prueba:** Archivos detallados en `tests-docs/02-diseno-de-pruebas/sistema/`.
* **Scripts Automatizados:** Configurados en el repositorio (`frontend/e2e`).
* **Reportes de Ejecución:** Informes resultantes tras la integración en GitHub Actions (CI/CD).
