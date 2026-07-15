const { expect } = require('@playwright/test');
const { userQueryDetails } = require('../../src/network/tests/mockData/userList');
const { seed, isRealBackend } = require('./e2e-seed');

const TEST_USER = isRealBackend
  ? {
      username: seed.mapper.username,
      sessionToken: seed.mapper.token,
      osmToken: 'fake',
    }
  : {
      username: 'test_mapper',
      sessionToken: 'validSessionToken',
      osmToken: 'validOsmToken',
    };

const ADMIN_USER = isRealBackend
  ? {
      username: seed.admin.username,
      sessionToken: seed.admin.token,
      osmToken: 'fake',
    }
  : {
      ...TEST_USER,
      username: 'test_admin',
    };

const VALIDATOR_USER = isRealBackend
  ? {
      username: seed.validator.username,
      sessionToken: seed.validator.token,
      osmToken: 'fake',
    }
  : {
      ...TEST_USER,
      username: 'test_validator',
    };

async function loginViaCallback(page, user = TEST_USER, redirectTo = '/explore') {
  // Limpiar cualquier sesión previa para evitar que Redux/localStorage afecte el login.
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const params = new URLSearchParams({
    username: user.username,
    session_token: user.sessionToken,
    osm_oauth_token: user.osmToken,
    picture: '',
    redirect_to: redirectTo,
  });
  await page.goto(`/authorized/?${params.toString()}`, { waitUntil: 'domcontentloaded' });
  // Esperar a que la navegación termine y el header esté renderizado.
  await page.waitForSelector('header nav, [data-testid="user-avatar"]', { state: 'visible', timeout: 30000 });
  // Confirmar que la sesión se estableció observando el avatar/nombre del usuario.
  await expect(
    page.locator('[data-testid="user-avatar"], header button').filter({ hasText: user.username }).first(),
  ).toBeVisible({ timeout: 15000 });
}

async function loginAsAdmin(page, redirectTo = '/explore') {
  return loginViaCallback(page, ADMIN_USER, redirectTo);
}

async function loginAsValidator(page, redirectTo = '/explore') {
  return loginViaCallback(page, VALIDATOR_USER, redirectTo);
}

async function loginAsMapper(page, redirectTo = '/explore') {
  return loginViaCallback(page, TEST_USER, redirectTo);
}

async function logout(page) {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto('/login');
}

module.exports = {
  TEST_USER,
  ADMIN_USER,
  VALIDATOR_USER,
  loginViaCallback,
  loginAsAdmin,
  loginAsValidator,
  loginAsMapper,
  logout,
};
