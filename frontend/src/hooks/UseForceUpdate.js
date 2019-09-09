import { useState, useCallback } from 'react';

/* inspired by https://github.com/CharlesStover/use-force-update */
export const useForceUpdate = () => {
  const [forced, dispatch] = useState(Object.create(null));

  /* Turn dispatch(required_parameter) into dispatch(). */
  const memoizedDispatch = useCallback(() => {
    dispatch(Object.create(null));
  }, [dispatch]);
  return [forced, memoizedDispatch];
};

export default useForceUpdate;
