import axios from 'axios';

import { API_URL } from '../config';

const api = (token, locale) => {
  const instance = axios.create({
    baseURL: API_URL.toString(),
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }),
      ...(locale && { 'Accept-Language': locale.replace('-', '_') || 'en' }),
    },
  });
  return instance;
};

export default api;
