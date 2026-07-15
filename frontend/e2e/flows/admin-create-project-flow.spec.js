const { test, expect } = require('@playwright/test');
const path = require('path');
const { loginAsAdmin } = require('../fixtures/auth');
const { mockCommonAPI } = require('../fixtures/api-routes');

test.describe('Flujo de Administración (funcional / usabilidad)', () => {
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
    await mockCommonAPI(page);
    await loginAsAdmin(page, '/manage');
  });

  test('login como admin -> panel manage -> crear proyecto -> importar AOI -> guardar borrador', async ({ page }) => {
    // 1. Verificar panel Manage
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();

    // 2. Ir a crear proyecto
    await page.locator('a[href="/manage/projects/new/"]').first().click();
    await expect(page).toHaveURL(/\/manage\/projects\/new\/?$/);
    await expect(page.getByRole('heading', { name: /Create new project/i })).toBeVisible();

    // 3. Importar AOI mediante archivo GeoJSON
    const aoiPath = path.join(__dirname, '..', 'fixtures', 'test-aoi.geojson');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(aoiPath);

    // Esperar a que se procese la geometría (metadata.area > 0)
    await expect(page.getByText(/km/i).first()).toBeVisible();

    // 4. Next -> Set Task Sizes
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Set Tasks Sizes/i })).toBeVisible();

    // 5. Next -> Trim Project
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Trim Task Grid/i })).toBeVisible();

    // 6. Next -> Review
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible();

    // 7. Completar nombre del proyecto
    await page.locator('input#name').fill('Test Playwright Project');

    // 8. Seleccionar organización
    await page.locator('.react-select__control').click();
    await page.locator('.react-select__option', { hasText: 'American Red Cross' }).click();

    // 9. Crear proyecto (guarda como borrador)
    await page.getByRole('button', { name: /Create/i }).click();

    // 10. Verificar navegación al proyecto recién creado
    await expect(page).toHaveURL('/manage/projects/9999');
  });
});
