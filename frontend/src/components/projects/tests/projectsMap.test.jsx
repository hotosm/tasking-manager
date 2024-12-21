import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ProjectsMap } from '../projectsMap';

vi.mock('mapbox-gl/dist/mapbox-gl', () => ({
  supported: vi.fn(),
  Map: vi.fn(() => ({
    addControl: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
  })),
}));

test('displays WebGL not supported message', () => {
  render(
    <ReduxIntlProviders>
      <ProjectsMap state={{ mapResults: null }} />
    </ReduxIntlProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: 'WebGL Context Not Found',
    }),
  ).toBeInTheDocument();
});
