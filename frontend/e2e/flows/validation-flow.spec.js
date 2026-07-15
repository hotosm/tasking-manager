const { test, expect } = require('@playwright/test');
const { loginAsValidator } = require('../fixtures/auth');
const { mockCommonAPI } = require('../fixtures/api-routes');

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
    await loginAsValidator(page);
    // Esperar a que el login se refleje en la UI antes de navegar a rutas protegidas.
    await expect(page.getByText(/NRCS_Duduwa Mapping/i)).toBeVisible();
  });

  test('login como validador -> abrir tarea mapeada -> cargar botones validar/rechazar', async ({ page }) => {
    // Ir directamente a la página de validación con editor iD
    await page.goto('/projects/123/validate?editor=ID');

    // Esperar a que el sidebar cargue y muestre el título del proyecto
    await expect(page.getByRole('heading', { name: /La Paz Buildings/i })).toBeVisible();

    // Cambiar a la pestaña Completion
    await page.getByRole('button', { name: 'Completion', exact: true }).click();

    // Verificar radios de validar/rechazar para la tarea 11
    await expect(page.locator('input[id="#11-VALIDATED"]')).toBeVisible();
    await expect(page.locator('input[id="#11-INVALIDATED"]')).toBeVisible();

    // Verificar botón Submit task
    await expect(page.getByRole('button', { name: /Submit task/i })).toBeVisible();
  });
});
