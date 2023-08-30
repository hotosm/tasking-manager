import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

// We import from a CDN
import { version as rapidVersion, name as rapidName } from '@rapideditor/rapid/package.json'

import '@rapideditor/rapid/dist/rapid.css';

import { OSM_CLIENT_ID, OSM_CLIENT_SECRET, OSM_REDIRECT_URI, OSM_SERVER_URL } from '../config';

/**
 * The HOT TM system for Rapid. This should (eventually) extend AbstractSystem from Rapid
 * @typedef {import("@rapideditor/rapid/modules").AbstractSystem} AbstractSystem
 */
class HotTaskingManagerSystem {
  constructor(context) {
    this.context = context
    this.id = 'HotTaskingManagerSystem';
    this.dependencies = new Set();
    this.dependencies.add('storage');
    this.dependencies.add('imagery');
    this.dependencies.add('presets');
    this.autoStart = true;
    this._started = false;
  }

  initAsync() {
    for (const id of this.dependencies) {
      if (!this.context.systems[id]) {
        return Promise.reject(`Cannot init: ${this.id} requires ${id}`);
      }
    }
    return Promise.resolve();
  }

  startAsync() {
    this._started = true;
    return this.resetAsync();
  }

  resetAsync() {
    this.bulkUpdate = false;
    this._presetsInit(this._presets);
    this._taskBoundaryInit(this._taskBoundary);
    this._powerUserInit(this._powerUser);
    this._imageryInit(this._imagery);
    this.bulkUpdate = true;
    return Promise.resolve();
  }

  /**
   * Set the comment for the task
   * @param {string} value The comment
   */
  set comment(value) {
    this.context.defaultChangesetComment = value
  }

  set presets(presets) {
    this._presets = presets;
    this._presetsInit(this._presets);
  }

  _presetsInit(value) {
    const presetSystem = this.context.systems.presets;
    // if presets is not a populated list we need to set it as null
    if (value && value.length) {
      presetSystem.addablePresetIDs = new Set(value);
    } else {
      presetSystem.addablePresetIDs = null;
    }
  }

  /**
   * Set the task boundary
   * @param {string} value The URL for the boundary information.
   * Rapid treats URLs with 'project', 'task', and 'gpx' in them as tasking manager boundaries.
   */
  set taskBoundary(value) {
    this._taskBoundary = value;
    this._taskBoundaryInit(this._taskBoundary);
  }

  /**
   * Set the task boundary
   * @param {string} value The URL for the boundary information.
   * Rapid treats URLs with 'project', 'task', and 'gpx' in them as tasking manager boundaries.
   */
  _taskBoundaryInit(value) {
    this._updateHash(hashParams => {
      hashParams.set('data', value);
    });
  }

  set imagery(value) {
    this._imagery = value;
    this._imageryInit(this._imagery);
  }

  /**
   *
   * @param {ImagerySource} value
   * @typedef {import("@rapideditor/rapid/modules").ImagerySource} ImagerySource
   * @private
   */
  _imageryInit(value) {
    this._updateHash(hashParams => {
      if (value) {
        // RapidContext.urlhash().setParam('background', imagery)
        // window.location.hash = window.location.hash + '&background=' + imagery;

        // SearchParams will actually need the leading hash if the param is first in the hash list.
        hashParams.set('background', value);
      }
    });
  }

  /**
   * Set whether the user is a power user
   * @param {boolean} value true if the user should be shown power user options
   */
  set powerUser(value) {
    this._powerUser = value;
    this._powerUserInit(this._powerUser);
  }

  /**
   * Set whether the user is a power user
   * @param {boolean} value true if the user should be shown power user options
   */
  _powerUserInit(value) {
    this._updateHash(hashParams => {
      /* Set the poweruser */
      if (value && !hashParams.has('poweruser')) {
        hashParams.set('poweruser', value);
      } else if (!value) {
        hashParams.delete('poweruser');
      }
      this.context.systems.rapid.showPowerUser = value;
    });
  }

  /**
   * Check if this system has been started
   * @returns {boolean} true if started
   */
  get started() {
    return this._started;
  }

  /**
   *
   * @param {function(URLSearchParams)} runnable
   * @private
   */
  _updateHash(runnable) {
    const hash = window.location.hash.substring(1);
    const hashParams = this._newHash ? this._newHash : new URLSearchParams(hash);
    runnable.call(this, hashParams);
    if (!this._equalsUrlParameters(hashParams, new URLSearchParams(hash))) {
      if (!this.bulkUpdate) {
        window.history.pushState(null, '', this._getNewUrl(hashParams));
      } else {
        this._newHash = hashParams;
      }
    }
  }

  /**
   * Use to avoid firing window history updates
   * @param {boolean} value true if we shouldn't push a new state yet
   */
  set bulkUpdate(value) {
    this._bulkUpdate = value;
    if (!value && this._newHash) {

      window.history.pushState(null, '', this._getNewUrl(this._newHash));
      this._newHash = undefined;
    }
  }

