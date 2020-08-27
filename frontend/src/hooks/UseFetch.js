import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { useInterval } from './UseInterval';

export const useFetch = (url, trigger = true) => {
  const token = useSelector((state) => state.auth.get('token'));
  const locale = useSelector((state) => state.preferences['locale']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    (async () => {
      if (trigger) {
        setLoading(true);
        try {
          // replace in locale is needed because the backend uses underscore instead of dash
          const response = await fetchLocalJSONAPI(
            url,
            token,
            'GET',
            locale ? locale.replace('-', '_') : 'en',
          );
          setData(response);
          setLoading(false);
        } catch (e) {
          setError(e);
          setLoading(false);
        }
      }
    })();
  }, [url, token, trigger, locale]);
  return [error, loading, data];
};

export function useFetchIntervaled(url, delay, trigger = true) {
  const token = useSelector((state) => state.auth.get('token'));
  const locale = useSelector((state) => state.preferences['locale']);
  const [data, setData] = useState();
  const [error, setError] = useState(null);

  useInterval(() => {
    (async () => {
      if (trigger && document.visibilityState === 'visible') {
        try {
          // replace in locale is needed because the backend uses underscores instead of dashes
          const response = await fetchLocalJSONAPI(url, token, 'GET', locale.replace('-', '_'));
          setData(response);
        } catch (e) {
          setError(e);
        }
      }
    })();
  }, delay);
  return [error, data];
}
