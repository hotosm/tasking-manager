import { getTaskContributors } from '../getTaskContributors';
import { history, revertedBadImagery } from '../../network/tests/mockData/taskHistory';

test('getTaskContributors returns an ordered result & excludes the username (2nd arg)', () => {
  expect(getTaskContributors(history.taskHistory, 'geochica')).toEqual(['test_user', 'user_123']);
  expect(getTaskContributors(revertedBadImagery.taskHistory, 'geochica')).toEqual([
    'test_user',
    'user_1',
    'user_11',
  ]);
  expect(getTaskContributors(revertedBadImagery.taskHistory, 'user_1')).toEqual([
    'test_user',
    'user_11',
  ]);
});
