# Ejecución de Casos de Prueba E2E — Flujo de Administración / Crear Proyecto (Backend Real)

**Versión del Documento:** 1.0  
**Tipo de Documento:** Reporte de Ejecución de Pruebas  
**Escenario de Prueba:** ESC-2001 — Creación de un Nuevo Proyecto  
**Caso de Prueba:** CP-E2E-ADM-001  
**Diseño Asociado:** [Diseño E2E — Flujo de Administración](/tests-docs/02-diseno-de-pruebas/e2e-backend-real/03-flujo-administracion.md)  
**Plan Asociado:** [Plan de Pruebas E2E contra Backend Real](/tests-docs/01-plan-de-pruebas/05-plan-pruebas-e2e-backend-real/plan-pruebas-e2e-backend-real.md)  
**Fecha de Ejecución:** 2026-07-15  
**Responsable:** JhonAQ  
**Estándares de referencia:** IEEE 829, ISO/IEC/IEEE 29119

---

## 1. Información General

| Atributo | Valor |
| :--- | :--- |
| **Sistema bajo prueba** | HOT Tasking Manager — Creación de Proyecto End-to-End |
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
| Usuario | `e2e_admin` |
| ID de usuario | `9999003` |
| Rol | `ADMIN` (`role = 1`) |
| Organización | `E2E Organisation` |
| Nombre del proyecto | `E2E Admin Project {timestamp}` |
| AOI | `frontend/e2e/fixtures/test-aoi.geojson` |

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
E2E_BACKEND=real yarn test:e2e --grep "Flujo de Administración"
```

## 5. Ejecución de CP-E2E-ADM-001

| ID | Descripción | Tipo | Estado | Defectos |
| :--- | :--- | :--- | :--- | :--- |
| **CP-E2E-ADM-001** | Validar el flujo completo de creación de proyecto con backend real: login → panel manage → wizard de creación → guardar borrador. | Automatizado | Exitoso | Ninguno |

### 5.1. Resultado esperado vs. obtenido

| Resultado esperado | Resultado obtenido |
| :--- | :--- |
| El usuario `e2e_admin` inicia sesión, accede a `/manage`, crea un nuevo proyecto importando un AOI GeoJSON, avanza por los pasos del wizard, completa nombre y organización, y guarda el proyecto como borrador. El sistema redirige a `/manage/projects/{id}`. | Todas las navegaciones y verificaciones completaron sin errores. El proyecto se creó correctamente en la base de datos. |

### 5.2. Pasos ejecutados

1. Navegar a `/authorized/?username=e2e_admin&session_token=...&redirect_to=/manage`.
2. Verificar que el panel **Manage** muestra el encabezado **Projects**.
3. Hacer clic en **Create new project**.
4. Verificar navegación a `/manage/projects/new/`.
5. Subir el archivo `test-aoi.geojson`.
6. Avanzar por los pasos **Set Tasks Sizes**, **Trim Task Grid** y **Review**.
7. Completar el nombre del proyecto.
8. Seleccionar la organización `E2E Organisation`.
9. Hacer clic en **Create**.
10. Verificar redirección a `/manage/projects/{id}`.

## 6. Métricas de Desempeño

| Métrica | Valor obtenido | Umbral | Estado |
| :--- | :--- | :--- | :--- |
| `loginToManage` | 3 946.44 ms | < 10 000 ms | ✅ Aprobado |
| `createProjectWizard` | 5 053.80 ms | < 120 000 ms | ✅ Aprobado |

## 7. Salida de la Ejecución

```text
Running 1 test using 1 worker

Timings (ms): {
  loginToManage: 3946.442499999999,
  createProjectWizard: 5053.799299999999
}
  ✓  1 [chromium] › e2e\flows\admin-create-project-flow.spec.js:31:3 › Flujo de Administración (funcional / usabilidad) › login como admin -> panel manage -> crear proyecto -> importar AOI -> guardar borrador (10.6s)

  1 passed (34.2s)
Done in 35.14s.
```

## 8. Evidencias

- **Salida de consola:** incluida en la sección 7.
- **Video de ejecución:** generado por Playwright en `frontend/test-results/flows-admin-create-project-.../video.webm`.
- **Trazas de Playwright:** generadas en `frontend/test-results/`.

## 9. Conclusión

El caso de prueba CP-E2E-ADM-001 se ejecutó exitosamente contra el backend real. El flujo completo de creación de proyecto (login, acceso al panel de gestión, importación de AOI, wizard de creación y guardado como borrador) funcionó correctamente y todos los criterios de desempeño definidos fueron satisfechos.

## 10. Observaciones

- El seed crea al usuario `e2e_admin` con `role = 1` (ADMIN), lo que le permite crear proyectos sin necesidad de ser manager explícito de la organización.
- En el paso de revisión se espera a que la opción de organización esté visible antes de seleccionarla, garantizando que el botón **Create** se habilite.
- El overlay de webpack-dev-server se oculta durante la prueba mediante `addInitScript`.
- La autenticación se realiza con tokens de sesión firmados localmente para usuarios sembrados en la base de datos.

## 11. Próximos Pasos

- Evaluar la ejecución conjunta de los tres flujos E2E (mapeo, validación y administración) controlando el estado compartido de la base de datos.
- Considerar un `globalSetup` o `test.beforeAll` que ejecute el seed cuando se corra la suite completa.
