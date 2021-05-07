import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../../utils/testWithIntl';
import { OrganisationProjectStats } from '../organisationProjectStats';

describe('OrganisationProjectStats', () => {
  it('renders correct values and labels', () => {
    let projects = {
      draft: 6,
      archived: 4,
      published: 20,
      recent: 9,
      stale: 12,
    };
    render(
      <IntlProviders>
        <OrganisationProjectStats projects={projects} />
      </IntlProviders>,
    );
    expect(screen.getByText(/30 created projects/)).toBeInTheDocument();
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/20 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Archived/)).toBeInTheDocument();
    expect(screen.getByText(/4 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Draft/)).toBeInTheDocument();
    expect(screen.getByText(/6 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Stale/)).toBeInTheDocument();
    expect(screen.getByText(/12 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Recent/)).toBeInTheDocument();
    expect(screen.getByText(/9 projects/)).toBeInTheDocument();
  });

  it('does not render empty values: archived and stale', () => {
    let projects = {
      draft: 1,
      archived: 0,
      published: 9,
      recent: 10,
      stale: 0,
    };
    render(
      <IntlProviders>
        <OrganisationProjectStats projects={projects} />
      </IntlProviders>,
    );
    expect(screen.getByText(/10 created projects/)).toBeInTheDocument();
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/9 projects/)).toBeInTheDocument();
    expect(screen.queryByText(/Archived/)).not.toBeInTheDocument();
    expect(screen.getByText(/Draft/)).toBeInTheDocument();
    expect(screen.getByText(/1 projects/)).toBeInTheDocument();
    expect(screen.queryByText(/Stale/)).not.toBeInTheDocument();
    expect(screen.getByText(/Recent/)).toBeInTheDocument();
    expect(screen.getByText(/10 projects/)).toBeInTheDocument();
  });
});
