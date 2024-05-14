import { useEffect } from 'react';

export function useOnResize(ref, handler) {
  useEffect(
    () => {
      const listener = () => {
        handler();
      };

      window.addEventListener('resize', listener);

      return () => {
        window.removeEventListener('resize', listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler],
  );
}
