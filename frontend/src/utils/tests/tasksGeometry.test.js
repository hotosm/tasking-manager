import { getCentroidAndZoomFromSelectedTasks } from '../tasksGeometry';
import tasksGeojson from './snippets/tasksGeometry';

it('test if centroid and zoom level of multiple selected tasks are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1, 2], [1920, 1080])).toStrictEqual({
    center: [120.25684252381325, -9.663953601017921],
    zoom: 16,
  });
});

it('test if centroid and zoom level of unique selected tasks are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1], [1920, 1080])).toStrictEqual({
    center: [120.25684252381325, -9.667728099009187],
    zoom: 17,
  });
});

it('test if centroid and zoom level of entire tasks geojson are correct', () => {
  expect(getCentroidAndZoomFromSelectedTasks(tasksGeojson, null, [1920, 1080])).toStrictEqual({
    center: [120.26832908391953, -9.656404478023122],
    zoom: 15,
  });
});
