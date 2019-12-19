import { API_URL } from '../config';
import { getCentroidAndZoomFromSelectedTasks } from './tasksGeometry';

export function openEditor(editor, project, tasks, selectedTasks) {
  const [centroid, zoomLevel] = getCentroidAndZoomFromSelectedTasks(tasks, selectedTasks);
  if (editor === 'iD Editor') {
    const idUrl = getIdUrl(project, centroid, zoomLevel, selectedTasks);
    window.open(idUrl);
  }
}

export function getGPXUrl(projectId, selectedTasks) {
  return new URL(
    `projects/${projectId}/tasks/queries/gpx/?tasks=${selectedTasks.join(',')}`,
    API_URL
  );
}

export function getIdUrl(project, centroid, zoomLevel, selectedTasks) {
  const base = 'https://www.openstreetmap.org/edit?editor=id&';
  let url = base + '#map=' + [zoomLevel, centroid[1], centroid[0]].join('/');
  if (project.changesetComment){
    url += '&comment=' + encodeURIComponent(project.changesetComment);
  }
  if (project.imagery) {
    // url is supposed to look like tms[22]:http://hiu...
    let urlForImagery = project.imagery.substring(project.imagery.indexOf('http'));
    urlForImagery = urlForImagery.replace('zoom', 'z');
    url += "&background=custom:" + encodeURIComponent(urlForImagery);
  }
  // Add GPX
  if (project.projectId && selectedTasks) {
    url += "&gpx=" + encodeURIComponent(getGPXUrl(project.projectId, selectedTasks).href);
  }
  return url;
}
