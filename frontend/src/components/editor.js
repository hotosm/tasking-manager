import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as iD from '@openstreetmap/id';
import '@openstreetmap/id/dist/iD.css';

import { OSM_CLIENT_ID, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import messages from './messages';

// @openstreetmap/id has no real ESM/CJS exports — it only assigns itself to
// window.iD as a side effect on import. Capture it here, right after the
// import above forces that assignment, so this module keeps its own private
// reference instead of the shared global, which @osm-sandbox/sandbox-id
// (imported by sandboxEditor.js) later overwrites.
const officialID = window.iD;

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

  // We need to keep the iD context on the redux store because iD works
  // better if the context isn't restarted while running in the same browser
  // session (reopening the same task shouldn't need a page reload to see
  // recently-saved edits). But the Sandbox editor and this editor can't
  // safely share a context — they're built by different iD forks, so a
  // context from the other editor is missing methods (e.g. Sandbox's
  // `.license()`) this editor never calls, and vice versa. Tag each context
  // with who built it, and only replace it when the type actually changes.
  useEffect(() => {
    if (windowInit && (iDContext === null || iDContext.__idEditorType !== 'official')) {
      const context = officialID.coreContext();
      context.__idEditorType = 'official';
      dispatch({ type: 'SET_EDITOR', context });
    }
  }, [windowInit, iDContext, dispatch]);

  useEffect(() => {
    if (iDContext && comment) {
      iDContext.defaultChangesetComment(comment);
    }
  }, [comment, iDContext]);

  useEffect(() => {
    if (session && locale && iD && iDContext && iDContext.__idEditorType === 'official') {
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
      const isFreshContext = iDContext.ui() === undefined;
      if (isFreshContext) {
        iDContext.init();
      } else {
        iDContext.reset();
        iDContext.ui().restart();
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

      if (isFreshContext) {
        // The OSM connection's tile/entity cache lives at module scope in
        // @openstreetmap/id, shared by every context built from this
        // package for the whole browser session — it isn't cleared just
        // because we built a brand new context object (e.g. after
        // switching away to the Sandbox editor and back). Only reset()
        // clears it, so call it here too or this fresh context can still
        // serve stale, pre-edit data for a task we already visited before.
        // init() already kicked off a tile fetch for the URL hash's
        // location (this task's own area), so reset() just aborted that
        // in-flight request — force a redraw of the current view (now that
        // auth is switched to the right one above) so it actually gets
        // re-requested instead of staying blank.
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
    }
  }, [session, iDContext, setDisable, presets, locale, gpxUrl, intl]);

  return <div className="w-100 vh-minus-69-ns" id="id-container"></div>;
}
