# Ejecución de Casos de Prueba E2E — Flujo de Validación (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Reporte de Ejecución de Pruebas  
**Escenario de Prueba:** ESC-4001 — Solicitud de Bloqueo y Validación de Tarea Mapeada  
**Caso de Prueba:** CP-E2E-VAL-001  
**Diseño Asociado:** [Diseño E2E — Flujo de Validación](/tests-docs/02-diseno-de-pruebas/e2e-backend-real/02-flujo-validacion.md)  
**Plan Asociado:** [Plan de Pruebas E2E contra Backend Real](/tests-docs/01-plan-de-pruebas/05-plan-pruebas-e2e-backend-real/plan-pruebas-e2e-backend-real.md)  
**Fecha de Ejecución:** 2026-07-15  
**Responsable:** JhonAQ  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Información General

| Atributo | Valor |
| :--- | :--- |
| **Sistema bajo prueba** | HOT Tasking Manager — Flujo de validación End-to-End |
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
| Usuario | `e2e_validator` |
| ID de usuario | `9999002` |
| Proyecto | `E2E Mapping Project` |
| ID de proyecto | `36` (variable según seed) |
| Tarea mapeada | `#1` (MAPPED) |

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
E2E_BACKEND=real yarn test:e2e --grep "Flujo de Validación"
```

## 5. Ejecución de CP-E2E-VAL-001

| ID | Descripción | Tipo | Estado | Defectos |
| :--- | :--- | :--- | :--- | :--- |
| **CP-E2E-VAL-001** | Validar el flujo completo de validación con backend real: login → seleccionar tarea MAPPED → bloquear para validación → seleccionar VALIDATED → enviar. | Automatizado | Exitoso | Ninguno |

### 5.1. Resultado esperado vs. obtenido

| Resultado esperado | Resultado obtenido |
| :--- | :--- |
| El usuario `e2e_validator` inicia sesión, accede al proyecto `E2E Mapping Project`, selecciona la tarea `#1` en estado MAPPED, la bloquea para validación, selecciona `VALIDATED` y envía el formulario. El sistema redirige a la lista de tareas con la tarea validada. | Todas las navegaciones y verificaciones completaron sin errores. El estado `VALIDATED` se aplicó correctamente. |

### 5.2. Pasos ejecutados

1. Navegar a `/authorized/?username=e2e_validator&session_token=...&redirect_to=/explore`.
2. Verificar que el proyecto `E2E Mapping Project` es visible.
3. Navegar a `/projects/{projectId}/tasks?search=1`.
4. Hacer clic en **Validate selected task** (o **Resume validation** si la tarea ya estaba bloqueada).
5. Verificar navegación a `/projects/{projectId}/validate`.
6. Seleccionar la pestaña **Completion**.
7. Seleccionar el radio `VALIDATED`.
8. Hacer clic en **Submit task**.
9. Verificar redirección a `/projects/{projectId}/tasks`.

## 6. Métricas de Desempeño

| Métrica | Valor obtenido | Umbral | Estado |
| :--- | :--- | :--- | :--- |
| `loginToExplore` | 16 706.65 ms | < 20 000 ms | ✅ Aprobado |
| `taskSelectionToValidation` | 5 868.77 ms | < 90 000 ms | ✅ Aprobado |
| `validationToSubmit` | 672.01 ms | < 30 000 ms | ✅ Aprobado |

## 7. Salida de la Ejecución

La siguiente salida corresponde a la ejecución conjunta de la suite completa (`E2E_BACKEND=real yarn test:e2e`):

```text
Timings (ms): {
  loginToExplore: 16706.652000000002,
  taskSelectionToValidation: 5868.771199999996,
  validationToSubmit: 672.0126999999993
}
  ✓  3 [chromium] › e2e\flows\validation-flow.spec.js:56:3 › Flujo de Validación (funcional / usabilidad) › login como validador -> seleccionar tarea mapeada -> validar tarea (23.7s)
```

## 8. Evidencias

- **Salida de consola:** incluida en la sección 7.
- **Video de ejecución:** generado por Playwright en `frontend/test-results/flows-validation-flow-.../video.webm`.
- **Trazas de Playwright:** generadas en `frontend/test-results/`.

## 9. Conclusión

El caso de prueba CP-E2E-VAL-001 se ejecutó exitosamente contra el backend real. El flujo completo de validación (login, selección de tarea MAPPED, bloqueo para validación, selección de `VALIDATED` y envío) funcionó correctamente y todos los criterios de desempeño definidos fueron satisfechos.

## 10. Observaciones

- La prueba maneja tanto el botón **Validate selected task** como **Resume validation**, ya que una ejecución previa puede haber dejado la tarea bloqueada.
- En la vista de validación, el panel de acción se encuentra en la pestaña **Completion**; el test la activa antes de interactuar con los radios.
- El seed ahora limpia también la tabla `messages` para evitar errores de clave foránea al recrear el proyecto.
- La autenticación se realiza con tokens de sesión firmados localmente para usuarios sembrados en la base de datos.

## 11. Próximos Pasos

- Mantener el seed idempotente para que las ejecuciones repetidas de la suite completa partan del mismo estado.
- Considerar un `globalSetup` o `test.beforeAll` que ejecute el seed cuando se corra la suite completa.
