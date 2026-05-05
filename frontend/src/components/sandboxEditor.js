import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as iD from '@osm-sandbox/sandbox-id';
import '@osm-sandbox/sandbox-id/dist/iD.css';

import messages from './messages';
import {
  getSandboxAuthToken,
  setSandboxAuthError,
  setSandboxAuthStatus,
} from '../store/actions/auth';
import { useSandboxOAuthCallback } from '../hooks/UseSandboxOAuthCallback';
import { getValidTokenOrInitiateAuth, fetchSandboxLicense } from '../utils/sandboxUtils';
import { useOsmFeaturesQuery } from '../api/projects';

export default function SandboxEditor({
  setDisable,
  comment,
  presets,
  imagery,
  sandboxId,
  gpxUrl,
  projectId,
  taskId,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const intl = useIntl();
  const session = useSelector((state) => state.auth.session);
  const sandboxTokens = useSelector((state) => state.auth.sandboxTokens);
  const sandboxAuthError = useSelector((state) => state.auth.sandboxAuthError);
  const sandboxAuthStatus = useSelector((state) => state.auth.sandboxAuthStatus);
  const iDContext = useSelector((state) => state.editor.context);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gpxGeojson, setGpxGeojson] = useState(null);
  const [showOsmFeatures, setShowOsmFeatures] = useState(false);

  const { data: osmFeatures, isError: osmFeaturesError } = useOsmFeaturesQuery(projectId, taskId, !!sandboxId);

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
    if (gpxUrl) {
      fetch(gpxUrl)
        .then((response) => response.text())
        .then((data) => {
          let gpxData = new DOMParser().parseFromString(data, 'text/xml');
          let trkNode = gpxData.getElementsByTagName('trk')[0];
          if (trkNode) {
            let nameNode = trkNode.childNodes[0];
            let id = nameNode.textContent.match(/\d+/g);
            nameNode.textContent = intl.formatMessage(messages.gpxNameAttribute, {
              projectId: id ? id[0] : projectId,
            });
          }
          setGpxGeojson(gpx(gpxData));
        })
        .catch((error) => {
          console.error('Error loading GPX data');
        });
    }
  }, [gpxUrl, intl, projectId]);

  useEffect(() => {
    if (isInitialized && iDContext && (osmFeatures || gpxGeojson)) {
      // Assign stable IDs to ensure iD can maintain hover/select states
      const features = [
        ...(gpxGeojson?.features || []).map((f, i) => ({ ...f, id: f.id || `gpx-${i}` })),
        ...(showOsmFeatures && osmFeatures?.features ? osmFeatures.features : []).map((f) => ({
          ...f,
          id:
            f.id ||
            (f.properties?.osm_id ? `osm-${f.properties.osm_id}` : `osm-gen-${Math.random()}`),
        })),
      ];

      if (features.length > 0 || (gpxGeojson && !showOsmFeatures)) {
        iDContext.layers().layer('data').geojson({
          type: 'FeatureCollection',
          features: features,
        });
      }
    }
  }, [isInitialized, iDContext, osmFeatures, gpxGeojson, showOsmFeatures]);

  useEffect(() => {
    if (isInitialized && iDContext) {
      const injectButton = () => {
        if (document.getElementById('osm-features-toggle')) return true;

        // Find the undo button - we want to insert our button inside the same group
        const undoButton =
          document.querySelector('.undo-button') ||
          document.querySelector('.undo');

        if (undoButton) {
          const group = undoButton.parentElement;
          const button = document.createElement('button');
          button.id = 'osm-features-toggle';
          // Use bar-button base class only — don't inherit undo's disabled state
          button.className = 'bar-button';
          button.disabled = false;
          button.title = 'Toggle OSM Features Overlay';
          button.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer !important;
          `;
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 8 8">
              <path fill="currentColor" d="M4.03 0c-2.53 0-4.03 3-4.03 3s1.5 3 4.03 3c2.47 0 3.97-3 3.97-3s-1.5-3-3.97-3zm-.03 1c1.11 0 2 .9 2 2 0 1.11-.89 2-2 2-1.1 0-2-.89-2-2 0-1.1.9-2 2-2zm0 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.04-.19-.06-.28-.08.16-.24.28-.44.28-.28 0-.5-.22-.5-.5 0-.2.12-.36.28-.44-.09-.03-.18-.06-.28-.06z" transform="translate(0 1)"></path>
            </svg>
          `;
          button.onclick = () => setShowOsmFeatures((prev) => !prev);
          // Insert before the undo button, inside the same group
          group.insertBefore(button, undoButton);
          // Apply initial visibility based on current osmFeatures state
          const hasData = osmFeatures?.features?.length > 0;
          button.style.display = hasData && !osmFeaturesError ? 'inline-flex' : 'none';
          return true;
        }
        return false;
      };

      // Try immediately
      if (!injectButton()) {
        // If not found, check every 500ms for up to 10 seconds
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (injectButton() || attempts > 20) {
            clearInterval(interval);
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }
  }, [isInitialized, iDContext, osmFeatures, osmFeaturesError]);

  useEffect(() => {
    const btn = document.getElementById('osm-features-toggle');
    if (btn) {
      if (showOsmFeatures) {
        btn.dataset.active = 'true';
        btn.style.background = '#11120B';
        btn.style.color = '#fff';
        btn.style.borderColor = '#11120B';
      } else {
        btn.dataset.active = 'false';
        btn.style.background = '#fff';
        btn.style.color = '#3d3d3d';
        btn.style.borderColor = '#d8dae4';
      }
    }
  }, [showOsmFeatures]);

  useEffect(() => {
    const btn = document.getElementById('osm-features-toggle');
    if (!btn) return;
    const hasData = osmFeatures?.features?.length > 0;
    if (!hasData || osmFeaturesError) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  }, [osmFeatures, osmFeaturesError]);

  useEffect(() => {
    return () => {
      dispatch(setSandboxAuthStatus(sandboxId, 'idle'));
      // Clean up injected button to prevent stale closures on re-mount
      const btn = document.getElementById('osm-features-toggle');
      if (btn) btn.remove();
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

  return (
    <div className="w-100 vh-minus-69-ns relative">
      <div className="w-100 h-100" id="id-container"></div>
    </div>
  );
}
