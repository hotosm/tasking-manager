# Especificación de Casos de Prueba — Flujo de Mapeo (Backend Real)

## 1. Información general

- **Identificador del caso de prueba**: TC-E2E-MAP-001
- **Nombre**: Login, exploración de proyecto, selección de tarea READY y apertura del editor iD
- **Diseño asociado**: TD-E2E-MAP-001
- **Procedimiento asociado**: TP-E2E-MAP-001
- **Reporte de ejecución**: TR-E2E-MAP-001
- **Nivel**: Prueba E2E / Sistema
- **Técnica**: Caja negra
- **Automatización**: Sí

## 2. Descripción

Verificar que un usuario mapper autenticado puede completar el flujo de mapeo sobre el backend real: iniciar sesión, encontrar el proyecto de prueba publicado, seleccionar una tarea en estado `READY` y abrirla en el editor iD.

## 3. Precondiciones

1. Backend real y base de datos PostgreSQL/PostGIS levantados con `docker-compose.e2e.yml`.
2. Script `scripts/e2e-seed.py` ejecutado exitosamente.
3. Archivo `frontend/e2e/.e2e-seed.json` generado y accesible.
4. Frontend configurado para apuntar al backend real (`E2E_BACKEND=real`).
5. Navegador Chromium disponible para Playwright.

## 4. Datos de prueba

| Campo | Valor |
|---|---|
| Usuario | `e2e_mapper` |
| ID de usuario | `9999001` |
| Rol | Mapper |
| Proyecto | `E2E Mapping Project` |
| Tarea a mapear | `#2` (estado READY) |
| Editor esperado | iD (`#id-container`) |

## 5. Pasos de ejecución

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Navegar a `/authorized/?username=e2e_mapper&session_token=...&redirect_to=/explore` | Sesión iniciada y redirección a `/explore`. |
| 2 | Verificar que la tarjeta del proyecto `E2E Mapping Project` es visible | El proyecto aparece en la lista de proyectos publicados. |
| 3 | Hacer clic en la tarjeta del proyecto | Navegación a `/projects/{projectId}`. |
| 4 | Verificar que el título del proyecto es visible | Se muestra el nombre del proyecto en el detalle. |
| 5 | Navegar a `/projects/{projectId}/tasks?search=2` | La página de selección de tareas carga correctamente. |
| 6 | Hacer clic en el botón **Map selected task** | Navegación a `/projects/{projectId}/map`. |
| 7 | Verificar que `#id-container` es visible | El editor iD se carga y está listo para mapear. |

## 6. Resultado esperado

- Todas las navegaciones y verificaciones completan sin errores.
- El usuario accede al editor iD con la tarea `#2` bloqueada para mapeo.

## 7. Criterios de éxito adicionales (desempeño)

| Métrica | Umbral |
|---|---|
| `loginToExplore` | < 10 000 ms |
| `exploreToProjectDetail` | < 10 000 ms |
| `projectDetailToTaskSelection` | < 10 000 ms |
| `taskSelectionToEditor` | < 90 000 ms |

## 8. Postcondiciones

- La tarea `#2` queda bloqueada para mapeo por el usuario `e2e_mapper` en la base de datos.
- El entorno puede re-seedearse para ejecutar la prueba nuevamente.

## 9. Trazabilidad

- Requisito funcional: un mapper debe poder seleccionar y abrir una tarea lista para mapear.
- Flujo de usuario: `frontend/e2e/flows/mapping-flow.spec.js`.
- Datos de prueba: `scripts/e2e-seed.py`.
