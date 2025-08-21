import { handleErrors } from './promise';

const TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
// const DASHBOARD_API_URL = 'https://dashboard.osmsandbox.us';
const DASHBOARD_API_URL = 'https://dashboard.osmsandbox.naxadev.com';


/**
 * Check if a token is valid and not expired
 */
export function isTokenValid(tokenData) {
  return tokenData?.expires_at > Date.now() + TOKEN_BUFFER_MS;
}

/**
 * Create callback URL for OAuth flow
 */
export function createOAuthCallbackUrl() {
  const url = new URL(window.location.href);
  // Remove any existing session_id parameter to ensure clean callback URL
  url.searchParams.delete('session_id');
  return url.toString();
}

/**
 * Clean URL parameter after OAuth callback
 */
export function cleanOAuthCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('session_id');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Get valid token or initiate auth flow
 */
export async function getValidTokenOrInitiateAuth({
  dispatch,
  sandboxId,
  sandboxTokens,
  getSandboxAuthToken,
}) {
  // Check if we have an existing valid token
  const existingToken = sandboxTokens?.[sandboxId];
  if (existingToken && isTokenValid(existingToken)) {
    return existingToken;
  }

  // Construct callback URL for auth if needed
  const callbackUrl = createOAuthCallbackUrl();
  return await dispatch(getSandboxAuthToken(sandboxId, callbackUrl));
}

/**
 * Create a new sandbox session
 */
export async function createSandboxSession(box, endRedirectUri) {
  const url = new URL('/sessions', DASHBOARD_API_URL);
  url.searchParams.append('box', box);
  if (endRedirectUri) {
    url.searchParams.append('end_redirect_uri', endRedirectUri);
  }

  const response = await fetch(url, {
    method: 'POST',
  });

  await handleErrors(response);
  return response.json();
}

/**
 * Get the OSM authorization URL for a session
 */
export function getOSMAuthorizationUrl(sessionId) {
  const url = new URL('/osm_authorization', DASHBOARD_API_URL);
  url.searchParams.append('session_id', sessionId);
  return url.toString();
}

/**
 * Get sandbox OAuth token for a session (one-time use)
 */
export async function getSandboxToken(sessionId) {
  const url = new URL(`/sessions/${sessionId}`, DASHBOARD_API_URL);

  const response = await fetch(url, {
    method: 'GET',
  });

  await handleErrors(response);
  return response.json();
}

/**
 * Fetch sandbox license info
 */
export async function fetchSandboxLicense(sandboxId) {
  const response = await fetch(`${DASHBOARD_API_URL}/v1/boxes/${sandboxId}`);
  await handleErrors(response);
  const result = await response.json();
  const license = result && result.license;

  if (!license) {
    throw new Error('Failed to get sandbox license info');
  }

  return license;
}
