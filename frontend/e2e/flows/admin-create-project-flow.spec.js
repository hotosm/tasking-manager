const { test, expect } = require('@playwright/test');
const path = require('path');
const { performance } = require('perf_hooks');
const { loginAsAdmin } = require('../fixtures/auth');
const { mockCommonAPI } = require('../fixtures/api-routes');
const { seed, isRealBackend } = require('../fixtures/e2e-seed');

const organisationName = isRealBackend ? seed.organisation.name : 'American Red Cross';

const projectName = isRealBackend
  ? `E2E Admin Project ${Date.now()}`
  : 'Test Playwright Project';

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

    if (!isRealBackend) {
      await mockCommonAPI(page);
    }
  });

  test('login como admin -> panel manage -> crear proyecto -> importar AOI -> guardar borrador', async ({ page }) => {
    const timings = {};

    // 1. Login y acceso al panel Manage
    const loginStart = performance.now();
    await loginAsAdmin(page, '/manage');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
    timings.loginToManage = performance.now() - loginStart;

    // 2. Ir a crear proyecto
    await page.locator('a[href="/manage/projects/new/"]').first().click();
    await expect(page).toHaveURL(/\/manage\/projects\/new\/?$/);
    await expect(page.getByRole('heading', { name: /Create new project/i })).toBeVisible();

    // 3. Completar wizard de creación
    const wizardStart = performance.now();

    // 3.1 Importar AOI mediante archivo GeoJSON
    const aoiPath = path.join(__dirname, '..', 'fixtures', 'test-aoi.geojson');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(aoiPath);

    // Esperar a que se procese la geometría (metadata.area > 0)
    await expect(page.getByText(/km/i).first()).toBeVisible();

    // 3.2 Next -> Set Task Sizes
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Set Tasks Sizes/i })).toBeVisible();

    // 3.3 Next -> Trim Project
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Trim Task Grid/i })).toBeVisible();

    // 3.4 Next -> Review
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByRole('heading', { name: /Review/i })).toBeVisible();

    // 4. Completar nombre del proyecto
    await page.locator('input#name').fill(projectName);

    // 5. Seleccionar organización
    await page.locator('.react-select__control').click();
    const orgOption = page.locator('.react-select__option', { hasText: organisationName });
    await expect(orgOption).toBeVisible();
    await orgOption.click();

    // 6. Crear proyecto (guarda como borrador)
    const createButton = page.getByRole('button', { name: /Create/i });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // 7. Verificar navegación al proyecto recién creado
    await expect(page).toHaveURL(/\/manage\/projects\/\d+$/);
    timings.createProjectWizard = performance.now() - wizardStart;

    // 8. Aserciones de desempeño
    expect(timings.loginToManage).toBeLessThan(10000);
    expect(timings.createProjectWizard).toBeLessThan(120000);

    console.log('Timings (ms):', timings);
  });
});
