# Ejecución de Pruebas Unitarias — Frontend

## 1. Información General

| Campo | Detalle |
| :-- | :-- |
| **Proyecto** | Tasking Manager — Frontend |
| **Tipo de prueba** | Unitaria automatizada |
| **Framework** | Jest 27 + CRACO 7.1 + React Testing Library 14 |
| **Mock Service Worker** | MSW 1.3.2 |
| **Rama de ejecución** | `feature/unit-test-report` |
| **Commit base** | `b93d8d3d` |
| **Fecha de ejecución** | 2026-06-17 |
| **Hora de inicio** | 20:58 UTC |
| **Hora de finalización** | 21:09 UTC |
| **Duración total** | 660.527 segundos (~11 minutos) |

### Comando ejecutado

```bash
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --coverage \
  --coverageReporters=text --coverageReporters=json-summary
```

---

## 2. Resumen de Resultados

### 2.1. Suites de prueba

| Estado | Cantidad | Porcentaje |
| :-- | :-- | :-- |
| ✅ Pasadas | 188 | 93.07% |
| ❌ Fallidas | 14 | 6.93% |
| **Total** | **202** | **100%** |

### 2.2. Casos de prueba individuales

| Estado | Cantidad | Porcentaje |
| :-- | :-- | :-- |
| ✅ Pasados | 1,075 | 98.62% |
| ❌ Fallidos | 15 | 1.38% |
| **Total** | **1,090** | **100%** |

---

## 3. Cobertura de Código

### 3.1. Métricas globales

| Métrica | Cubierto | Total | Porcentaje |
| :-- | :-- | :-- | :-- |
| **Líneas** | 5,032 | 9,197 | 54.71% |
| **Sentencias** | 5,376 | 9,835 | 54.66% |
| **Funciones** | 1,826 | 3,458 | 52.80% |
| **Ramas (Branches)** | 3,164 | 5,956 | 53.12% |

### 3.2. Cobertura por módulo — Áreas con alta cobertura (≥ 80%)

| Archivo | Líneas | Funciones | Ramas |
| :-- | :-- | :-- | :-- |
| `views/notFound.js` | 100% | 100% | 100% |
| `views/stats.js` | 100% | 100% | 100% |
| `views/users.js` | 100% | 100% | 100% |
| `views/userDetail.js` | 100% | 100% | 96.55% |
| `views/notifications.js` | 100% | 100% | 75% |
| `views/project.js` | 97.64% | 100% | 90.56% |
| `views/organisationManagement.js` | 91.66% | 78.57% | 86.48% |
| `views/taskSelection.js` | 90% | 80% | 75% |

### 3.3. Cobertura por módulo — Áreas con cobertura baja (< 30%)

| Archivo | Líneas | Funciones | Ramas |
| :-- | :-- | :-- | :-- |
| `views/organisationDetail.js` | 0% | 0% | 0% |
| `views/organisationStats.js` | 0% | 0% | 0% |
| `views/partnersManagement.js` | 0% | 0% | 0% |
| `views/partnersMapswipeStats.js` | 0% | 0% | 0% |
| `views/partnersStats.js` | 0% | 0% | 0% |
| `views/quickstart.js` | 0% | 0% | 0% |
| `views/root.js` | 0% | 0% | 0% |
| `views/settings.js` | 0% | 0% | 0% |
| `views/verifyEmail.js` | 0% | 0% | 0% |
| `views/welcome.js` | 0% | 0% | 0% |
| `views/projectEdit.js` | 6.97% | 0% | 0% |

---

## 4. Suites Pasadas (188 / 202)

### 4.1. Componentes (`src/components/`)

