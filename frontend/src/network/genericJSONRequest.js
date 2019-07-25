import { handleErrors } from '../utils/promise';
import { API_URL } from '../config';


export function fetchExternalJSONAPI(url): Promise<*> {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}


export function fetchLocalJSONAPI(endpoint): Promise<*> {
  // remove backslashes initial and final backslashes
  endpoint = endpoint.startsWith('/') ? endpoint.substr(1,endpoint.length) : endpoint;
  endpoint = endpoint.endsWith('/') ? endpoint.substr(0,endpoint.length-1) : endpoint;

  return fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(handleErrors)
    .then(res => {
      return res.json();
    });
}
