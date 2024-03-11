import { handleErrors } from '../utils/promise';
import { API_URL, OHSOME_STATS_TOKEN } from '../config';

/**
 * Fetch data from an external JSON API
 * @param {string} url The url to fetch from
 * @param {boolean} [isSetToken=false] Set if we need to send the {@link OHSOME_STATS_TOKEN} as the authorization parameter
 * @param {RequestInit} [init={}}] Any specific init options you want to pass the fetch (such as an {@link AbortSignal})
 * @returns {Promise<*>} A promise that returns a JSON or an error
 */
export function fetchExternalJSONAPI(url, isSetToken = false, init = {}): Promise<*> {
  if (!init.headers) {
    init.headers = {};
  }
  // Passing token only for ohsomeNow stats
  if (isSetToken) {
    init.headers['Authorization'] = `Basic ${OHSOME_STATS_TOKEN}`;
  }
  init.headers['Content-Type'] = 'application/json';

  return fetch(url, {
    method: 'GET',
    ...init,
  })
    .then(handleErrors)
    .then((res) => {
      return res.json();
    });
}

export function fetchLocalJSONAPI(endpoint, token, method = 'GET', language = 'en'): Promise<*> {
  const url = new URL(endpoint, API_URL);
  let headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language.replace('-', '_'),
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return fetch(url, {
    method: method,
    headers: headers,
  })
    .then(handleErrors)
    .then((res) => {
      return res.json();
    });
}

export function fetchLocalJSONAPIWithAbort(
  endpoint,
  token,
  signal,
  method = 'GET',
  language = 'en',
) {
  const url = new URL(endpoint, API_URL);
  let headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language.replace('-', '_'),
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return fetch(url, {
    method: method,
    headers: headers,
    signal: signal,
  })
    .then(handleErrors)
    .then((res) => {
      return res.json();
    });
}

export function pushToLocalJSONAPI(
  endpoint,
  payload,
  token,
  method = 'POST',
  language = 'en',
): Promise<*> {
  const url = new URL(endpoint, API_URL);
  return fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': language.replace('-', '_'),
      Authorization: `Token ${token}`,
    },
    body: payload,
  })
    .then(handleErrors)
    .then((res) => {
      return res.json();
    });
}