| Suite | Resultado | Tiempo |
| :-- | :-- | :-- |
| `tests/basemapMenu.test.js` | ✅ PASS | 13.7 s |
| `tests/checkBox.test.js` | ✅ PASS | 18.0 s |
| `tests/checkCircle.test.js` | ✅ PASS | 7.1 s |
| `tests/code.test.js` | ✅ PASS | 7.6 s |
| `tests/menu.test.js` | ✅ PASS | 5.2 s |
| `tests/organisationSelect.test.js` | ✅ PASS | 24.6 s |
| `tests/preloader.test.js` | ✅ PASS | 9.9 s |
| `tests/redirect.test.js` | ✅ PASS | 13.4 s |
| `tests/selectAll.test.js` | ✅ PASS | 17.4 s |
| `banner/tests/topBanner.test.js` | ✅ PASS | 18.5 s |
| `comments/tests/fileRejections.test.js` | ✅ PASS | 15.0 s |
| `comments/tests/hashtagPaste.test.js` | ✅ PASS | 17.6 s |
| `contributions/tests/myTasksOrderDropdown.test.js` | ✅ PASS | 29.2 s |
| `header/tests/menuItems.test.js` | ✅ PASS | 13.3 s |
| `header/tests/topBar.test.js` | ✅ PASS | 9.7 s |
| `homepage/tests/featuredProjects.test.js` | ✅ PASS | 12.0 s |
| `homepage/tests/stats.test.js` | ✅ PASS | 22.2 s |
| `notifications/tests/notificationOrderBy.test.js` | ✅ PASS | 15.7 s |
| `notifications/tests/paginator.test.js` | ✅ PASS | 6.1 s |
| `projectCard/tests/projectCard.test.js` | ✅ PASS | 16.7 s |
| `projectDetail/tests/downloadButtons.test.js` | ✅ PASS | 28.8 s |
| `projectDetail/tests/footer.test.js` | ✅ PASS | 34.3 s |
| `projectDetail/tests/privateProjectError.test.js` | ✅ PASS | 18.9 s |
| `projectDetail/tests/similarProjects.test.js` | ✅ PASS | 24.3 s |
| `projectDetail/tests/statusBox.test.js` | ✅ PASS | 27.0 s |
| `projectDetail/tests/visibilityBox.test.js` | ✅ PASS | 15.0 s |
| `projects/tests/clearFilters.test.js` | ✅ PASS | 10.0 s |
| `projects/tests/projectCardPaginator.test.js` | ✅ PASS | 17.2 s |
| `projects/tests/projectNav.test.js` | ✅ PASS | 28.3 s |
| `projects/tests/projectsMap.test.js` | ✅ PASS | 12.9 s |
| `projectStats/tests/completion.test.js` | ✅ PASS | 27.4 s |
| `projectStats/tests/edits.test.js` | ✅ PASS | 25.9 s |
| `projectStats/tests/taskStats.test.js` | ✅ PASS | 29.9 s |
| `taskSelection/tests/instructions.test.js` | ✅ PASS | 16.8 s |
| `taskSelection/tests/legend.test.js` | ✅ PASS | 35.2 s |
| `taskSelection/tests/map.test.js` | ✅ PASS | 19.9 s |
| `taskSelection/tests/taskActivity.test.js` | ✅ PASS | 20.6 s |
| `teamsAndOrgs/tests/featureStats.test.js` | ✅ PASS | 11.7 s |
| `teamsAndOrgs/tests/leaveTeamConfirmationAlert.test.js` | ✅ PASS | 29.7 s |
| `teamsAndOrgs/tests/newUsersStats.test.js` | ✅ PASS | 18.4 s |
| `teamsAndOrgs/tests/remainingTasksStats.test.js` | ✅ PASS | 21.5 s |
| `teamsAndOrgs/tests/tasksStatsSummary.test.js` | ✅ PASS | 13.3 s |
| `user/tests/content.test.js` | ✅ PASS | 22.6 s |

### 4.2. Vistas (`src/views/`)

| Suite | Resultado | Tiempo |
| :-- | :-- | :-- |
| `tests/fallback.test.js` | ✅ PASS | — |
| `tests/interests.test.js` | ✅ PASS | — |
| `tests/login.test.js` | ✅ PASS | 20.4 s |
| `tests/management.test.js` | ✅ PASS | — |
| `tests/notFound.test.js` | ✅ PASS | 28.3 s |
| `tests/notifications.test.js` | ✅ PASS | 35.5 s |
| `tests/organisationManagement.test.js` | ✅ PASS | — |
| `tests/project.test.js` | ✅ PASS | — |
| `tests/stats.test.js` | ✅ PASS | 25.7 s |
| `tests/teams.test.js` | ✅ PASS | — |
| `tests/users.test.js` | ✅ PASS | — |

### 4.3. Hooks (`src/hooks/`)

