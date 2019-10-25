import { useEffect, useState } from 'react';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export const useFetch = url => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetchLocalJSONAPI(url);
        setData(response);
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    })();
  }, [url]);
  return [error, loading, data];
};
