const { test, expect } = require('@playwright/test');
const { performance } = require('perf_hooks');
const { loginAsValidator } = require('../fixtures/auth');
const { mockCommonAPI } = require('../fixtures/api-routes');
const { seed, isRealBackend } = require('../fixtures/e2e-seed');

const projectId = isRealBackend ? seed.project.id : 123;
const projectName = isRealBackend ? seed.project.name : 'La Paz Buildings';
const validationTaskId = isRealBackend ? 1 : 11;

test.describe('Flujo de Validación (funcional / usabilidad)', () => {
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
              taskId: 11,
              projectId: 123,
              taskStatus: 'LOCKED_FOR_VALIDATION',
              lockHolder: 'test_validator',
              taskHistory: [
                {
                  historyId: 1,
                  taskId: null,
                  action: 'LOCKED_FOR_VALIDATION',
                  actionText: null,
                  actionDate: new Date().toISOString(),
                  actionBy: 'test_validator',
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

  test('login como validador -> seleccionar tarea mapeada -> validar tarea', async ({ page }) => {
    const timings = {};

    // 1. Login
    const loginStart = performance.now();
    await loginAsValidator(page);
    await expect(page.getByText(projectName)).toBeVisible();
    timings.loginToExplore = performance.now() - loginStart;

    // 2. Ir a la selección de tareas y buscar la tarea MAPPED (#1)
    const taskSelectionStart = performance.now();
    await page.goto(`/projects/${projectId}/tasks?search=${validationTaskId}`);
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/tasks`));

    // 3. Clic en "Validate selected task" (o "Resume validation" si ya está bloqueada)
    const validateButton = page.getByRole('button', { name: /Validate selected task|Resume validation/i }).first();
    await expect(validateButton).toBeVisible();
    await validateButton.click();

    // 4. Verificar navegación a la vista de validación y abrir la pestaña Completion
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/validate`));
    await expect(page.getByRole('heading', { name: new RegExp(projectName, 'i') })).toBeVisible();
    const completionTab = page.getByRole('button', { name: /Completion/i }).first();
    await expect(completionTab).toBeVisible();
    await completionTab.click();
    timings.taskSelectionToValidation = performance.now() - taskSelectionStart;

    // 5. Seleccionar VALIDATED y enviar la tarea
    const validationStart = performance.now();
    await page.locator(`label[for="#${validationTaskId}-VALIDATED"]`).click();

    const submitButton = page.getByRole('button', { name: /Submit task/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 6. Verificar redirección tras envío exitoso
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/tasks`));
    timings.validationToSubmit = performance.now() - validationStart;

    // 7. Aserciones de desempeño
    expect(timings.loginToExplore).toBeLessThan(10000);
    expect(timings.taskSelectionToValidation).toBeLessThan(90000);
    expect(timings.validationToSubmit).toBeLessThan(30000);

    console.log('Timings (ms):', timings);
  });
});
