import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import * as iD from '@osm-sandbox/sandbox-id';
import '@osm-sandbox/sandbox-id/dist/iD.css';

import {
  getSandboxAuthToken,
  setSandboxAuthError,
  setSandboxAuthStatus,
} from '../store/actions/auth';
import { useSandboxOAuthCallback } from '../hooks/UseSandboxOAuthCallback';
import { getValidTokenOrInitiateAuth, fetchSandboxLicense } from '../utils/sandboxUtils';

export default function SandboxEditor({
  setDisable,
  comment,
  presets,
  imagery,
  sandboxId,
  gpxUrl,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector((state) => state.auth.session);
  const sandboxTokens = useSelector((state) => state.auth.sandboxTokens);
  const sandboxAuthError = useSelector((state) => state.auth.sandboxAuthError);
  const sandboxAuthStatus = useSelector((state) => state.auth.sandboxAuthStatus);
  const iDContext = useSelector((state) => state.editor.context);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useSandboxOAuthCallback(sandboxId);

  const customSource =
    iDContext && iDContext.background() && iDContext.background().findSource('custom');

  useEffect(() => {
    if (!customImageryIsSet && imagery && customSource) {
      if (imagery.startsWith('http')) {
        iDContext.background().baseLayerSource(customSource.template(imagery));
        setCustomImageryIsSet(true);
        // this line is needed to update the value on the custom background dialog
        window.iD.prefs('background-custom-template', imagery);
      } else {
        const imagerySource = iDContext.background().findSource(imagery);
        if (imagerySource) {
          iDContext.background().baseLayerSource(imagerySource);
        }
      }
    }
  }, [customImageryIsSet, imagery, iDContext, customSource]);

  useEffect(() => {
    if (iDContext === null) {
      // we need to keep iD context on redux store because iD works better if
      // the context is not restarted while running in the same browser session
      dispatch({ type: 'SET_EDITOR', context: window.iD.coreContext() });
    }
  }, [iDContext, dispatch]);

  useEffect(() => {
    if (iDContext && comment) {
      iDContext.defaultChangesetComment(comment);
    }
  }, [comment, iDContext]);

  // Initialize sandbox editor
  useEffect(() => {
    const initializeSandbox = async () => {
      if (!session || !locale || !iD || !iDContext || isInitialized) {
        return;
      }
      const authStatus = sandboxAuthStatus?.[sandboxId];
      if (authStatus === 'in_progress' || authStatus === 'failed') {
        return;
      }

      try {
        const tokenData = await getValidTokenOrInitiateAuth({
          dispatch,
          sandboxId,
          sandboxTokens,
          getSandboxAuthToken,
          authStatus,
        });

        if (!tokenData) {
          // auth flow was initiated (user will be redirected)
          return;
        }

        // fetch sandbox license info
        const license = await fetchSandboxLicense(sandboxId);

        // set up presets
        try {
          if (presets && presets.length) {
            window.iD.presetManager.addablePresetIDs(presets);
          } else {
            window.iD.presetManager.addablePresetIDs(null);
          }
        } catch (e) {
          window.iD.presetManager.addablePresetIDs(null);
        }

        // set up the context
        iDContext
          .embed(true)
          .license(license)
          .assetPath('/static/id/')
          .locale(locale)
          .setsDocumentTitle(false)
          .containerNode(document.getElementById('id-container'));

        // init the ui or restart if it was loaded previously
        if (iDContext.ui() !== undefined) {
          iDContext.reset();
          iDContext.ui().restart();
        } else {
          iDContext.init();
        }

        if (gpxUrl) {
          iDContext.layers().layer('data').url(gpxUrl, '.gpx');
        }

        iDContext.connection().switch({
          url: tokenData.sandbox_api_url,
          access_token: tokenData.access_token,
        });

        const thereAreChanges = (changes) =>
          changes.modified.length || changes.created.length || changes.deleted.length;

        iDContext.history().on('change', () => {
          if (thereAreChanges(iDContext.history().changes())) {
            setDisable(true);
          } else {
            setDisable(false);
          }
        });

        setIsInitialized(true);
      } catch (error) {
        dispatch(setSandboxAuthError(error?.message));
      }
    };

    initializeSandbox();
  }, [
    session,
    iDContext,
    setDisable,
    presets,
    locale,
    gpxUrl,
    sandboxId,
    sandboxTokens,
    dispatch,
    isInitialized,
    sandboxAuthStatus,
  ]);

  useEffect(() => {
    return () => {
      dispatch(setSandboxAuthStatus(sandboxId, 'idle'));
    };
  }, [dispatch, sandboxId]);

  // Show error message if authentication failed
  if (sandboxAuthError) {
    return (
      <div className="w-100 vh-minus-69-ns flex items-center justify-center">
        <div className="bg-washed-red pa4 br2 ma3">
          <h3 className="red mt0">Sandbox Connection Error</h3>
          <p className="mt2 mb3">{sandboxAuthError}</p>
          <button
            className="bg-red white pa2 br2 bn pointer dim mr2"
            onClick={() => {
              dispatch({ type: 'CLEAR_SANDBOX_AUTH_ERROR' });
              dispatch(setSandboxAuthStatus(sandboxId, 'idle'));
              window.location.reload();
            }}
          >
            Retry
          </button>
          <button
            className="bg-red white pa2 br2 bn pointer dim"
            onClick={() => {
              dispatch({ type: 'CLEAR_SANDBOX_AUTH_ERROR' });
              dispatch(setSandboxAuthStatus(sandboxId, 'idle'));
              navigate('/');
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return <div className="w-100 vh-minus-69-ns" id="id-container"></div>;
}
