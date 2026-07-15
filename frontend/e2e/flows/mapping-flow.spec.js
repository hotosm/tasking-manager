const { test, expect } = require('@playwright/test');
const { performance } = require('perf_hooks');
const { loginAsMapper } = require('../fixtures/auth');
const { mockCommonAPI } = require('../fixtures/api-routes');
const { seed, isRealBackend } = require('../fixtures/e2e-seed');

const projectId = isRealBackend ? seed.project.id : 7935;
const projectName = isRealBackend ? seed.project.name : 'NRCS_Duduwa Mapping';
const readyTaskId = isRealBackend ? 2 : 1;

test.describe('Flujo de Mapeo (desempeño)', () => {
  test.beforeEach(async ({ page }) => {
    // Eliminar el overlay de webpack-dev-server que intercepta clics por warnings.
    await page.addInitScript(() => {
      const removeOverlay = () => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) overlay.remove();
      };
      removeOverlay();
      setInterval(removeOverlay, 500);
    });

    if (!isRealBackend) {
      await mockCommonAPI(page, {
        userLockedTasksDetails: {
          tasks: [
            {
              taskId: 1,
              projectId: 7935,
              taskStatus: 'LOCKED_FOR_MAPPING',
              lockHolder: 'test_mapper',
              taskHistory: [
                {
                  historyId: 1,
                  taskId: null,
                  action: 'LOCKED_FOR_MAPPING',
                  actionText: null,
                  actionDate: new Date().toISOString(),
                  actionBy: 'test_mapper',
                  pictureUrl: null,
                  issues: null,
                },
              ],
              taskAnnotation: [],
              perTaskInstructions: '',
              autoUnlockSeconds: 7200,
              lastUpdated: new Date().toISOString(),
              numberOfComments: null,
            },
          ],
        },
      });
    }
  });

  test('login -> buscar proyecto -> seleccionar tarea -> abrir editor de mapeo', async ({ page }) => {
    const timings = {};

    // 1. Login
    const loginStart = performance.now();
    await loginAsMapper(page);
    await expect(page.getByText(projectName)).toBeVisible();
    timings.loginToExplore = performance.now() - loginStart;

    // 2. Buscar proyecto y hacer clic
    const exploreStart = performance.now();
    const projectCard = page.locator('.project-card').filter({ hasText: projectName }).first();
    await expect(projectCard).toBeVisible();
    await projectCard.click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    await expect(page.getByRole('heading', { name: new RegExp(projectName, 'i') })).toBeVisible();
    timings.exploreToProjectDetail = performance.now() - exploreStart;

    // 3. Ir a selección de tareas buscando la tarea lista
    const detailStart = performance.now();
    await page.goto(`/projects/${projectId}/tasks?search=${readyTaskId}`);
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/tasks`));
    timings.projectDetailToTaskSelection = performance.now() - detailStart;

    // 4. Seleccionar tarea READY usando búsqueda por ID y abrir editor
    const taskSelectionStart = performance.now();
    const mapButton = page.getByRole('button', { name: /Map selected task/i });
    await expect(mapButton).toBeVisible();
    await mapButton.click();

    // 5. Verificar navegación al editor
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/map`));
    await expect(page.locator('#id-container')).toBeVisible({ timeout: 60000 });
    timings.taskSelectionToEditor = performance.now() - taskSelectionStart;

    // 6. Aserciones de desempeño (umbrales generosos para entorno de desarrollo)
    expect(timings.loginToExplore).toBeLessThan(10000);
    expect(timings.exploreToProjectDetail).toBeLessThan(10000);
    expect(timings.projectDetailToTaskSelection).toBeLessThan(10000);
    expect(timings.taskSelectionToEditor).toBeLessThan(90000);

    // Imprimir métricas para debugging
    console.log('Timings (ms):', timings);
  });
});
