import { compareTaskId, compareLastUpdate, compareHistoryLastUpdate } from '../sorting';

it('test sorting with compareTaskId', () => {
  let arr = [
    { properties: { taskId: 45 } },
    { properties: { taskId: 34 } },
    { properties: { taskId: 40 } },
    { properties: { taskId: 200 } },
    { properties: { taskId: 4 } },
  ];
  expect(arr.sort(compareTaskId)).toEqual([
    { properties: { taskId: 4 } },
    { properties: { taskId: 34 } },
    { properties: { taskId: 40 } },
    { properties: { taskId: 45 } },
    { properties: { taskId: 200 } },
  ]);
});

it('test sorting with compareHistoryLastUpdate', () => {
  let arr = [
    { actionDate: '2019-08-27T12:36:21.281426' },
    { actionDate: '2019-08-27T12:35:21.281426' },
    { actionDate: '2019-08-27T13:36:21.281426' },
    { actionDate: '2019-08-27T12:46:21.281426' },
  ];
  expect(arr.sort(compareHistoryLastUpdate)).toEqual([
    { actionDate: '2019-08-27T13:36:21.281426' },
    { actionDate: '2019-08-27T12:46:21.281426' },
    { actionDate: '2019-08-27T12:36:21.281426' },
    { actionDate: '2019-08-27T12:35:21.281426' },
  ]);
});

it('test sorting with compareLastUpdate', () => {
  let arr = [
    { properties: { actionDate: '2019-08-27T12:36:21.281426' } },
    { properties: { actionDate: '2019-08-27T12:35:21.281426' } },
    { properties: { actionDate: '2019-08-27T13:36:21.281426' } },
    { properties: { actionDate: '2019-08-27T12:46:21.281426' } },
  ];
  expect(arr.sort(compareLastUpdate)).toEqual([
    { properties: { actionDate: '2019-08-27T13:36:21.281426' } },
    { properties: { actionDate: '2019-08-27T12:46:21.281426' } },
    { properties: { actionDate: '2019-08-27T12:36:21.281426' } },
    { properties: { actionDate: '2019-08-27T12:35:21.281426' } },
  ]);
});
