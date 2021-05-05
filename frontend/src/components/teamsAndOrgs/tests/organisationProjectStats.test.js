import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../../utils/testWithIntl';
import { OrganisationProjectStats } from '../organisationProjectStats';

test('OrganisationProjectStats renders correct values and labels', () => {
  let projects = {
    published: 30,
    recent: 9,
    stale: 12,
  };
  render(
    <IntlProviders>
      <OrganisationProjectStats projects={projects} />
    </IntlProviders>,
  );
  expect(screen.getByText(30)).toBeInTheDocument();
  expect(screen.getByText(/Projects published/)).toBeInTheDocument();
  expect(screen.getByText(9)).toBeInTheDocument();
  expect(screen.getByText(/Projects created this year/)).toBeInTheDocument();
  expect(screen.getByText(12)).toBeInTheDocument();
  expect(screen.getByText(/Stale projects in the last 6 months/)).toBeInTheDocument();
});
