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
  const params = new URLSearchParams({
    username: user.username,
    session_token: user.sessionToken,
    osm_oauth_token: user.osmToken,
    picture: '',
    redirect_to: redirectTo,
  });
  await page.goto(`/authorized/?${params.toString()}`, { waitUntil: 'networkidle' });
  // Esperar a que el redirect termine y la página destino empiece a renderizar.
  // Se usa waitForLoadState en lugar de waitForURL porque la redirección puede
  // dejar query params o hashes intermedios dependiendo del entorno.
  await page.waitForLoadState('networkidle');
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
