import { API_URL } from '../config';
import { getCentroidAndZoomFromSelectedTasks, getSelectedTasksBBox } from './tasksGeometry';

export function openEditor(
  editor,
  project,
  tasks,
  selectedTasks,
  windowSize,
  windowObjectReference,
  locale,
) {
  if (editor === 'JOSM') {
    sendJosmCommands(project, tasks, selectedTasks, windowSize);
    return '?editor=JOSM';
  }
  const { center, zoom } = getCentroidAndZoomFromSelectedTasks(tasks, selectedTasks, windowSize);
  if (editor === 'ID') {
    return getIdUrl(project, center, zoom, selectedTasks, locale, '?editor=ID');
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
    windowObjectReference.location.href = getIdUrl(
      project,
      center,
      zoom,
      selectedTasks,
      locale,
      customUrl,
    );
    return '?editor=CUSTOM';
  }
}

export function getTaskGpxUrl(projectId, selectedTasks) {
  return new URL(
    `projects/${projectId}/tasks/queries/gpx/?tasks=${selectedTasks.join(',')}`,
    API_URL,
  );
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
  return `https://www.openstreetmap.org/edit?editor=potlatch2#map=${[
    zoomLevel,
    roundToDecimals(centroid[1], 5),
    roundToDecimals(centroid[0], 5),
  ].join('/')}`;
}

export function getIdUrl(project, centroid, zoomLevel, selectedTasks, locale = 'en', customUrl) {
  const base = customUrl
    ? formatCustomUrl(customUrl)
    : 'https://www.openstreetmap.org/edit?editor=id&';
  let url = base + '#map=' + [zoomLevel, centroid[1], centroid[0]].join('/');
  if (project.changesetComment) {
    url += '&comment=' + encodeURIComponent(project.changesetComment);
  }
  if (project.imagery && project.imagery.includes('http')) {
    // url is supposed to look like tms[22]:http://hiu...
    let urlForImagery = project.imagery.substring(project.imagery.indexOf('http'));
    urlForImagery = urlForImagery.replace('zoom', 'z');
    url += '&background=custom:' + encodeURIComponent(urlForImagery);
  }
  // add GPX
  if (project.projectId && selectedTasks) {
    url += '&gpx=' + encodeURIComponent(getTaskGpxUrl(project.projectId, selectedTasks).href);
  }
  // add hardcoded locale while we solve how to load the user locale on iD
  url += '&locale=' + locale;
  return url;
}

export const sendJosmCommands = async (project, tasks, selectedTasks, windowSize, taskBbox) => {
  const bbox = taskBbox ? taskBbox : getSelectedTasksBBox(tasks, selectedTasks);
  await loadTasksBoundaries(project, selectedTasks);
  await loadImageryonJosm(project);
  await loadOsmDataToTasks(project, bbox, selectedTasks);
  return true;
};

// creates a new layer on JOSM and then add the tasks boundaries
function loadTasksBoundaries(project, selectedTasks) {
  const layerName = `Boundary for task${selectedTasks.length > 1 ? 's:' : ':'} ${selectedTasks.join(
    ',',
  )} of TM Project #${project.projectId} - Do not edit or upload`;
  const emptyTaskLayerParams = {
    new_layer: true,
    layer_name: layerName,
    data:
      '<?xml version="1.0" encoding="utf8"?><osm generator="JOSM" upload="never" version="0.6"></osm>',
  };
  const tmTaskLayerParams = {
    new_layer: false,
    url: getTaskXmlUrl(project.projectId, selectedTasks).href,
  };

  return fetch(formatJosmUrl('load_data', emptyTaskLayerParams)).then((result) =>
    fetch(formatJosmUrl('import', tmTaskLayerParams)),
  );
}

function loadImageryonJosm(project) {
  if (project.imagery && project.imagery.includes('http')) {
    const imageryParams = {
      title: project.imagery,
      type: project.imagery.toLowerCase().substring(0, 3),
      url: project.imagery,
    };
    return fetch(formatJosmUrl('imagery', imageryParams));
  }
}

function loadOsmDataToTasks(project, bbox, selectedTasks) {
  const emptyOSMLayerParams = {
    new_layer: true,
    layer_name: 'OSM Data',
    data: '<?xml version="1.0" encoding="utf8"?><osm generator="JOSM" version="0.6"></osm>',
  };
  const loadAndZoomParams = {
    left: bbox[0],
    bottom: bbox[1],
    right: bbox[2],
    top: bbox[3],
    changeset_comment: project.changesetComment,
    changeset_source: project.changesetSource,
    new_layer: false,
  };

  return fetch(formatJosmUrl('load_data', emptyOSMLayerParams)).then((result) => {
    if (selectedTasks.length === 1) {
      //load OSM data and zoom to the bbox
      return fetch(formatJosmUrl('load_and_zoom', loadAndZoomParams));
    } else {
      //probably too much OSM data to download, just zoom to the bbox
      return fetch(formatJosmUrl('zoom', loadAndZoomParams));
    }
  });
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
