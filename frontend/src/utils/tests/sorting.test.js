import {
  compareTaskId,
  compareLastUpdate,
  compareHistoryLastUpdate,
  compareByPropertyDescending,
} from '../sorting';

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

describe('compareByPropertyDescending', () => {
  it('with value property', () => {
    const data = [{ value: 1 }, { value: 51 }, { value: 100 }, { value: 21 }, { value: 12 }];
    expect(data.sort((a, b) => compareByPropertyDescending(a, b, 'value'))).toEqual([
      { value: 100 },
      { value: 51 },
      { value: 21 },
      { value: 12 },
      { value: 1 },
    ]);
  });
  it('with count property', () => {
    const data = [{ count: 1 }, { count: 1 }, { count: 102 }, { count: 21 }, { count: 12 }];
    expect(data.sort((a, b) => compareByPropertyDescending(a, b, 'count'))).toEqual([
      { count: 102 },
      { count: 21 },
      { count: 12 },
      { count: 1 },
      { count: 1 },
    ]);
  });
});