  /**
   * Generate a new URL that should be parsable by Rapid
   * @param {URLSearchParams} hashParams The parameters to add to the URL
   * @returns {string} The new URL
   * @private
   */
  _getNewUrl(hashParams) {
    let newUrl =
      window.location.pathname + window.location.search + '#';
    let first = true;
    for (const [key, value] of hashParams) {
      if (!first) {
        newUrl += '&';
      }
      first = false;
      newUrl += key + '=' + value;
    }
    return newUrl;
  }

  /**
   * Check to see if we are in a bulk update
   * @returns {boolean} true if we are currently updating the state
   */
  get bulkUpdate() {
    return this._bulkUpdate;
  }

  /**
   * Check if two URL search parameters are semantically equal
   * @param {URLSearchParams} first
   * @param {URLSearchParams} second
   * @return {boolean} true if they are semantically equal
   */
  _equalsUrlParameters(first, second) {
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
}

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
  const [rapidLoaded, setRapidLoaded] = useState(window.Rapid !== undefined);
  const rapidContext = useSelector((state) => state.editor.rapidContext);
  const locale = useSelector((state) => state.preferences.locale);
  const [customImageryIsSet, setCustomImageryIsSet] = useState(false);
  const windowInit = typeof window !== 'undefined';

  // This significantly reduces build time _and_ means different TM instances can share the same download of Rapid.
  // Unfortunately, Rapid doesn't use a public CDN itself, so we cannot reuse that.
  useEffect(() => {
    // This could be ^${rapidVersion} if we are able to import the css here as well.
    const baseCdnUrl = `https://cdn.jsdelivr.net/npm/${rapidName}@${rapidVersion}/dist/`;
    const script = document.createElement('script');
    script.src = baseCdnUrl + 'rapid.js';
    script.async = true;
    script.onload = () => setRapidLoaded(true);
    document.body.appendChild(script);
  }, [setRapidLoaded]);

  useEffect(() => {
    return () => {
      dispatch({ type: 'SET_VISIBILITY', isVisible: true });
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (windowInit && rapidContext === null && rapidLoaded) {
      // we need to keep Rapid context on redux store because Rapid works better if
      // the context is not restarted while running in the same browser session
      const context = new window.Rapid.Context();
      // setup the context
      context.embed(true);
      context.locale = locale;
      context.containerNode = document.getElementById('rapid-container');
      context.assetPath = '/static/rapid/';
      dispatch({ type: 'SET_RAPIDEDITOR', context: context });
    }
  }, [windowInit, rapidLoaded, rapidContext, dispatch, locale]);

  useEffect(() => {
    if (rapidContext) {
      // init the ui or restart if it was loaded previously
      let promise;
      if (rapidContext?.systems?.ui !== undefined) {
        // Currently commented out in Rapid source code (2023-07-20)
        // RapidContext.systems.ui.restart();
        // resetAsync was a possible replacement, but it ran into issues when switching tasks.
        promise = rapidContext.resetAsync();
      } else {
        promise = rapidContext.initAsync();
        rapidContext.systems.hottaskingmanager = new HotTaskingManagerSystem(rapidContext);
        promise.then(() => rapidContext.systems.hottaskingmanager.initAsync());
      }

      /* Perform tasks after Rapid has started up */
      promise.then(() => {
        rapidContext.systems.hottaskingmanager.bulkUpdate = true;
        rapidContext.systems.hottaskingmanager.comment = comment;
        rapidContext.systems.hottaskingmanager.presets = presets;
        rapidContext.systems.hottaskingmanager.taskBoundary = gpxUrl
        rapidContext.systems.hottaskingmanager.powerUser = powerUser

        /* Set the background */
        const imagerySystem = rapidContext?.systems?.imagery;
        if (imagerySystem && imagerySystem?.findSource) {
          const customSource = imagerySystem.findSource('custom');
          setupImagery(
            rapidContext,
            customImageryIsSet,
            setCustomImageryIsSet,
            imagery,
            customSource,
          );
          if(getBackground(
            customImageryIsSet,
            imagery,
            imagerySystem,
            customSource,
          )) {
            rapidContext.systems.hottaskingmanager.imagery = imagery;
          }
        }

        rapidContext.systems.hottaskingmanager.bulkUpdate = false;

        /* Keep track of edits */
        const editSystem = rapidContext.systems.edits;
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
    rapidContext,
    comment,
    customImageryIsSet,
    gpxUrl,
    imagery,
    intl,
    powerUser,
    presets,
    setDisable,
  ]);

  useEffect(() => {
    if (rapidContext) {
      return () => rapidContext.save();
    }
  }, [rapidContext]);

  useEffect(() => {
    if (rapidContext && session) {
      rapidContext.apiConnections = [
        {
          url: OSM_SERVER_URL,
          client_id: OSM_CLIENT_ID,
          client_secret: OSM_CLIENT_SECRET,
          redirect_uri: OSM_REDIRECT_URI,
          access_token: session.osm_oauth_token,
        },
      ];
    }
  }, [rapidContext, session, session?.osm_oauth_token]);

  return <div className="w-100 vh-minus-69-ns" id="rapid-container"></div>;
}
