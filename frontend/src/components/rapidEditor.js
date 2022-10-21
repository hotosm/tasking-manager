import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as RapiD from 'RapiD/dist/iD.legacy';
import 'RapiD/dist/RapiD.css';

import { OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';

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
  const RapiDContext = useSelector((state) => state.editor.rapidContext);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const windowInit = typeof window !== undefined;
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
    return () => {
      dispatch({ type: 'SET_VISIBILITY', isVisible: true });
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (windowInit) {
      dispatch({ type: 'SET_VISIBILITY', isVisible: false });
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
        .setsDocumentTitle(false)
        .containerNode(document.getElementById('rapid-container'));
      // init the ui or restart if it was loaded previously
      if (RapiDContext.ui() !== undefined) {
        RapiDContext.reset();
        RapiDContext.ui().restart();
      } else {
        RapiDContext.init();
      }
      if (gpxUrl) {
        RapiDContext.layers().layer('data').url(gpxUrl, '.gpx');
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
  }, [session, RapiDContext, setDisable, presets, locale, gpxUrl, powerUser]);

  return <div className="w-100 vh-minus-77-ns" id="rapid-container"></div>;
}
