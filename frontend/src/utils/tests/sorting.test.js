import { compareTaskId, compareLastUpdate } from '../sorting';

it('test sorting with compareTaskId', () => {
  let arr = [{ taskId: 45 }, { taskId: 34 }, { taskId: 40 }, { taskId: 200 }, { taskId: 4 }];
  expect(arr.sort(compareTaskId)).toEqual([
    { taskId: 4 },
    { taskId: 34 },
    { taskId: 40 },
    { taskId: 45 },
    { taskId: 200 },
  ]);
});

it('test sorting with compareLastUpdate', () => {
  let arr = [
    { actionDate: '2019-08-27T12:36:21.281426' },
    { actionDate: '2019-08-27T12:35:21.281426' },
    { actionDate: '2019-08-27T13:36:21.281426' },
    { actionDate: '2019-08-27T12:46:21.281426' },
  ];
  expect(arr.sort(compareLastUpdate)).toEqual([
    { actionDate: '2019-08-27T13:36:21.281426' },
    { actionDate: '2019-08-27T12:46:21.281426' },
    { actionDate: '2019-08-27T12:36:21.281426' },
    { actionDate: '2019-08-27T12:35:21.281426' },
  ]);
});
