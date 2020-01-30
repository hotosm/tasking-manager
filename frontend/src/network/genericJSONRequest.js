import { handleErrors } from '../utils/promise';
import { API_URL, OSM_STATS_URL } from '../config';

export function fetchExternalJSONAPI(url): Promise<*> {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}

export function wrapPromise(promise) {
  let status = 'pending';
  let result = '';
  let suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      }

      return result;
    },
  };
}

export const fetchOSMStatsAPI = path => {
  const url = new URL(path, OSM_STATS_URL);

  return fetch(url).then(x => x.json());
};

export function fetchLocalJSONAPI(endpoint, token, method = 'GET', language = 'en'): Promise<*> {
  const url = new URL(endpoint, API_URL);
  let headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return fetch(url, {
    method: method,
    headers: headers,
  })
    .then(handleErrors)
    .then(res => {
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
      'Accept-Language': language,
      Authorization: `Token ${token}`,
    },
    body: payload,
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}
