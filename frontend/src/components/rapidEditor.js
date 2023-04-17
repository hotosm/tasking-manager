import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as Rapid from 'RapiD/dist/rapid';
import 'RapiD/dist/rapid.css';

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
  const RapidContext = useSelector((state) => state.editor.rapidContext);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const windowInit = typeof window !== 'undefined';
  const customSource =
    RapidContext && RapidContext.imagery() && RapidContext.imagery().findSource('custom');

  function getBackground(customImageryIsSet, imagery, RapidContext, customSource) {
    if (imagery.startsWith('http')) {
      return customSource.template(imagery);
    } else if (RapidContext && RapidContext.imagery()) {
      return RapidContext.imagery().findSource(imagery);
    }
  }
  useEffect(() => {
    if (!customImageryIsSet && imagery && customSource) {
      const imagerySource = getBackground(customImageryIsSet, imagery, RapidContext, customSource);
      if (imagery.startsWith('http')) {
        RapidContext.imagery().baseLayerSource(imagerySource);
        setCustomImageryIsSet(true);
        // this line is needed to update the value on the custom background dialog
        window.Rapid.prefs('background-custom-template', imagery);
      } else if (imagerySource) {
        RapidContext.imagery().baseLayerSource(imagerySource);
      }
    }
  }, [customImageryIsSet, imagery, RapidContext, customSource]);

  useEffect(() => {
    if (windowInit) {
      if (RapidContext === null) {
        // we need to keep Rapid context on redux store because Rapid works better if
        // the context is not restarted while running in the same browser session
        dispatch({ type: 'SET_RAPIDEDITOR', context: window.Rapid.coreContext() });
      }
    }
  }, [windowInit, RapidContext, dispatch]);

  useEffect(() => {
    if (RapidContext && comment) {
      RapidContext.defaultChangesetComment(comment);
    }
  }, [comment, RapidContext]);

  useEffect(() => {
    if (session && locale && Rapid && RapidContext) {
      // if presets is not a populated list we need to set it as null
      try {
        if (presets && presets.length) {
          window.Rapid.presetManager.addablePresetIDs(presets);
        } else {
          window.Rapid.presetManager.addablePresetIDs(null);
        }
      } catch (e) {
        window.Rapid.presetManager.addablePresetIDs(null);
      }
      // setup the context
      RapidContext.embed(true)
        .assetPath('/static/rapid/')
        .locale(locale)
        .containerNode(document.getElementById('rapid-container'));
      // init the ui or restart if it was loaded previously
      if (RapidContext.ui() !== undefined) {
        RapidContext.reset();
        RapidContext.ui().restart();
      } else {
        // Keep Rapid from defaulting to Bing
        const imageryInfo = getBackground(customImageryIsSet, imagery, RapidContext, customSource);
        if (imageryInfo) {
          window.location.hash = window.location.hash + '&background=' + imagery;
        }
        RapidContext.init();
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
            RapidContext.ui()
              .ensureLoaded()
              .then(() => {
                RapiDContext.map().scene.layers.get('custom-data').geojson(gpx(gpxData));
              });
          })
          .catch((error) => {
            console.error('Error loading GPX data');
          });
      }

      RapidContext.rapidContext().showPowerUser = powerUser;

      let osm = RapidContext.connection();
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

      RapidContext.history().on('change', () => {
        if (thereAreChanges(RapidContext.history().changes())) {
          setDisable(true);
        } else {
          setDisable(false);
        }
      });
    }
  }, [
    session,
    RapidContext,
    setDisable,
    presets,
    locale,
    gpxUrl,
    powerUser,
    intl
  ]);

  return <div className="w-100 vh-minus-69-ns" id="rapid-container"></div>;
}