| Suite | Resultado | Tiempo |
| :-- | :-- | :-- |
| `tests/UseAsync.test.js` | ✅ PASS | 26.9 s |
| `tests/UseAvatarText.test.js` | ✅ PASS | 14.7 s |
| `tests/UseDateRangeQueryParams.test.js` | ✅ PASS | 10.6 s |
| `tests/UseDisableBadImagery.test.js` | ✅ PASS | 6.1 s |
| `tests/UseEditOrgPermissions.test.js` | ✅ PASS | — |
| `tests/UseEditProjectPermissions.test.js` | ✅ PASS | — |
| `tests/UseEditTeamPermissions.test.js` | ✅ PASS | — |
| `tests/UseFilterContributors.test.js` | ✅ PASS | — |
| `tests/UseFirstTaskActionDate.test.js` | ✅ PASS | 5.4 s |
| `tests/UseGeomContainsMultiplePolygons.test.js` | ✅ PASS | — |
| `tests/UseGetContributors.test.js` | ✅ PASS | 12.4 s |
| `tests/UseImageryOption.test.js` | ✅ PASS | 8.3 s |
| `tests/UseLockedTasks.test.js` | ✅ PASS | 8.2 s |
| `tests/UseMetaTags.test.js` | ✅ PASS | 7.4 s |
| `tests/UseOrganisationLevel.test.js` | ✅ PASS | — |
| `tests/UseOrgYearStats.test.js` | ✅ PASS | — |
| `tests/UsePredictYearlyTasks.test.js` | ✅ PASS | 5.3 s |
| `tests/UseProjectCompletenessCalc.test.js` | ✅ PASS | — |
| `tests/UseReadTaskComments.test.js` | ✅ PASS | 10.6 s |
| `tests/UseTaskBbox.test.js` | ✅ PASS | 7.5 s |
| `tests/UseTimeDiff.test.js` | ✅ PASS | 9.2 s |
| `tests/UseTotalTasksStats.test.js` | ✅ PASS | 6.0 s |
| `tests/UseUploadImage.test.js` | ✅ PASS | 8.2 s |
| `tests/UseValidateDateRange.test.js` | ✅ PASS | — |

### 4.4. Utilidades (`src/utils/`)

| Suite | Resultado | Tiempo |
| :-- | :-- | :-- |
| `tests/commaArrayParam.test.js` | ✅ PASS | 8.7 s |
| `tests/countries.test.js` | ✅ PASS | — |
| `tests/defaultChangesetComment.test.js` | ✅ PASS | 6.4 s |
| `tests/editorsList.test.js` | ✅ PASS | — |
| `tests/formatChartJSData.test.js` | ✅ PASS | — |
| `tests/formattedRelativeTime.test.js` | ✅ PASS | 29.0 s |
| `tests/geoFileFunctions.test.js` | ✅ PASS | — |
| `tests/getTaskContributors.test.js` | ✅ PASS | 11.4 s |
| `tests/htmlFromMarkdown.test.js` | ✅ PASS | — |
| `tests/internationalization.test.js` | ✅ PASS | — |
| `tests/openEditor.test.js` | ✅ PASS | — |
| `tests/osmchaLink.test.js` | ✅ PASS | — |
| `tests/overpassLink.test.js` | ✅ PASS | — |
| `tests/permissionErrorMsg.test.js` | ✅ PASS | — |
| `tests/permissionsToMap.test.js` | ✅ PASS | — |
| `tests/permissionsToValidate.test.js` | ✅ PASS | — |
| `tests/random.test.js` | ✅ PASS | 19.1 s |
| `tests/remapParamsToAPI.test.js` | ✅ PASS | 7.7 s |
| `tests/selectUnit.test.js` | ✅ PASS | — |
| `tests/shareFunctions.test.js` | ✅ PASS | 6.9 s |
| `tests/slugifyFileName.test.js` | ✅ PASS | 6.8 s |
| `tests/sorting.test.js` | ✅ PASS | — |
| `tests/taskAction.test.js` | ✅ PASS | — |
| `tests/taskGrid.test.js` | ✅ PASS | — |
| `tests/tasksGeometry.test.js` | ✅ PASS | 12.4 s |
| `tests/teamMembersDiff.test.js` | ✅ PASS | — |
| `tests/updateTaskStatus.test.js` | ✅ PASS | — |

---

## 5. Suites Fallidas (14 / 202)

### 5.1. Clasificación de fallos

```
Distribución de causas de fallo (15 casos individuales)

  Timeout asíncrono Jest (5000 ms)  ████████████████████████  86.7%  (13 casos)
  Fallo de aserción (UI state)      ███                        6.7%  ( 1 caso)
  Crash de worker Jest              ███                        6.7%  ( 1 caso)
```

### 5.2. Fallos por timeout asíncrono (13 casos)

