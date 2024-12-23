
import { render, screen } from '@testing-library/react';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ProjectsMap } from '../projectsMap';

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
