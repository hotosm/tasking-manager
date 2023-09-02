import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TasksMap } from '../map';

jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  supported: jest.fn(),
  Map: jest.fn(() => ({
    addControl: jest.fn(),
    on: jest.fn(),
    remove: jest.fn(),
  })),
}));

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
