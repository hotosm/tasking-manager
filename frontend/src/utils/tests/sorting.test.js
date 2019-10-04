import { compareTaskId } from '../sorting';

it('test sorting with compareTaskId', () => {
  let arr = [{taskId: 45}, {taskId: 34}, {taskId: 40}, {taskId: 200}, {taskId: 4}];
  expect(
    arr.sort(compareTaskId)
  ).toEqual(
    [ { "taskId": 4 }, { "taskId": 34 }, { "taskId": 40 }, { "taskId": 45 }, { "taskId": 200 } ]
  );
});
