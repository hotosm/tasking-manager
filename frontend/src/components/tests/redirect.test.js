import { waitFor } from '@testing-library/react';
import { Redirect } from '../redirect';
import { createComponentWithMemoryRouter } from '../../utils/testWithIntl';

test('should redirect to the projects page', async () => {
  const { router } = createComponentWithMemoryRouter(<Redirect to="/projects/:id" />, {
    route: '/project/:id',
    entryRoute: '/project/123',
  });
  await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123'));
});
