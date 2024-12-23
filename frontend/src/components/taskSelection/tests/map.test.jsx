
import { render, screen } from '@testing-library/react';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TasksMap } from '../map';

test('displays WebGL not supported message', () => {
  render(
    <ReduxIntlProviders>
      <TasksMap state={{ mapResults: null }} />
    </ReduxIntlProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: 'WebGL Context Not Found',
    }),
  ).toBeInTheDocument();
});
