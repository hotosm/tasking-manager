import { API_URL } from '../config';
import { getCentroidAndZoomFromSelectedTasks, getSelectedTasksBBox } from './tasksGeometry';

export function openEditor(editor, project, tasks, selectedTasks, windowSize) {
  if (editor === 'JOSM') {
    sendJosmCommands(project, tasks, selectedTasks, windowSize);
  }
  const { center, zoom } = getCentroidAndZoomFromSelectedTasks(tasks, selectedTasks, windowSize);
  if (editor === 'ID') {
    const idUrl = getIdUrl(project, center, zoom, selectedTasks);
    window.open(idUrl);
  }
  if (editor === 'POTLATCH_2') {
    window.open(getPotlatch2Url(center, zoom));
  }
  if (editor === 'FIELD_PAPERS') {
    window.open(getFieldPapersUrl(center, zoom));
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

export function getIdUrl(project, centroid, zoomLevel, selectedTasks) {
  const base = 'https://www.openstreetmap.org/edit?editor=id&';
  let url = base + '#map=' + [zoomLevel, centroid[1], centroid[0]].join('/');
  var changesetTags = JSON.parse(project.changesetTags);
  if (changesetTags && "comment" in changesetTags) {
    url += '&comment=' + encodeURIComponent(changesetTags["comment"]);
  }
  if (project.imagery) {
    // url is supposed to look like tms[22]:http://hiu...
    let urlForImagery = project.imagery.substring(project.imagery.indexOf('http'));
    urlForImagery = urlForImagery.replace('zoom', 'z');
    url += '&background=custom:' + encodeURIComponent(urlForImagery);
  }
  // Add GPX
  if (project.projectId && selectedTasks) {
    url += '&gpx=' + encodeURIComponent(getTaskGpxUrl(project.projectId, selectedTasks).href);
  }
  return url;
}

const sendJosmCommands = async (project, tasks, selectedTasks, windowSize) => {
  const bbox = getSelectedTasksBBox(tasks, selectedTasks);
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

  return fetch(formatJosmUrl('load_data', emptyTaskLayerParams)).then(result =>
    fetch(formatJosmUrl('import', tmTaskLayerParams)),
  );
}

function loadImageryonJosm(project) {
  if (project.imagery) {
    const imageryParams = {
      title: `TM imagery for project #${project.projectId}`,
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
    changeset_comment: project.changesetTags["comment"],
    changeset_source: project.changesetSource,
    changeset_tags: encodeChangesetTags(project.changesetTags),
    new_layer: false
  };

  return fetch(formatJosmUrl('load_data', emptyOSMLayerParams)).then(result => {
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

function roundToDecimals(input, decimals) {
  const p = Math.pow(10, decimals);
  return Math.round(input * p) / p;
}

export function formatUrlParams(params) {
  const urlParams = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `?${urlParams}`;
}


export function encodeChangesetTags(changesetTags) {
  let encodedTags = "";
  for (var tag in changesetTags) {
    encodedTags += tag + '=' + changesetTags[tag] + "|"
  }
  return encodedTags.replace(/\|+$/, '');
}

