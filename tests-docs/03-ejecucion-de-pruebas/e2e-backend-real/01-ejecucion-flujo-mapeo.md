# Ejecución de Casos de Prueba E2E — Flujo de Mapeo (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Reporte de Ejecución de Pruebas  
**Escenario de Prueba:** ESC-3001 — Solicitud de Bloqueo e Inicio de Tarea de Mapeo  
**Caso de Prueba:** CP-E2E-MAP-001  
**Diseño Asociado:** [Diseño E2E — Flujo de Mapeo](/tests-docs/02-diseno-de-pruebas/e2e-backend-real/01-flujo-mapeo.md)  
**Plan Asociado:** [Plan de Pruebas E2E contra Backend Real](/tests-docs/01-plan-de-pruebas/05-plan-pruebas-e2e-backend-real/plan-pruebas-e2e-backend-real.md)  
**Fecha de Ejecución:** 2026-07-15  
**Responsable:** JhonAQ  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Información General

| Atributo | Valor |
| :--- | :--- |
| **Sistema bajo prueba** | HOT Tasking Manager — Flujo de mapeo End-to-End |
| **Tipo de ejecución** | Automatizada |
| **Herramienta** | Playwright Test |
| **Navegador** | Chromium |
| **Ambiente** | Local / desarrollo |

## 2. Entorno de Ejecución

| Componente | Versión / Configuración |
| :--- | :--- |
| Sistema operativo | Windows 10 Home Single Language |
| Docker Desktop | (incluido en el entorno) |
| Imagen backend | `ghcr.io/hotosm/tasking-manager/backend:main` (target debug) |
| Base de datos | PostGIS 14-3.3 |
| Node.js | v18.x |
| Yarn | 1.22.22 |
| Playwright | (versión definida en `frontend/package.json`) |

### URLs del entorno

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:5000`
- Base de datos: `127.0.0.1:5434`

## 3. Datos de Prueba Utilizados

| Campo | Valor |
| :--- | :--- |
| Usuario | `e2e_mapper` |
| ID de usuario | `9999001` |
| Proyecto | `E2E Mapping Project` |
| ID de proyecto | `36` (variable según seed) |
| Tarea mapeada | `#2` (READY) |

> El ID del proyecto puede variar entre ejecuciones porque el seed limpia y recrea el proyecto.

## 4. Preparación del Ambiente

### 4.1. Levantar backend y base de datos

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  up -d tm-db tm-migration tm-backend
```

### 4.2. Sembrar datos de prueba

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  exec tm-backend python scripts/e2e-seed.py
```

### 4.3. Ejecutar el caso de prueba

```bash
cd frontend
E2E_BACKEND=real yarn test:e2e --grep "Flujo de Mapeo"
```

## 5. Ejecución de CP-E2E-MAP-001

| ID | Descripción | Tipo | Estado | Defectos |
| :--- | :--- | :--- | :--- | :--- |
| **CP-E2E-MAP-001** | Validar el flujo completo de mapeo con backend real: login → explorar proyecto → seleccionar tarea READY → abrir editor iD. | Automatizado | Exitoso | Ninguno |

### 5.1. Resultado esperado vs. obtenido

| Resultado esperado | Resultado obtenido |
| :--- | :--- |
| El usuario `e2e_mapper` inicia sesión, visualiza el proyecto `E2E Mapping Project`, accede a su detalle, selecciona la tarea `#2` en estado READY y abre el editor iD. El sistema bloquea la tarea (`LOCKED_FOR_MAPPING`) y muestra el contenedor `#id-container`. | Todas las navegaciones y verificaciones completaron sin errores. El editor iD se cargó correctamente. |

### 5.2. Pasos ejecutados

1. Navegar a `/authorized/?username=e2e_mapper&session_token=...&redirect_to=/explore`.
2. Verificar que la tarjeta del proyecto `E2E Mapping Project` es visible.
3. Hacer clic en la tarjeta del proyecto.
4. Verificar navegación a `/projects/{projectId}` y título visible.
5. Navegar a `/projects/{projectId}/tasks?search=2`.
6. Hacer clic en **Map selected task**.
7. Verificar navegación a `/projects/{projectId}/map` y visibilidad de `#id-container`.

## 6. Métricas de Desempeño

| Métrica | Valor obtenido | Umbral | Estado |
| :--- | :--- | :--- | :--- |
| `loginToExplore` | 3 497.27 ms | < 10 000 ms | ✅ Aprobado |
| `exploreToProjectDetail` | 375.18 ms | < 10 000 ms | ✅ Aprobado |
| `projectDetailToTaskSelection` | 516.04 ms | < 10 000 ms | ✅ Aprobado |
| `taskSelectionToEditor` | 6 752.44 ms | < 90 000 ms | ✅ Aprobado |

## 7. Salida de la Ejecución

La siguiente salida corresponde a la ejecución conjunta de la suite completa (`E2E_BACKEND=real yarn test:e2e`):

```text
Timings (ms): {
  loginToExplore: 3497.268400000001,
  exploreToProjectDetail: 375.1759999999995,
  projectDetailToTaskSelection: 516.0429999999978,
  taskSelectionToEditor: 6752.4382000000005
}
  ✓  2 [chromium] › e2e\flows\mapping-flow.spec.js:56:3 › Flujo de Mapeo (desempeño) › login -> buscar proyecto -> seleccionar tarea -> abrir editor de mapeo (11.5s)
```

## 8. Evidencias

- **Salida de consola:** incluida en la sección 7.
- **Video de ejecución:** generado por Playwright en `frontend/test-results/flows-mapping-flow-.../video.webm`.
- **Trazas de Playwright:** generadas en `frontend/test-results/`.

## 9. Conclusión

El caso de prueba CP-E2E-MAP-001 se ejecutó exitosamente contra el backend real. El flujo completo de mapeo (login, exploración, selección de tarea READY y apertura del editor iD) funcionó correctamente y todos los criterios de desempeño definidos fueron satisfechos.

## 10. Observaciones

- El seed actualiza los emails de los usuarios de prueba para evitar el popup de "Update your email".
- El overlay de webpack-dev-server se oculta durante la prueba mediante `addInitScript`.
- La autenticación se realiza con tokens de sesión firmados localmente para usuarios sembrados en la base de datos.

## 11. Próximos Pasos

- Mantener el seed idempotente para que las ejecuciones repetidas de la suite completa partan del mismo estado.
- Evaluar la estabilidad de la suite en modo CI con retries y captura de evidencias.
