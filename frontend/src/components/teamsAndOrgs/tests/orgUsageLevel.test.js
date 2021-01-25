import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { OrganisationUsageLevel } from '../orgUsageLevel';

describe('OrganisationUsageLevel', () => {
  it('with level 1', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={100} orgName="My organization" />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1',
    );
    expect(container.querySelector('h1').style.fontSize).toBe('8rem');
    expect(screen.getByText(1)).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText(/My organization/)).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText(/organization level 1/)).toBeInTheDocument();
    expect(screen.getByText(/reach the level 2/)).toBeInTheDocument();
  });
  it('with level 2', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={1451} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(2)).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('14%');
    expect(screen.getByText(/Another organization/)).toBeInTheDocument();
    expect(screen.getByText('8,549')).toBeInTheDocument();
    expect(screen.getByText(/organization level 2/)).toBeInTheDocument();
    expect(screen.getByText(/reach the level 3/)).toBeInTheDocument();
  });
  it('with level 3', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={17003} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(3)).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('68%');
    expect(screen.getByText(/Another organization/)).toBeInTheDocument();
    expect(screen.getByText('7,997')).toBeInTheDocument();
    expect(screen.getByText(/organization level 3/)).toBeInTheDocument();
    expect(screen.getByText(/reach the level 4/)).toBeInTheDocument();
  });
  it('with level 4', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={30000} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(4)).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('60%');
    expect(screen.getByText('20,000')).toBeInTheDocument();
    expect(screen.getByText(/organization level 4/)).toBeInTheDocument();
    expect(screen.getByText(/reach the level 5/)).toBeInTheDocument();
    expect(
      screen.queryByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).not.toBeInTheDocument();
  });
  it('with level 5', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={50000} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(5)).toBeInTheDocument();
    expect(screen.getByText(/organization level 5/)).toBeInTheDocument();
    expect(screen.queryByText(/reach the level/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).toBeInTheDocument();
  });
});
