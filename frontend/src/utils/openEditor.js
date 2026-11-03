import { API_URL, ID_EDITOR_URL, POTLATCH2_EDITOR_URL } from '../config';
import { getCentroidAndZoomFromSelectedTasks, getSelectedTasksBBox } from './tasksGeometry';

export function openEditor(
  editor,
  project,
  tasks,
  selectedTasks,
  windowSize,
  windowObjectReference,
) {
  if (editor === 'JOSM') {
    sendJosmCommands(project, tasks, selectedTasks, windowSize, undefined, windowObjectReference);
    return '?editor=JOSM';
  }
  const { center, zoom } = getCentroidAndZoomFromSelectedTasks(tasks, selectedTasks, windowSize);
  if (['ID', 'RAPID'].includes(editor)) {
    return getIdUrl(project, center, zoom, selectedTasks, '?editor=' + editor);
  }
  if (windowObjectReference == null || windowObjectReference.closed) {
    windowObjectReference = window.open('', `iD-${project}-${selectedTasks}`);
  }
  if (editor === 'POTLATCH_2') {
    windowObjectReference.location.href = getPotlatch2Url(center, zoom);
    return '?editor=POTLATCH_2';
  }
  if (editor === 'FIELD_PAPERS') {
    windowObjectReference.location.href = getFieldPapersUrl(center, zoom);
    return '?editor=FIELD_PAPERS';
  }
  if (editor === 'CUSTOM') {
    const customUrl = project.customEditor.url;
    windowObjectReference.location.href = getIdUrl(project, center, zoom, selectedTasks, customUrl);
    return '?editor=CUSTOM';
  }
}

export function formatImageryUrl(imageryURL) {
  // url is supposed to look like tms[22]:http://hiu...
  if (imageryURL) {
    return imageryURL.substring(imageryURL.indexOf('http')).replace('zoom', 'z');
  }
}

export function getTaskGpxUrl(projectId, selectedTasks) {
  return new URL(
    `projects/${projectId}/tasks/queries/gpx/?tasks=${selectedTasks.join(',')}`,
    API_URL,
  ).href;
}

export function getTaskXmlUrl(projectId, selectedTasks) {
  return new URL(
    `projects/${projectId}/tasks/queries/xml/?tasks=${selectedTasks.join(',')}`,
    API_URL,
  );
}

export function getFieldPapersUrl(centroid, zoomLevel) {
  return `http://fieldpapers.org/compose#${[
    zoomLevel,
    roundToDecimals(centroid[1], 5),
    roundToDecimals(centroid[0], 5),
  ].join('/')}`;
}

export function getPotlatch2Url(centroid, zoomLevel) {
  return `${POTLATCH2_EDITOR_URL}#map=${[
    zoomLevel,
    roundToDecimals(centroid[1], 5),
    roundToDecimals(centroid[0], 5),
  ].join('/')}`;
}

export function getIdUrl(project, centroid, zoomLevel, selectedTasks, customUrl) {
  const base = customUrl ? formatCustomUrl(customUrl) : `${ID_EDITOR_URL}`;
  let url = base + '#map=' + [zoomLevel, centroid[1], centroid[0]].join('/');
  // add the extraParams
  if (project.extraIdParams) {
    let extraParams = formatExtraParams(project.extraIdParams);
    if (!extraParams.startsWith('&')) extraParams = `&${extraParams}`;
    url += extraParams;
  }
  // the other URL params are only needed by external iD editors
  if (!['?editor=ID', '?editor=RAPID'].includes(customUrl)) {
    if (project.changesetComment) {
      url += '&comment=' + encodeURIComponent(project.changesetComment);
    }
    if (project.imagery) {
      if (project.imagery.includes('http')) {
        url += '&background=custom:' + encodeURIComponent(formatImageryUrl(project.imagery));
      } else {
        url += '&background=' + encodeURIComponent(formatImageryUrl(project.imagery));
      }
    }
    // add GPX
    if (project.projectId && selectedTasks) {
      url += '&gpx=' + encodeURIComponent(getTaskGpxUrl(project.projectId, selectedTasks));
    }
    if (project.idPresets) {
      url += '&presets=' + encodeURIComponent(project.idPresets.join(','));
    }
  }
  return url;
}

export const formatExtraParams = (values) => {
  let extraParams = '';
  values
    .split('&')
    .filter((term) => term)
    .forEach((term) => {
      const [key, value] = term.split('=');
      extraParams += `&${key}=${encodeURIComponent(value)}`;
    });
  return extraParams;
};

export const sendJosmCommands = async (
  project,
  tasks,
  selectedTasks,
  windowSize,
  taskBbox,
  popup,
) => {
  try {
    if (!popup) popup = prepareJosmWindow();
    const send = (uri) => callJosmRemoteControl(uri, popup);
    await loadTasksBoundaries(project, selectedTasks, send);
    await loadImageryonJosm(project, send);
    for (const [n, task] of selectedTasks.entries()) {
      await loadOsmDataToTasks(
        project,
        taskBbox ? taskBbox : getSelectedTasksBBox(tasks, [task]),
        n === 0,
        send,
      );
    }
    return true;
  } catch (error) {
    return false;
  } finally {
    if (popup && !popup.closed) popup.close();
  }
};

