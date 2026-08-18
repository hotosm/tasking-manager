import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as iD from '@openstreetmap/id';
import '@openstreetmap/id/dist/iD.css';

import { OSM_CLIENT_ID, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import messages from './messages';
import {
  captureIdEditorPackage,
  removeUnavailableImagerySources,
  resolveIdEditorContext,
} from '../utils/idEditorContext';

const officialID = captureIdEditorPackage();

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

  useEffect(() => {
    if (!windowInit) return;
    const context = resolveIdEditorContext(iDContext, 'official', () => officialID.coreContext());
    if (context && context !== iDContext) {
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
      // init the ui or restart if it was loaded previously. Either path ends
      // with osm.switch() below, which resets the (module-scoped, session-wide)
      // tile cache and triggers a fresh load from the current view — so a
      // reused/fresh context never serves stale, pre-edit data.
      if (iDContext.ui() !== undefined) {
        iDContext.reset();
        iDContext.ui().restart();
      } else {
        iDContext.init();
      }
      removeUnavailableImagerySources(iDContext.background());
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
