# Plan de Pruebas E2E contra Backend Real

## 1. Identificación

- **Nombre del plan**: Plan de Pruebas E2E — Backend Real
- **Identificador**: TP-E2E-REAL-001
- **Versión**: 1.0
- **Fecha**: 2026-07-15
- **Responsable**: JhonAQ

## 2. Introducción

### 2.1 Objetivo

Definir la estrategia, alcance, recursos y cronograma para la ejecución de pruebas End-to-End contra el backend real de HOT Tasking Manager. Estas pruebas complementan la suite mockeada existente, proporcionando confianza en la integración real entre frontend, backend y base de datos.

### 2.2 Alcance

#### Dentro del alcance

- Validación de flujos de usuario críticos:
  1. Flujo de mapeo.
  2. Flujo de validación.
  3. Flujo de administración (crear proyecto).
- Ejecución automatizada con Playwright.
- Backend real desplegado localmente mediante Docker Compose.
- Base de datos sembrada con datos controlados.

#### Fuera del alcance

- Pruebas de carga o estrés.
- Pruebas de seguridad ofensiva.
- Validación del flujo OAuth2 real con OpenStreetMap (se utiliza autenticación controlada mediante tokens firmados localmente para usuarios sembrados).

## 3. Estrategia de pruebas

### 3.1 Enfoque

- **Tipo**: Pruebas funcionales E2E automatizadas.
- **Nivel**: Sistema (frontend + backend + base de datos).
- **Técnica**: Caja negra basada en flujos de usuario.
- **Automatización**: 100% automatizada con Playwright Test.

### 3.2 Criterios de entrada

- Backend y base de datos desplegados y saludables.
- Script de seed ejecutado sin errores.
- Archivo `frontend/e2e/.e2e-seed.json` generado y accesible.
- Entorno `E2E_BACKEND=real` configurado.

### 3.3 Criterios de salida

- Todos los casos de prueba del flujo documentado pasan.
- Los tiempos de respuesta medidos se mantienen dentro de los umbrales definidos.
- No se registran defectos bloqueantes.

### 3.4 Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dependencia de servicios externos (OSM) | Uso de tokens de sesión firmados localmente para evitar OAuth real. |
| Estado inconsistente de la base de datos | Seed idempotente que limpia y recrea datos de prueba antes de cada ejecución. |
| Conflictos de puertos locales | Exposición de backend en `:5000` y DB en `:5434` mediante archivo de override exclusivo. |
| Lentitud del entorno de desarrollo | Umbrales de tiempo generosos y reintentos configurados en Playwright. |

## 4. Recursos

### 4.1 Hardware/infraestructura

- Equipo local con Docker Desktop / Docker Engine.
- Navegador Chromium gestionado por Playwright.

### 4.2 Software

- Node.js / Yarn.
- Playwright Test.
- Docker Compose.
- Python 3.10+ (dentro del contenedor del backend).

### 4.3 Datos de prueba

Generados por `scripts/e2e-seed.py`:

| Rol | Usuario | ID |
|---|---|---|
| Mapper | `e2e_mapper` | 9999001 |
| Validator | `e2e_validator` | 9999002 |
| Admin | `e2e_admin` | 9999003 |

Proyecto de prueba: `E2E Mapping Project` (ID asignado por la base de datos).

## 5. Cronograma

| Fase | Flujo | Estado |
|---|---|---|
| 1 | Mapeo | Completado |
| 2 | Validación | Pendiente |
| 3 | Administración / Crear proyecto | Pendiente |

## 6. Entregables

- Código de pruebas en `frontend/e2e/flows/`.
- Script de seed en `scripts/e2e-seed.py`.
- Archivo de override Docker `docker-compose.e2e.yml`.
- Documentación en `test-docs/e2e-real-backend/`.

## 7. Roles y responsabilidades

| Rol | Responsable | Responsabilidad |
|---|---|---|
| Tester / Desarrollador | JhonAQ | Diseño, implementación y ejecución de pruebas. |
| DevOps / Infraestructura | Equipo HOT | Mantenimiento de imágenes Docker y compose base. |
