import { useEffect, useLayoutEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as iD from '@openstreetmap/id';
import '@openstreetmap/id/dist/iD.css';

import { OSM_CLIENT_ID, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import messages from './messages';
import {
  registerIdEditorStylesheet,
  activateIdEditorStylesheet,
} from '../utils/idEditorStylesheets';

// @openstreetmap/id has no real ESM/CJS exports — it only assigns itself to
// window.iD as a side effect on import. Capture it here, right after the
// import above forces that assignment, so this module keeps its own private
// reference instead of the shared global, which @osm-sandbox/sandbox-id
// (imported by sandboxEditor.js) later overwrites.
const officialID = window.iD;

registerIdEditorStylesheet('official');

export default function Editor({ setDisable, comment, presets, imagery, gpxUrl, extraIdParams }) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const session = useSelector((state) => state.auth.session);
  const iDContext = useSelector((state) => state.editor.context);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const windowInit = typeof window !== 'undefined';
  const customSource =
    iDContext && iDContext.background() && iDContext.background().findSource('custom');

  // Only one of the OSM iD editor / Sandbox editor is ever mounted at a
  // time, but both of their stylesheets stay loaded for the whole page
  // session once visited. Disable the other one's so its rules can't leak
  // into this editor via their shared ".ideditor" root class.
  useLayoutEffect(() => {
    activateIdEditorStylesheet('official');
  }, []);

  useEffect(() => {
    if (!customImageryIsSet && imagery && customSource) {
      if (imagery.startsWith('http')) {
        iDContext.background().baseLayerSource(customSource.template(imagery));
        setCustomImageryIsSet(true);
        // this line is needed to update the value on the custom background dialog
        officialID.prefs('background-custom-template', imagery);
      } else {
        const imagerySource = iDContext.background().findSource(imagery);
        if (imagerySource) {
          iDContext.background().baseLayerSource(imagerySource);
        }
      }
    }

    // wait till iDContext loads background
    if (!iDContext?.background()) return;

    // this fixes the custom imagery persisting from previous load
    // when no imagery is selected in project setting
    if (!imagery) {
      // set Bing as default
      const imagerySource = iDContext.background().findSource('Bing');
      if (!imagerySource) return;
      iDContext.background().baseLayerSource(imagerySource);
    }

    // this sets imagery offset from extraIdParams if present
    if (extraIdParams) {
      const params = new URLSearchParams(extraIdParams);
      const offsetStr = params.get('offset'); // "10,-10"
      if (!offsetStr) return;
      const offsetInMeters = offsetStr.split(',').map(Number); // [10, -10]
      const offset = officialID.geoMetersToOffset(offsetInMeters);
      iDContext.background().offset(offset);
    } else {
      // reset offset if params not present
      // this is needed to fix the offset persisting from previous project issue
      iDContext.background().offset([0, 0]);
    }
  }, [customImageryIsSet, imagery, iDContext, customSource, extraIdParams]);

  useEffect(() => {
    if (windowInit) {
      if (iDContext === null) {
        // we need to keep iD context on redux store because iD works better if
        // the context is not restarted while running in the same browser session
        dispatch({ type: 'SET_EDITOR', context: officialID.coreContext() });
      }
    }
  }, [windowInit, iDContext, dispatch]);

  // Reset context on unmount so the sandbox editor always gets a fresh context
  // from its own iD module (sandbox-id), preventing cross-editor context bleed.
  useEffect(() => {
    return () => {
      dispatch({ type: 'SET_EDITOR', context: null });
    };
  }, [dispatch]);

  useEffect(() => {
    if (iDContext && comment) {
      iDContext.defaultChangesetComment(comment);
    }
  }, [comment, iDContext]);

  useEffect(() => {
    if (session && locale && iD && iDContext) {
      // if presets is not a populated list we need to set it as null
      try {
        if (presets.length) {
          officialID.presetManager.addablePresetIDs(presets);
        } else {
          officialID.presetManager.addablePresetIDs(null);
        }
      } catch (e) {
        officialID.presetManager.addablePresetIDs(null);
      }
      // setup the context
      iDContext
        .embed(true)
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
        fetch(gpxUrl)
          .then((response) => response.text())
          .then((data) => {
            let gpxData = new DOMParser().parseFromString(data, 'text/xml');
            let nameNode = gpxData.getElementsByTagName('trk')[0].childNodes[0];
            let projectId = nameNode.textContent.match(/\d+/g);
            nameNode.textContent = intl.formatMessage(messages.gpxNameAttribute, {
              projectId: projectId[0],
            });
            iDContext.layers().layer('data').geojson(gpx(gpxData));
          })
          .catch((error) => {
            console.error('Error loading GPX data');
          });
      }

      let osm = iDContext.connection();
      var auth = {
        url: OSM_SERVER_URL,
        client_id: OSM_CLIENT_ID,
        redirect_uri: OSM_REDIRECT_URI,
        access_token: session.osm_oauth_token,
      };
      osm.switch(auth);

      const thereAreChanges = (changes) =>
        changes.modified.length || changes.created.length || changes.deleted.length;

      iDContext.history().on('change', () => {
        if (thereAreChanges(iDContext.history().changes())) {
          setDisable(true);
        } else {
          setDisable(false);
        }
      });
    }
  }, [session, iDContext, setDisable, presets, locale, gpxUrl, intl]);

  return <div className="w-100 vh-minus-69-ns" id="id-container"></div>;
}
