import { getCentroidAndZoomFromSelectedTasks } from '../tasksGeometry';
import tasksGeojson from './snippets/tasksGeometry';

it('test if centroid and zoom level of multiple selected tasks are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1, 2], [1920, 1080])).toStrictEqual({
    center: [120.25684206700001, -9.663953691],
    zoom: 16,
  });
});

it('test if centroid and zoom level of unique selected tasks are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1], [1920, 1080])).toStrictEqual({
    center: [120.25684206700001, -9.667728374],
    zoom: 17,
  });
});

it('test if centroid and zoom level of entire tasks geojson are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, null, [1920, 1080])).toStrictEqual({
    center: [120.2683289965, -9.656404072],
    zoom: 15,
  });
});
