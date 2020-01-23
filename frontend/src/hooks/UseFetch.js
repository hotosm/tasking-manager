import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { useInterval } from './UseInterval';

export const useFetch = (url, trigger = true) => {
  const token = useSelector(state => state.auth.get('token'));
  const locale = useSelector(state => state.preferences['locale']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  useEffect(() => {
    (async () => {
      if (trigger) {
        setLoading(true);
        try {
          const response = await fetchLocalJSONAPI(url, token, 'GET', locale);
          setData(response);
        } catch (e) {
          setError(e);
        }
        setLoading(false);
      }
    })();
  }, [url, token, trigger, locale]);
  return [error, loading, data];
};

export function useFetchIntervaled(url, delay, trigger = true) {
  const token = useSelector(state => state.auth.get('token'));
  const locale = useSelector(state => state.preferences['locale']);
  const [data, setData] = useState();
  const [error, setError] = useState(null);
  useInterval(() => {
    (async () => {
      if (trigger) {
        try {
          const response = await fetchLocalJSONAPI(url, token, 'GET', locale);
          setData(response);
        } catch (e) {
          setError(e);
        }
      }
    })();
  }, delay);
  return [error, data];
}
