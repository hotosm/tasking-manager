import { getCentroidAndZoomFromSelectedTasks } from '../tasksGeometry';
import { tasksGeojson } from './snippets/tasksGeometry';

it('test if centroid and zoom level of multiple selected tasks are correct', () => {
  expect(
    getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1, 2])
  ).toStrictEqual(
    [[ 120.256842067, -9.663953733499998 ], 15]
  );
});

it('test if centroid and zoom level of selected tasks are correct', () => {
  expect(
    getCentroidAndZoomFromSelectedTasks(tasksGeojson, [1])
  ).toStrictEqual(
    [[ 120.25684206700001, -9.667728374 ], 16]
  );
});
