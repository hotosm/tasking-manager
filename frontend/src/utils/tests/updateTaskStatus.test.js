import { updateTasksStatus, getActivityForTask } from '../updateTasksStatus';

it('test update tasks geojson with new status from activities', () => {
  const tasks = {
    features: [
      {
        geometry: {
          coordinates: [
            [
              [
                [-41.67114, -14.20048],
                [-41.67114, -14.19782],
                [-41.668395, -14.19782],
                [-41.668395, -14.20048],
                [-41.67114, -14.20048],
              ],
            ],
          ],
          type: 'MultiPolygon',
        },
        properties: {
          taskId: 2,
          taskIsSquare: true,
          taskStatus: 'READY',
          taskX: 50364,
          taskY: 60312,
          taskZoom: 17,
        },
        type: 'Feature',
      },
      {
        geometry: {
          coordinates: [
            [
              [
                [-41.6876, -14.21481],
                [-41.68804, -14.2138],
                [-41.6876, -14.2138],
                [-41.6876, -14.21481],
              ],
            ],
          ],
          type: 'MultiPolygon',
        },
        properties: {
          taskId: 1,
          taskIsSquare: false,
          taskStatus: 'READY',
          taskX: 50357,
          taskY: 60306,
          taskZoom: 17,
        },
        type: 'Feature',
      },
    ],
    type: 'FeatureCollection',
  };

  const activities = {
    activity: [
      { taskId: 1, taskStatus: 'MAPPED', actionDate: null },
      { taskId: 2, taskStatus: 'READY', actionDate: null },
    ],
  };

  expect(
    updateTasksStatus(tasks, activities).features.filter((i) => i.properties.taskStatus === 'READY')
      .length,
  ).toEqual(1);
  expect(
    updateTasksStatus(tasks, activities).features.filter(
      (i) => i.properties.taskStatus === 'MAPPED' && i.properties.taskId === 1,
    ).length,
  ).toEqual(1);
});

it('test getActivityStatus', () => {
  const activities = {
    activity: [
      {
        taskId: 1,
        taskStatus: 'MAPPED',
        actionDate: '2019-08-27T12:36:21.281426',
        actionBy: 'test',
      },
      { taskId: 2, taskStatus: 'READY', actionDate: null },
    ],
  };
  expect(getActivityForTask(activities, 1).taskStatus).toEqual('MAPPED');
  expect(getActivityForTask(activities, 1).actionDate).toEqual('2019-08-27T12:36:21.281426');
  expect(getActivityForTask(activities, 1).actionBy).toEqual('test');
  expect(getActivityForTask(activities, 2).taskStatus).toEqual('READY');
  expect(getActivityForTask(activities, 42)).toBeFalsy();
});
