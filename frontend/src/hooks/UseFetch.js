import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { useInterval } from './UseInterval';

export const useFetch = url => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetchLocalJSONAPI(url, token);
        setData(response);
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    })();
  }, [url, token]);
  return [error, loading, data];
};

export function useFetchIntervaled(url, delay) {
  const token = useSelector(state => state.auth.get('token'));
  const [data, setData] = useState();
  const [error, setError] = useState(null);
  useInterval(() => {
    (async () => {
      try {
        const response = await fetchLocalJSONAPI(url, token);
        setData(response);
      } catch (e) {
        setError(e);
      }
    })();
  }, delay);
  return [error, data];
}