// creates a new layer on JOSM and then add the tasks boundaries
function loadTasksBoundaries(project, selectedTasks, callJosmRemoteControl) {
  const layerName = `Boundary for task${selectedTasks.length > 1 ? 's:' : ':'} ${selectedTasks.join(
    ',',
  )} of TM Project #${project.projectId} - Do not edit or upload`;
  const tmTaskLayerParams = {
    new_layer: true,
    layer_name: layerName,
    layer_locked: true,
    download_policy: 'never',
    upload_policy: 'never',
    url: getTaskXmlUrl(project.projectId, selectedTasks).href,
  };

  return callJosmRemoteControl(formatJosmUrl('import', tmTaskLayerParams));
}

export function getImageryInfo(url) {
  const type = url.toLowerCase().substr(0, 3) === 'wms' ? 'wms' : 'tms';
  const zoom = url.substr(url.indexOf('[') + 1, url.indexOf(']') - url.indexOf('[') - 1);
  const [minZoom, maxZoom] = zoom.length
    ? zoom.indexOf(':') !== -1
      ? zoom.split(':')
      : [null, zoom]
    : [null, null];
  return [
    type,
    minZoom !== '' && minZoom !== null ? Number(minZoom) : null,
    maxZoom !== '' && maxZoom !== null ? Number(maxZoom) : null,
  ];
}

function loadImageryonJosm(project, callJosmRemoteControl) {
  if (project.imagery) {
    if (project.imagery.includes('http')) {
      const [type, minZoom, maxZoom] = getImageryInfo(project.imagery);
      const imageryParams = {
        title: project.imagery,
        type: type,
      };
      if (minZoom) imageryParams.min_zoom = minZoom;
      if (maxZoom) imageryParams.max_zoom = maxZoom;
      imageryParams.url = project.imagery.substr(project.imagery.indexOf('http'));

      return callJosmRemoteControl(formatJosmUrl('imagery', imageryParams));
    } else {
      return callJosmRemoteControl(formatJosmUrl('imagery', { id: project.imagery }));
    }
  }
}

function loadOsmDataToTasks(project, bbox, newLayer, callJosmRemoteControl) {
  const loadAndZoomParams = {
    left: bbox[0],
    bottom: bbox[1],
    right: bbox[2],
    top: bbox[3],
    changeset_comment: project.changesetComment,
    changeset_source: project.imagery ? project.imagery : '',
    new_layer: newLayer,
    layer_name: 'OSM Data',
  };

  return callJosmRemoteControl(formatJosmUrl('load_and_zoom', loadAndZoomParams));
}

export function formatJosmUrl(endpoint, params) {
  return new URL(formatUrlParams(params), `http://127.0.0.1:8111/${endpoint}`);
}

export function formatCustomUrl(url) {
  return url.includes('?') ? url : `${url}?`;
}

function roundToDecimals(input, decimals) {
  const p = Math.pow(10, decimals);
  return Math.round(input * p) / p;
}

export function formatUrlParams(params) {
  const urlParams = Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `?${urlParams}`;
}

// Safari won't send AJAX commands to an insecure port when on a secure site:
// https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content#browser_compatibility
// JOSM hasn't supported self-signed HTTPS since changeset 15469 (2019-10-22):
// https://josm.openstreetmap.de/changeset/15469/josm. So for Safari only, fall
// back to sending JOSM requests via the opening of a separate window instead of
// AJAX - re-using the same window for each request, to avoid issues with popup
// blockers.
export const requiresJosmPopup = () => Boolean(window.safari);

const callJosmRemoteControl = function (uri, popup) {
  if (requiresJosmPopup()) {
    return new Promise((resolve, reject) => {
      if (!popup || popup.closed) {
        reject(new Error('JOSM_POPUP_BLOCKED'));
        return;
      }

      popup.location = uri.href;

      // Wait 1 second before the next command
      // The window is not closed until after the batch is complete
      // We cannot confirm whether JOSM handled the command.
      setTimeout(() => resolve(true), 1000);
    });
  }

  return fetch(uri)
    .then((response) => response.status === 200)
    .catch((error) => {
      console.log(error);
      return false;
    });
};

export function prepareJosmWindow() {
  if (!requiresJosmPopup()) return null;
  // Safari's HTTPS-only warning blocks navigating
  // to a blank popup, so we load the version endpoint
  // even though we cannot read the response
  const popup = window.open(formatJosmUrl('version', {}).href, '_blank');
  if (!popup) throw new Error('JOSM_POPUP_BLOCKED');
  return popup;
}
