# Plan de Pruebas E2E contra Backend Real

**Versión del Documento:** 1.0  
**Tipo de Documento:** Plan de Pruebas  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Introducción y Alcance

### 1.1. Objetivo

Definir la estrategia, alcance, recursos y cronograma para la ejecución de pruebas End-to-End (E2E) contra una instancia real del backend de HOT Tasking Manager. Estas pruebas complementan la suite con API mockeada y las pruebas funcionales manuales/documentadas, proporcionando confianza en la integración real entre frontend, backend y base de datos.

### 1.2. Alcance

#### Dentro del alcance

- Validación de flujos de usuario críticos:
  1. Flujo de mapeo (MOD-03, ESC-3001, CP-3001-01).
  2. Flujo de validación.
  3. Flujo de administración (crear proyecto).
- Ejecución automatizada con Playwright.
- Backend real desplegado localmente mediante Docker Compose.
- Base de datos PostgreSQL/PostGIS sembrada con datos controlados.

#### Fuera del alcance

- Pruebas de carga o estrés.
- Pruebas de seguridad ofensiva.
- Validación del flujo OAuth2 real con OpenStreetMap. Para la ejecución automatizada se utiliza autenticación controlada mediante tokens de sesión firmados localmente para usuarios sembrados.

## 2. Estrategia de Pruebas

### 2.1. Enfoque

- **Tipo:** Pruebas funcionales E2E automatizadas.
- **Nivel:** Sistema (frontend + backend + base de datos).
- **Técnica:** Caja negra basada en flujos de usuario.
- **Automatización:** 100% automatizada con Playwright Test.

### 2.2. Criterios de entrada

- Backend y base de datos desplegados y saludables con `docker-compose.e2e.yml`.
- Script `scripts/e2e-seed.py` ejecutado sin errores (automáticamente vía `globalSetup` cuando `E2E_BACKEND=real`).
- Archivo `frontend/e2e/.e2e-seed.json` generado y accesible.
- Entorno `E2E_BACKEND=real` configurado.

### 2.3. Criterios de salida

- Todos los casos de prueba del flujo documentado pasan.
- Los tiempos de respuesta medidos se mantienen dentro de los umbrales definidos.
- No se registran defectos bloqueantes.

### 2.4. Riesgos y mitigaciones

| Riesgo | Mitigación |
| :--- | :--- |
| Dependencia de servicios externos (OSM) | Uso de tokens de sesión firmados localmente para evitar OAuth real. |
| Estado inconsistente de la base de datos | Seed idempotente que limpia y recrea datos de prueba antes de cada ejecución. |
| Conflictos de puertos locales | Exposición de backend en `:5000` y DB en `:5434` mediante archivo de override exclusivo para E2E. |
| Lentitud del entorno de desarrollo | Umbrales de tiempo generosos y reintentos configurados en Playwright. |

## 3. Recursos

### 3.1. Hardware / Infraestructura

- Equipo local con Docker Desktop / Docker Engine.
- Navegador Chromium gestionado por Playwright.

### 3.2. Software

- Node.js / Yarn.
- Playwright Test.
- Docker Compose.
- Python 3.10+ (dentro del contenedor del backend).

### 3.3. Datos de prueba

Generados por `scripts/e2e-seed.py`:

| Rol | Usuario | ID |
| :--- | :--- | :--- |
| Mapper | `e2e_mapper` | 9999001 |
| Validator | `e2e_validator` | 9999002 |
| Admin | `e2e_admin` | 9999003 |

Proyecto de prueba: `E2E Mapping Project` (ID asignado por la base de datos).

## 4. Cronograma

| Fase | Flujo | Estado |
| :--- | :--- | :--- |
| 1 | Mapeo | Completado |
| 2 | Validación | Completado |
| 3 | Administración / Crear proyecto | Completado |

## 5. Ejecución de la Suite Completa

La suite completa de los tres flujos E2E contra el backend real se ejecutó exitosamente el 2026-07-15 con el comando:

```bash
cd frontend
E2E_BACKEND=real yarn test:e2e
```

Resultado:

```text
Running 3 tests using 1 worker

  ✓  1 [chromium] › e2e\flows\admin-create-project-flow.spec.js:31:3 › Flujo de Administración (funcional / usabilidad) › login como admin -> panel manage -> crear proyecto -> importar AOI -> guardar borrador (13.5s)
  ✓  2 [chromium] › e2e\flows\mapping-flow.spec.js:56:3 › Flujo de Mapeo (desempeño) › login -> buscar proyecto -> seleccionar tarea -> abrir editor de mapeo (11.5s)
  ✓  3 [chromium] › e2e\flows\validation-flow.spec.js:56:3 › Flujo de Validación (funcional / usabilidad) -> login como validador -> seleccionar tarea mapeada -> validar tarea (23.7s)

  3 passed (1.2m)
Done in 75.01s.
```

> Nota: antes de cada ejecución completa se debe volver a correr `scripts/e2e-seed.py` para restablecer el estado controlado de la base de datos.

## 6. Entregables

- Código de pruebas en `frontend/e2e/flows/`.
- Script de seed en `scripts/e2e-seed.py`.
- `globalSetup` de Playwright en `frontend/e2e/global-setup.js`.
- Archivo de override Docker `docker-compose.e2e.yml`.
- Documentación en `tests-docs/01-plan-de-pruebas/05-plan-pruebas-e2e-backend-real/`.
- Diseño de pruebas en `tests-docs/02-diseno-de-pruebas/e2e-backend-real/`.
- Reportes de ejecución en `tests-docs/03-ejecucion-de-pruebas/e2e-backend-real/`.

## 7. Roles y Responsabilidades

| Rol | Responsable | Responsabilidad |
| :--- | :--- | :--- |
| Tester / Desarrollador | JhonAQ | Diseño, implementación y ejecución de pruebas. |
| DevOps / Infraestructura | Equipo HOT | Mantenimiento de imágenes Docker y compose base. |
