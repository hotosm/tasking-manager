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

// @osm-sandbox/sandbox-id has no real ESM/CJS exports — it only assigns
// itself to window.iD as a side effect on import. Capture it here, right
// after the imports above force that assignment, so this module keeps its
// own private reference instead of the shared global, which
// @openstreetmap/id (imported by editor.js) later overwrites.
const sandboxID = window.iD;

export default function SandboxEditor({
  setDisable,
  comment,
  presets,
  imagery,
  sandboxId,
  gpxUrl,
  projectId,
  taskId,
  showOsmFeatures,
  osmLayerOpacity,
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

  const { data: osmFeatures } = useOsmFeaturesQuery(
    projectId,
    taskId,
    !!sandboxId && showOsmFeatures,
  );

  useSandboxOAuthCallback(sandboxId);

  const customSource =
    iDContext && iDContext.background() && iDContext.background().findSource('custom');

  useEffect(() => {
    if (!customImageryIsSet && imagery && customSource) {
      if (imagery.startsWith('http')) {
        iDContext.background().baseLayerSource(customSource.template(imagery));
        setCustomImageryIsSet(true);
        // this line is needed to update the value on the custom background dialog
        sandboxID.prefs('background-custom-template', imagery);
      } else {
        const imagerySource = iDContext.background().findSource(imagery);
        if (imagerySource) {
          iDContext.background().baseLayerSource(imagerySource);
        }
      }
    }
  }, [customImageryIsSet, imagery, iDContext, customSource]);

  // We need to keep the iD context on the redux store because iD works
  // better if the context isn't restarted while running in the same browser
  // session (reopening the same task shouldn't need a page reload to see
  // recently-saved edits). But this editor and the OSM iD editor can't
  // safely share a context — they're built by different iD forks, so a
  // context from the other editor is missing methods (e.g. this editor's
  // own `.license()`) the other editor never calls, and vice versa. Tag each
  // context with who built it, and only replace it when the type actually
  // changes.
  useEffect(() => {
    if (iDContext === null || iDContext.__idEditorType !== 'sandbox') {
      const context = sandboxID.coreContext();
      context.__idEditorType = 'sandbox';
      dispatch({ type: 'SET_EDITOR', context });
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
      if (
        !session ||
        !locale ||
        !iD ||
        !iDContext ||
        iDContext.__idEditorType !== 'sandbox' ||
        isInitialized
      ) {
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
            sandboxID.presetManager.addablePresetIDs(presets);
          } else {
            sandboxID.presetManager.addablePresetIDs(null);
          }
        } catch (e) {
          sandboxID.presetManager.addablePresetIDs(null);
        }

        // set up the context
        iDContext
          .embed(true)
          .license(license)
          .assetPath('/static/id/')
          .locale(locale)
          .setsDocumentTitle(false)
          .containerNode(document.getElementById('id-container'));

        // @osm-sandbox/sandbox-id has no dark theme of its own, but it shares the
        // "ideditor" root class with @openstreetmap/id, which does have one keyed
        // off the OS/browser's prefers-color-scheme. Force light explicitly so
        // this editor doesn't pick up a dark theme it was never styled for.
        iDContext.container().classed('theme-light', true);

        // init the ui or restart if it was loaded previously
        const isFreshContext = iDContext.ui() === undefined;
        if (isFreshContext) {
          iDContext.init();
        } else {
          iDContext.reset();
          iDContext.ui().restart();
        }

        iDContext.connection().switch({
          url: tokenData.sandbox_api_url,
          access_token: tokenData.access_token,
        });

        if (isFreshContext) {
          // The sandbox connection's tile/entity cache lives at module scope
          // in @osm-sandbox/sandbox-id, shared by every context built from
          // this package for the whole browser session — it isn't cleared
          // just because we built a brand new context object (e.g. after
          // switching away to the OSM iD editor and back). Only reset()
          // clears it, so call it here too or this fresh context can still
          // serve stale, pre-edit data for a task we already visited before.
          // init() already kicked off a tile fetch for the URL hash's
          // location (this task's own area), so reset() just aborted that
          // in-flight request — force a redraw of the current view (now
          // that the connection is switched to the right one above) so it
          // actually gets re-requested instead of staying blank.
          iDContext.reset();
          const map = iDContext.map();
          map.centerZoom(map.center(), map.zoom());
        }

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
        ...(gpxGeojson?.features || []).map((f, i) => ({
          ...f,
          id: f.id || `gpx-${i}`,
          __layerID__: 'gpx-features',
        })),
        ...(showOsmFeatures && osmFeatures?.features ? osmFeatures.features : []).map((f, i) => ({
          ...f,
          id:
            f.id ||
            (f.properties?.osm_id ? `osm-${f.properties.osm_id}` : `osm-${i}`),
          __layerID__: 'osm-features',
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
    if (!isInitialized || !iDContext) return;
    const container = document.getElementById('id-container');
    if (container) {
      const dataLayer = container.querySelector('.layer-data');
      if (dataLayer) {
        dataLayer.style.opacity = '';
      }
    }

    let styleEl = document.getElementById('osm-layer-opacity-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'osm-layer-opacity-style';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      #id-container .layer-data .osm-features {
        opacity: ${osmLayerOpacity ?? 1} !important;
      }
      #id-container .layer-data .gpx-features {
        opacity: 1 !important;
      }
      #id-container .layer-data text.osm-features,
      #id-container .layer-data .osm-features text {
        display: none;
      }

    `;

    return () => {
      const el = document.getElementById('osm-layer-opacity-style');
      if (el) {
        el.remove();
      }
    };
  }, [isInitialized, iDContext, osmLayerOpacity]);

  useEffect(() => {
    return () => {
      // Reset auth status for this sandbox on unmount
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

  return (
    <div className="w-100 vh-minus-69-ns relative">
      <div className="w-100 h-100" id="id-container"></div>
    </div>
  );
}
