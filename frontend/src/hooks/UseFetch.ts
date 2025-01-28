import { useCallback, useEffect, useState } from 'react';
import { useTypedSelector } from '@Store/hooks';

import { fetchLocalJSONAPI, fetchLocalJSONAPIWithAbort } from '../network/genericJSONRequest';
import { useInterval } from './UseInterval';

export const useFetch = (url: string, trigger: boolean = true) => {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences['locale']);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown>({});

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
          if (e instanceof Error) {
            setError(e.message);
            setLoading(false);
          }
        }
      }
    })();
  }, [url, token, trigger, locale]);
  return [error, loading, data];
};

export const useFetchWithAbort = <T extends object>(url: string, trigger: boolean = true) => {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences['locale']);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  // Component using refetch would infinitely make requests
  // without the useCallback
  const refetch = useCallback(() => {
    setRefetchIndex((prevRefetchIndex) => prevRefetchIndex + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      if (trigger) {
        refetchIndex === 0 && setLoading(true);
        try {
          // replace in locale is needed because the backend uses underscore instead of dash
          const response = await fetchLocalJSONAPIWithAbort(
            url,
            token,
            signal,
            'GET',
            locale ? locale.replace('-', '_') : 'en',
          );
          setData(response);
          setLoading(false);
        } catch (e) {
          if (signal.aborted) return;
          if (e instanceof Error) {
            setError(e.message);
            setLoading(false);
          }
        }
      }
    })();
    return () => controller.abort();
  }, [url, token, trigger, locale, refetchIndex]);

  return [error, loading, data, refetch] as const;
};

export function useFetchIntervaled(url: string, delay: number, trigger = true) {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences['locale']);
  const [data, setData] = useState();
  const [error, setError] = useState<null | string>(null);

  useInterval(() => {
    (async () => {
      if (trigger && document.visibilityState === 'visible') {
        try {
          // replace in locale is needed because the backend uses underscores instead of dashes
          const response = await fetchLocalJSONAPI(url, token, 'GET', locale.replace('-', '_'));
          setData(response);
        } catch (e) {
          if (e instanceof Error) {
            if (e.name === 'AbortError') {
              return;
            }
            setError(e.message);
          }
        }
      }
    })();
  }, delay);
  return [error, data];
}