Trece suites superan el límite de 5000 ms establecido por defecto en Jest. El tiempo real de ejecución de cada suite indica que los componentes renderizados implican operaciones asíncronas complejas (intercepción con MSW, resolución de queries React Query, manipulación del DOM con `userEvent`).

| # | Suite | Tiempo registrado | Caso fallido |
| :-- | :-- | :-- | :-- |
| 1 | `taskSelection/tests/footer.test.js` | 158.2 s | `renders footer` |
| 2 | `views/tests/licenses.test.js` | 170.0 s | `renders licenses page` |
| 3 | `views/tests/campaigns.test.js` | 230.3 s | `renders campaign list` |
| 4 | `views/tests/taskSelection.test.js` | 230.2 s | `renders task selection page` |
| 5 | `taskSelection/tests/actionSidebars.test.js` | 236.9 s | `renders action sidebar` |
| 6 | `views/tests/userDetail.test.js` | 17.4 s | `renders user detail page` |
| 7 | `taskSelection/tests/resourcesTab.test.js` | 16.7 s | `renders resources tab` |
| 8 | `taskSelection/tests/multipleTaskHistories.test.js` | 21.1 s | `renders accordion correctly with task history items for 2 tasks` |
| 9 | `projectDetail/tests/shareButton.test.js` | 19.5 s | `render shareButton for project with id 1` |
| 10 | `views/tests/projectStats.test.js` | 52.2 s | `fetch urls and render sections title` |
| 11 | `views/tests/contact.test.js` | 37.2 s | `Contact page` |
| 12 | `components/projects/tests/orderBy.test.js` | 19.9 s | `should select option on click` |
| 13 | `views/tests/campaigns.test.js` | 230.3 s | `renders campaign list` |

**Traza representativa del error:**
```
thrown: "Exceeded timeout of 5000 ms for a test.
Use jest.setTimeout(newTimeout) to increase the timeout value,
if this is a long-running test."
```

### 5.3. Fallo por aserción incorrecta (1 caso)

| Suite | Tiempo | Descripción |
| :-- | :-- | :-- |
| `contributions/tests/myProjectsDropdown.test.js` | 19.0 s | `displays placeholder and typed text on type` |

**Error registrado:**
```
Unable to find an element with the text: #8629.
```

El test ejecuta `selectEvent.select(screen.getByRole('combobox'), '#8629')` esperando encontrar la opción `#8629` dentro del componente `react-select`. El dropdown responde con `No matching project ID`, lo que indica que el handler de MSW no retorna las opciones esperadas ante el valor de búsqueda del test.

### 5.4. Fallo por crash de proceso worker (1 caso)

| Suite | Tiempo | Descripción |
| :-- | :-- | :-- |
| `projectStats/tests/contributorsStats.test.js` | — | Suite no ejecutada |

**Error registrado:**
```
Jest worker encountered 4 child process exceptions, exceeding retry limit
```

El worker de Jest agotó el número máximo de reintentos (4) durante la inicialización del proceso hijo. La causa probable es una dependencia de módulo incompatible con el entorno jsdom o una condición de memoria insuficiente bajo ejecución paralela con las demás suites activas.

---

## 6. Análisis de Causas Raíz

| Causa | Suites afectadas | Casos afectados | Acción sugerida |
| :-- | :-- | :-- | :-- |
| Timeout de Jest insuficiente (5000 ms) | 12 | 13 | Incrementar `jest.setTimeout` a 30000 ms en `setupTests.js` |
| Handler MSW no retorna datos esperados | 1 | 1 | Revisar el handler del endpoint de búsqueda de proyectos en `src/network/tests/server.js` |
| Crash de worker por módulo incompatible | 1 | 1 | Ejecutar en modo `--runInBand` para aislar la causa; revisar imports del módulo |

---

## 7. Ambiente de Ejecución

| Parámetro | Valor |
| :-- | :-- |
| **Sistema operativo** | Windows 11 |
| **Node.js** | v18.19.1 (gestionado por Volta) |
| **Gestor de paquetes** | Yarn 1.22.22 |
| **CRACO** | v7.1.0 |
| **Jest** | v27 (incluido en react-scripts 5.0.1) |
| **React Testing Library** | v14.2.1 |
| **MSW (Mock Service Worker)** | v1.3.2 |
| **Entorno de test** | jsdom |
| **Cobertura habilitada** | Sí |
| **Modo watch** | Desactivado (`--watchAll=false`) |

---

*Reporte de ejecución de pruebas unitarias — Tasking Manager Frontend*
*Fecha: 2026-06-17 | Rama: `feature/unit-test-report`*
