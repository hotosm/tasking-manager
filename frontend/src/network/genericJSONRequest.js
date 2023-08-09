import { handleErrors } from '../utils/promise';
import { API_URL, OHSOME_STATS_TOKEN } from '../config';

export function fetchExternalJSONAPI(url, isSetToken = false): Promise<*> {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Passing token only for ohsomeNow stats
  if (isSetToken) {
    headers['Authorization'] = `Basic ${OHSOME_STATS_TOKEN}`;
  }

  return fetch(url, {
    method: 'GET',
    headers: headers,
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
