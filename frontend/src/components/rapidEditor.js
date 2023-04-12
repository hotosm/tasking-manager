import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as RapiD from 'RapiD/dist/iD.legacy';
import 'RapiD/dist/RapiD.css';

import { OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import messages from './messages';

export default function RapidEditor({
  setDisable,
  comment,
  presets,
  imagery,
  gpxUrl,
  powerUser = false,
}) {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const intl = useIntl();
  const RapiDContext = useSelector((state) => state.editor.rapidContext);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const windowInit = typeof window !== 'undefined';
  const customSource =
    RapiDContext && RapiDContext.background() && RapiDContext.background().findSource('custom');

  useEffect(() => {
    if (!customImageryIsSet && imagery && customSource) {
      if (imagery.startsWith('http')) {
        RapiDContext.background().baseLayerSource(customSource.template(imagery));
        setCustomImageryIsSet(true);
        // this line is needed to update the value on the custom background dialog
        window.iD.prefs('background-custom-template', imagery);
      } else {
        const imagerySource = RapiDContext.background().findSource(imagery);
        if (imagerySource) {
          RapiDContext.background().baseLayerSource(imagerySource);
        }
      }
    }
  }, [customImageryIsSet, imagery, RapiDContext, customSource]);

  useEffect(() => {
    if (windowInit) {
      if (RapiDContext === null) {
        // we need to keep iD context on redux store because iD works better if
        // the context is not restarted while running in the same browser session
        dispatch({ type: 'SET_RAPIDEDITOR', context: window.iD.coreContext() });
      }
    }
  }, [windowInit, RapiDContext, dispatch]);

  useEffect(() => {
    if (RapiDContext && comment) {
      RapiDContext.defaultChangesetComment(comment);
    }
  }, [comment, RapiDContext]);

  useEffect(() => {
    if (session && locale && RapiD && RapiDContext) {
      // if presets is not a populated list we need to set it as null
      try {
        if (presets.length) {
          window.iD.presetManager.addablePresetIDs(presets);
        } else {
          window.iD.presetManager.addablePresetIDs(null);
        }
      } catch (e) {
        window.iD.presetManager.addablePresetIDs(null);
      }
      // setup the context
      RapiDContext.embed(true)
        .assetPath('/static/rapid/')
        .locale(locale)
        .containerNode(document.getElementById('rapid-container'));
      // init the ui or restart if it was loaded previously
      if (RapiDContext.ui() !== undefined) {
        RapiDContext.reset();
        RapiDContext.ui().restart();
      } else {
        RapiDContext.init();
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
            RapiDContext.scene().layers.get('custom-data').geojson(gpx(gpxData));
          })
          .catch((error) => {
            console.error('Error loading GPX data');
          });
      }

      RapiDContext.rapidContext().showPowerUser = powerUser;

      let osm = RapiDContext.connection();
      const auth = {
        url: OSM_SERVER_URL,
        client_id: OSM_CLIENT_ID,
        client_secret: OSM_CLIENT_SECRET,
        redirect_uri: OSM_REDIRECT_URI,
        access_token: session.osm_oauth_token,
      };
      osm.switch(auth);

      const thereAreChanges = (changes) =>
        changes.modified.length || changes.created.length || changes.deleted.length;

      RapiDContext.history().on('change', () => {
        if (thereAreChanges(RapiDContext.history().changes())) {
          setDisable(true);
        } else {
          setDisable(false);
        }
      });
    }
  }, [session, RapiDContext, setDisable, presets, locale, gpxUrl, powerUser, intl]);

  return <div className="w-100 vh-minus-69-ns" id="rapid-container"></div>;
}
