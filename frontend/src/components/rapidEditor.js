import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { gpx } from '@tmcw/togeojson';
import * as Rapid from 'Rapid/dist/rapid.legacy';

import 'Rapid/dist/rapid.css';

import { OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';
import messages from './messages';

/**
 * Get the background for Rapid
 * @typedef {import("Rapid/modules").ImagerySystem} ImagerySystem
 * @typedef {import("Rapid/modules").ImagerySourceCustom} ImagerySourceCustom
 * @param {boolean} customImageryIsSet
 * @param {string} imagery
 * @param {ImagerySystem} imagerySystem
 * @param {ImagerySourceCustom} customSource
 * @returns {undefined|ImagerySystem}
 */
function getBackground(customImageryIsSet, imagery, imagerySystem, customSource) {
  if (!imagery) return;

  if (imagery.startsWith('http')) {
    return customSource.template(imagery);
  } else if (imagerySystem) {
    return imagerySystem.findSource(imagery);
  }
}

/**
 * Setup the project imagery
 * @typedef {import("Rapid").Context} RapidContext
 * @param {RapidContext} RapidContext The current Rapid context
 * @param {boolean} customImageryIsSet
 * @param {function(boolean)} setCustomImageryIsSet
 * @param {string} imagery
 * @param {ImagerySourceCustom} customSource
 */
function setupImagery(
  RapidContext,
  customImageryIsSet,
  setCustomImageryIsSet,
  imagery,
  customSource,
) {
  if (!RapidContext?.systems?.imagery) return;
  const imagerySystem = RapidContext.systems.imagery;
  if (!customImageryIsSet && imagery && customSource && customSource._name) {
    const imagerySource = getBackground(customImageryIsSet, imagery, imagerySystem, customSource);
    if (imagery.startsWith('http')) {
      imagerySystem.baseLayerSource(imagerySource);
      setCustomImageryIsSet(true);
      // this line is needed to update the value on the custom background dialog
      RapidContext.systems?.storage?.setItem('background-custom-template', imagery);
    } else if (imagerySource) {
      imagerySystem.baseLayerSource(imagerySource);
    }
  }
}

/**
 * Create a new RapidEditor component
 * @param {function(boolean)} setDisable
 * @param {string} comment The default changeset comment
 * @param {[string]|null|undefined} presets The presets to allow the user to use
 * @param {string|null|undefined} imagery The imagery to default to for the user
 * @param {string} gpxUrl
 * @param {boolean} powerUser
 * @returns {Element} The element to add to the DOM
 * @constructor
 */
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

  useEffect(() => {
    if (windowInit) {
      if (RapidContext === null) {
        // we need to keep Rapid context on redux store because Rapid works better if
        // the context is not restarted while running in the same browser session
        const context = new window.Rapid.Context();
        dispatch({ type: 'SET_RAPIDEDITOR', context: context });
      }
    }
  }, [windowInit, RapidContext, dispatch]);

  useEffect(() => {
    if (RapidContext) {
      // setup the context
      RapidContext.embed(true);
      RapidContext.locale = locale;
      RapidContext.containerNode = document.getElementById('rapid-container');
      RapidContext.assetPath = '/static/rapid/';
      // init the ui or restart if it was loaded previously
      let promise;
      if (RapidContext?.systems?.ui !== undefined) {
        promise = RapidContext.resetAsync();
        // Currently commented out in Rapid source code (2023-07-20)
        // RapidContext.systems.ui.restart();
      } else {
        promise = RapidContext.initAsync();
      }

      /* Perform tasks after Rapid has started up */
      promise.then(() => {
        // Set the default comment
        if (comment) {
          RapidContext.defaultChangesetComment = comment;
        }

        /* Set the presets */
        const presetSystem = RapidContext.systems.presets;
        // if presets is not a populated list we need to set it as null
        if (presets && presets.length) {
          presetSystem.addablePresetIDs = new Set(presets);
        } else {
          presetSystem.addablePresetIDs = null;
        }

        /* Set the task boundaries */
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
              RapidContext.systems.map.scene.layers.get('custom-data').geojson(gpx(gpxData));
            })
            .catch((err) => {
              console.error(err);
              console.error('Error loading GPX data');
            });
        }

        /* Set the background */
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let changedHash = false;
        const imagerySystem = RapidContext?.systems?.imagery;
        if (imagerySystem) {
          const customSource = RapidContext.systems.imagery.findSource('custom');
          setupImagery(
            RapidContext,
            customImageryIsSet,
            setCustomImageryIsSet,
            imagery,
            customSource,
          );
          const imageryInfo = getBackground(
            customImageryIsSet,
            imagery,
            imagerySystem,
            customSource,
          );

          if (imageryInfo) {
            // RapidContext.urlhash().setParam('background', imagery)
            // window.location.hash = window.location.hash + '&background=' + imagery;

            // SearchParams will actually need the leading hash if the param is first in the hash list.
            hashParams.set('background', imagery);
            changedHash = true;
          }
        }

        /* Set the poweruser */
        if (powerUser && !hashParams.has('poweruser')) {
          hashParams.set('poweruser', powerUser);
          changedHash = true;
        } else if (!powerUser) {
          hashParams.delete('poweruser');
        }
        RapidContext.systems.rapid.showPowerUser = powerUser;

        if (changedHash) {
          let newBackgroundImageURL =
            window.location.pathname + window.location.search + '#' + hashParams.toString();
          window.history.pushState(null, '', newBackgroundImageURL);
        }

        /* Keep track of edits */
        const editSystem = RapidContext.systems.edits;
        const thereAreChanges = (changes) =>
          changes.modified.length || changes.created.length || changes.deleted.length;

        editSystem.on('change', () => {
          if (thereAreChanges(editSystem.changes())) {
            setDisable(true);
          } else {
            setDisable(false);
          }
        });
      });
    }
  }, [
    RapidContext,
    comment,
    customImageryIsSet,
    gpxUrl,
    imagery,
    intl,
    locale,
    powerUser,
    presets,
    setDisable,
  ]);

  useEffect(() => {
    if (RapidContext && session) {
      RapidContext.apiConnections = [
        {
          url: OSM_SERVER_URL,
          client_id: OSM_CLIENT_ID,
          client_secret: OSM_CLIENT_SECRET,
          redirect_uri: OSM_REDIRECT_URI,
          access_token: session.osm_oauth_token,
        },
      ];
    }
  }, [RapidContext, session, session?.osm_oauth_token]);

  return <div className="w-100 vh-minus-69-ns" id="rapid-container"></div>;
}
