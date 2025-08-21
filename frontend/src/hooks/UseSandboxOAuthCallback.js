import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { completeSandboxAuth } from '../store/actions/auth';
import { cleanOAuthCallbackUrl } from '../utils/sandboxUtils';

export function useSandboxOAuthCallback(sandboxId) {
  const dispatch = useDispatch();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Skip if already processed
      if (processedRef.current) {
        return;
      }
      
      const sessionId = new URLSearchParams(window.location.search).get('session_id');
      if (!sessionId) {
        return;
      }      
      processedRef.current = true;

      try {
        await dispatch(completeSandboxAuth(sessionId, sandboxId));
        cleanOAuthCallbackUrl('session_id');
      } catch (error) {
        // Keep processedRef.current = true to prevent retry loops
        throw error;
      }
    };

    handleOAuthCallback();
  }, [dispatch, sandboxId]);
}
