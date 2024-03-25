import { setDayOfYear, format } from 'date-fns';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { OrganisationProjectStats } from '../organisationProjectStats';

describe('OrganisationProjectStats', () => {
  const firstDayOfYear = format(setDayOfYear(new Date(), 1), 'yyyy-MM-dd');
  it('renders correct values and labels', () => {
    let projects = {
      draft: 6,
      archived: 4,
      published: 20,
      recent: 9,
      stale: 12,
    };
    renderWithRouter(
      <IntlProviders>
        <OrganisationProjectStats projects={projects} orgName="HOT" />
      </IntlProviders>,
    );
    expect(screen.getByText('30 projects created')).toBeInTheDocument();
    expect(screen.getByText('Published').href).toContain(
      '/manage/projects/?managedByMe=1&status=PUBLISHED&organisation=HOT',
    );
    expect(screen.getByText(/20 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Draft/).href).toContain(
      '/manage/projects/?status=DRAFT&organisation=HOT',
    );
    expect(screen.getByText(/6 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Stale/).href).toContain('/manage/projects/?stale=1&organisation=HOT');
    expect(screen.getByText(/12 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Created this year/)).toBeInTheDocument(
      `/manage/projects/?createdFrom=${firstDayOfYear}&status=ARCHIVED,PUBLISHED&organisation=HOT`,
    );
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
    renderWithRouter(
      <IntlProviders>
        <OrganisationProjectStats projects={projects} orgName="Another Org" />
      </IntlProviders>,
    );
    expect(screen.getByText(/10 projects created/)).toBeInTheDocument();
    expect(screen.getByText('Published').href).toContain(
      '/manage/projects/?managedByMe=1&status=PUBLISHED&organisation=Another%20Org',
    );
    expect(screen.getByText(/9 projects/)).toBeInTheDocument();
    expect(screen.getByText(/Draft/).href).toContain(
      '/manage/projects/?status=DRAFT&organisation=Another%20Org',
    );
    expect(screen.getByText(/1 project/)).toBeInTheDocument();
    expect(screen.getByText(/Stale/).href).toContain(
      '/manage/projects/?stale=1&organisation=Another%20Org',
    );
    expect(screen.getByText(/Created this year/)).toBeInTheDocument(
      `/manage/projects/?createdFrom=${firstDayOfYear}&status=ARCHIVED,PUBLISHED&organisation=Another%20Org`,
    );
    expect(screen.getByText('10 projects')).toBeInTheDocument();
  });
});
