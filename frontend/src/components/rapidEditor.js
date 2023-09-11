import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import { types } from '../store/actions/editor';

// We import from a CDN using a SEMVER minor version range
import { version as rapidVersion, name as rapidName } from '@rapideditor/rapid/package.json';

const baseCdnUrl = `https://cdn.jsdelivr.net/npm/${rapidName}@~${rapidVersion}/dist/`;
// We currently copy rapid files to the public/static/rapid directory. This should probably remain,
// since it can be useful for debugging rapid issues in the TM.
// const baseCdnUrl = '/static/rapid/';

/**
 * Check if two URL search parameters are semantically equal
 * @param {URLSearchParams} first
 * @param {URLSearchParams} second
 * @return {boolean} true if they are semantically equal
 */
function equalsUrlParameters(first, second) {
  if (first.size === second.size) {
    for (const [key, value] of first) {
      if (!second.has(key) || second.get(key) !== value) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Update the URL (this also fires a hashchange event)
 * @param {URLSearchParams} hashParams the URL hash parameters
 */
function updateUrl(hashParams) {
  const oldUrl = window.location.href;
  const newUrl = window.location.pathname + window.location.search + '#' + hashParams.toString();
  window.history.pushState(null, '', newUrl);
  window.dispatchEvent(
    new HashChangeEvent('hashchange', {
      newUrl: newUrl,
      oldUrl: oldUrl,
    }),
  );
}

/**
 * Generate the starting hash for the project
 * @param {string | undefined} comment The comment to use
 * @param {Array.<String> | undefined} presets The presets
 * @param {string | undefined} gpxUrl The task boundaries
 * @param {boolean | undefined} powerUser if the user should be shown advanced options
 * @param {string | undefined} imagery The imagery to use for the task
 * @return {module:url.URLSearchParams | boolean} the new URL search params or {@code false} if no parameters changed
 */
function generateStartingHash({ comment, presets, gpxUrl, powerUser, imagery }) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  if (comment) {
    hashParams.set('comment', comment);
  }
  if (gpxUrl) {
    hashParams.set('data', gpxUrl);
  }
  if (powerUser !== undefined) {
    hashParams.set('poweruser', powerUser.toString());
  }
  if (presets) {
    hashParams.set('presets', presets.join(','));
  }
  if (imagery) {
    if (imagery.startsWith('http')) {
      hashParams.set('background', 'custom:' + imagery);
    } else {
      hashParams.set('background', imagery);
    }
  }
  if (equalsUrlParameters(hashParams, new URLSearchParams(window.location.hash.substring(1)))) {
    return false;
  }
  return hashParams;
}

/**
 * Resize rapid
 * @param {Context} rapidContext The rapid context to resize
 * @type {import('@rapideditor/rapid').Context} Context
 */
function resizeRapid(rapidContext) {
  // Get rid of black bars when toggling the TM sidebar
  const uiSystem = rapidContext?.systems?.ui;
  if (uiSystem?.started) {
    uiSystem.resize();
  }
}

/**
 * Check if there are changes
 * @param changes The changes to check
 * @returns {boolean} {@code true} if there are changes
 */
function thereAreChanges(changes) {
  return changes.modified.length || changes.created.length || changes.deleted.length;
}

/**
 * Update the disable state for the sidebar map actions
 * @param {function(boolean)} setDisable
 * @param {EditSystem} editSystem The edit system
 * @type {import('@rapideditor/rapid/modules').EditSystem} EditSystem
 */
function updateDisableState(setDisable, editSystem) {
  if (thereAreChanges(editSystem.changes())) {
    setDisable(true);
  } else {
    setDisable(false);
  }
}

/**
 * Create a new RapidEditor component
 * @param {function(boolean)} setDisable
 * @param {string} comment The default changeset comment
 * @param {[string]|null|undefined} presets The presets to allow the user to use
 * @param {string|null|undefined} imagery The imagery to default to for the user
 * @param {string} gpxUrl The task boundary url
 * @param {boolean} powerUser true if the user should be shown advanced options
 * @param {boolean} showSidebar Changes are used to resize the Rapid mapview
 * @returns {JSX.Element} The element to add to the DOM
 * @constructor
 */
function RapidEditor({
  setDisable,
  comment,
  presets,
  imagery,
  gpxUrl,
  powerUser = false,
  showSidebar = true,
}) {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const [rapidLoaded, setRapidLoaded] = useState(window.Rapid !== undefined);
  const { context, dom } = useSelector((state) => state.editor.rapidContext);
  const locale = useSelector((state) => state.preferences.locale);
  const windowInit = typeof window !== 'undefined';

  // This significantly reduces build time _and_ means different TM instances can share the same download of Rapid.
  // Unfortunately, Rapid doesn't use a public CDN itself, so we cannot reuse that.
  useEffect(() => {
    if (!rapidLoaded && !context) {
      // Add the style element
      const style = document.createElement('link');
      style.setAttribute('type', 'text/css');
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', baseCdnUrl + 'rapid.css');
      document.head.appendChild(style);
      // Now add the editor
      const script = document.createElement('script');
      script.src = baseCdnUrl + 'rapid.js';
      script.async = true;
      script.onload = () => setRapidLoaded(true);
      document.body.appendChild(script);
    } else if (context && !rapidLoaded) {
      setRapidLoaded(true);
    }
  }, [rapidLoaded, setRapidLoaded, context]);

  useEffect(() => {
    return () => {
      dispatch({ type: 'SET_VISIBILITY', isVisible: true });
    };
  });

  useEffect(() => {
    if (windowInit && context === null && rapidLoaded) {
      /* This is used to avoid needing to re-initialize Rapid on every page load -- this can lead to jerky movements in the UI */
      const dom = document.createElement('div');
      dom.className = 'w-100 vh-minus-69-ns';
      // we need to keep Rapid context on redux store because Rapid works better if
      // the context is not restarted while running in the same browser session
      // Unfortunately, we need to recreate the context every time we recreate the rapid-container dom node.
      const context = new window.Rapid.Context();
      context.embed(true);
      context.containerNode = dom;
      context.assetPath = baseCdnUrl;
      context.apiConnections = [
        {
          url: OSM_SERVER_URL,
          client_id: OSM_CLIENT_ID,
          client_secret: OSM_CLIENT_SECRET,
          redirect_uri: OSM_REDIRECT_URI,
        },
      ];
      dispatch({ type: types.SET_RAPIDEDITOR, context: { context, dom } });
    }
  }, [windowInit, rapidLoaded, context, dispatch]);

  useEffect(() => {
    if (context) {
      // setup the context
      context.locale = locale;
    }
  }, [context, locale]);

  // This ensures that Rapid has the correct map size
  useEffect(() => {
    // This might be a _slight_ efficiency improvement by making certain that Rapid isn't painting unneeded items
    resizeRapid(context);
    // This is the only bit that is *really* needed -- it prevents black bars when hiding the sidebar.
    return () => resizeRapid(context);
  }, [showSidebar, context]);

  useEffect(() => {
    const newParams = generateStartingHash({ comment, presets, gpxUrl, powerUser, imagery });
    if (newParams) {
      updateUrl(newParams);
    }
  }, [comment, presets, gpxUrl, powerUser, imagery]);

  useEffect(() => {
    const containerRoot = document.getElementById('rapid-container-root');
    const editListener = () => updateDisableState(setDisable, context.systems.edits);
    if (context && dom) {
      containerRoot.appendChild(dom);
      // init the ui or restart if it was loaded previously
      let promise;
      if (context?.systems?.ui !== undefined) {
        // Currently commented out in Rapid source code (2023-07-20)
        // RapidContext.systems.ui.restart();
        resizeRapid(context);
        promise = Promise.resolve();
      } else {
        promise = context.initAsync();
      }

      /* Perform tasks after Rapid has started up */
      promise.then(() => {
        /* Keep track of edits */
        const editSystem = context.systems.edits;

        editSystem.on('change', editListener);
        editSystem.on('reset', editListener);
      });
    }
    return () => {
      if (containerRoot?.childNodes && dom in containerRoot.childNodes) {
        document.getElementById('rapid-container-root')?.removeChild(dom);
      }
      if (context?.systems?.edits) {
        const editSystem = context.systems.edits;
        editSystem.off('change', editListener);
        editSystem.off('reset', editListener);
      }
    };
  }, [dom, context, setDisable]);

  useEffect(() => {
    if (context) {
      return () => context.save();
    }
  }, [context]);

  useEffect(() => {
    if (context && session) {
      context.preauth = {
        url: OSM_SERVER_URL,
        client_id: OSM_CLIENT_ID,
        client_secret: OSM_CLIENT_SECRET,
        redirect_uri: OSM_REDIRECT_URI,
        access_token: session.osm_oauth_token,
      };
      context.apiConnections = [context.preauth];
    }
  }, [context, session, session?.osm_oauth_token]);

  return <div className="w-100 vh-minus-69-ns" id="rapid-container-root"></div>;
}

export { RapidEditor, generateStartingHash, equalsUrlParameters, updateUrl };
export default RapidEditor;
