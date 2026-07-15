# Reporte de Ejecución — Flujo de Mapeo (Backend Real)

## 1. Identificación

- **Identificador del reporte**: TR-E2E-MAP-001
- **Caso de prueba ejecutado**: TC-E2E-MAP-001
- **Procedimiento seguido**: TP-E2E-MAP-001
- **Fecha de ejecución**: 2026-07-15
- **Responsable**: JhonAQ
- **Ambiente**: Local / desarrollo

## 2. Entorno de ejecución

| Componente | Versión / Configuración |
|---|---|
| Sistema operativo | Windows 10 Home Single Language |
| Docker Desktop | (incluido en el entorno) |
| Imagen backend | `ghcr.io/hotosm/tasking-manager/backend:main` (target debug) |
| Base de datos | PostGIS 14-3.3 |
| Node.js | v18.x |
| Yarn | 1.22.22 |
| Playwright | (versión definida en `frontend/package.json`) |
| Navegador | Chromium |

### URLs del entorno

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:5000`
- Base de datos: `127.0.0.1:5434`

## 3. Datos de prueba utilizados

| Campo | Valor |
|---|---|
| Usuario | `e2e_mapper` |
| ID de usuario | `9999001` |
| Proyecto | `E2E Mapping Project` |
| ID de proyecto | `7` |
| Tarea mapeada | `#2` (READY) |

> El ID del proyecto puede variar entre ejecuciones porque el seed limpia y recrea el proyecto.

## 4. Resultado de la ejecución

```text
Running 1 test using 1 worker

Timings (ms): {
  loginToExplore: 5375.6466,
  exploreToProjectDetail: 454.321899999999,
  projectDetailToTaskSelection: 510.9470999999994,
  taskSelectionToEditor: 2844.2158
}
  ✓  1 [chromium] › e2e\flows\mapping-flow.spec.js:56:3 › Flujo de Mapeo (desempeño) › login -> buscar proyecto -> seleccionar tarea -> abrir editor de mapeo (10.2s)

  1 passed (33.9s)
Done in 34.85s.
```

## 5. Evaluación de criterios de éxito

| Métrica | Valor obtenido | Umbral | Estado |
|---|---|---|---|
| `loginToExplore` | 5 375.65 ms | < 10 000 ms | ✅ Aprobado |
| `exploreToProjectDetail` | 454.32 ms | < 10 000 ms | ✅ Aprobado |
| `projectDetailToTaskSelection` | 510.95 ms | < 10 000 ms | ✅ Aprobado |
| `taskSelectionToEditor` | 2 844.22 ms | < 90 000 ms | ✅ Aprobado |

## 6. Conclusión

El caso de prueba TC-E2E-MAP-001 se ejecutó exitosamente contra el backend real. El flujo completo de mapeo (login, exploración, selección de tarea READY y apertura del editor iD) funcionó correctamente y todos los criterios de desempeño definidos fueron satisfechos.

## 7. Evidencias generadas

- Video de ejecución: `frontend/test-results/flows-mapping-flow-.../video.webm`
- Trazas de Playwright: generadas en `frontend/test-results/`

## 8. Observaciones

- El seed actualiza los emails de los usuarios de prueba para evitar el popup de "Update your email".
- El overlay de webpack-dev-server se oculta durante la prueba mediante `addInitScript`.
- La autenticación se realiza con tokens de sesión firmados localmente para usuarios sembrados en la base de datos.

## 9. Próximos pasos

- Ejecutar y documentar el flujo de validación (TC-E2E-VAL-001).
- Ejecutar y documentar el flujo de administrador / crear proyecto (TC-E2E-ADM-001).
