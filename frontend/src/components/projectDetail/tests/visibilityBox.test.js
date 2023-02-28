import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { IntlProviders } from '../../../utils/testWithIntl';
import { ProjectVisibilityBox } from '../visibilityBox';

it('should display chip for private project', () => {
  render(
    <IntlProviders>
      <ProjectVisibilityBox />
    </IntlProviders>,
  );
  expect(screen.getByText(/private/i)).toBeInTheDocument();
  expect(screen.getByTitle('lock')).toBeInTheDocument();
});
