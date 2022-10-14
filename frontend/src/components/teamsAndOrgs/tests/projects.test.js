import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProviders } from '../../../utils/testWithIntl';
import { Projects } from '../projects';

it('renders loading placeholder when API is being fetched', () => {
  const { container } = render(
    <IntlProviders>
      <Projects userDetails={{ role: 'ADMIN' }} projects={[]} viewAllEndpoint="/view/all" />
    </IntlProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: /projects/i,
    }),
  ).toBeInTheDocument();
  expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(20);
});
