import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { getYear } from 'date-fns';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { OrganisationUsageLevel } from '../orgUsageLevel';

describe('OrganisationUsageLevel', () => {
  const currentYear = getYear(new Date());
  it('with level 1', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={100} orgName="My organization" type="FREE" />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1',
    );
    expect(container.querySelector('h1').style.fontSize).toBe('8rem');
    expect(within(container.querySelector('h1')).getByText('1')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 2/)).toBeInTheDocument();
    expect(screen.getByText(`Estimated level by the end of ${currentYear}`)).toBeInTheDocument();
    expect(screen.queryByText(/tier/)).not.toBeInTheDocument();
  });

  it('with level 1, under tier, but accessed by a normal user ', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={100}
          orgName="My organization"
          type="FULL_FEE"
          userIsOrgManager={false}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1',
    );
    expect(container.querySelector('h1').style.fontSize).toBe('8rem');
    expect(within(container.querySelector('h1')).getByText('1')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 2/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated level by the end of/)).toBeInTheDocument();
    expect(screen.queryByText(/tier/)).not.toBeInTheDocument();
  });

  it('with level 1, under tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={100}
          orgName="My organization"
          type="FULL_FEE"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative f1 tc w-100 dib ttu red barlow-condensed ma0 pv2 mt3',
    );
    expect(within(container.querySelector('h1')).getByText('Free')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('Actions to reach the next tier')).toBeInTheDocument();
    expect(screen.getByText(`Estimated tier by the end of ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText(`Estimated cost by the end of ${currentYear}`)).toBeInTheDocument();
  });

  it('with level 1, under DISCOUNTED tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={100}
          orgName="My organization"
          type="DISCOUNTED"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative f1 tc w-100 dib ttu red barlow-condensed ma0 pv2 mt3',
    );
    expect(within(container.querySelector('h1')).getByText('Free')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('Actions to reach the next tier')).toBeInTheDocument();
    expect(screen.getByText(`Estimated tier by the end of ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText(`Estimated cost by the end of ${currentYear}`)).toBeInTheDocument();
  });

  it('with level 2', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={1451} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('2')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('14%');
    expect(screen.getByText('8,549')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 3/)).toBeInTheDocument();
  });

  it('with level 2, under tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={1451}
          orgName="My organization"
          type="FULL_FEE"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Low')).toBeTruthy();
    expect(screen.getByText('Actions to reach the next tier')).toBeInTheDocument();
    expect(screen.getByText(/Estimated cost by the end of/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated tier by the end of/)).toBeInTheDocument();
  });

  it('with level 3', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={17003} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('3')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('68%');
    expect(screen.getByText('7,997')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 4/)).toBeInTheDocument();
  });

  it('with level 3, under tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={17003}
          orgName="Another organization"
          type="FULL_FEE"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Medium')).toBeTruthy();
  });

  it('with level 4', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={30000} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('4')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('60%');
    expect(screen.getByText('20,000')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 5/)).toBeInTheDocument();
    expect(
      screen.queryByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).not.toBeInTheDocument();
  });

  it('with level 4, under tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={30000}
          orgName="Another organization"
          type="FULL_FEE"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('High')).toBeTruthy();
  });

  it('with level 5', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel completedActions={50000} orgName="Another organization" />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('5')).toBeTruthy();
    expect(screen.queryByText(/reach the level/)).not.toBeInTheDocument();
    expect(screen.getByText(/Another organization/)).toBeInTheDocument();
    expect(
      screen.getByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).toBeInTheDocument();
  });

  it('with level 5, under tier and accessed by an organisation manager', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={50000}
          orgName="Another organization"
          type="FULL_FEE"
          userIsOrgManager={true}
        />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Very High')).toBeTruthy();
    expect(screen.queryByText('Actions to reach the next tier')).not.toBeInTheDocument();
    expect(screen.queryByText(/Another organization/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).not.toBeInTheDocument();
  });

  it('with level 5, under tier, but accessed by a normal user', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationUsageLevel
          completedActions={50000}
          orgName="Another organization"
          type="FULL_FEE"
          userIsOrgManager={false}
        />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('5')).toBeTruthy();
    expect(screen.queryByText(/tier/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Very High/)).not.toBeInTheDocument();
    expect(screen.queryByText(/reach the level/)).not.toBeInTheDocument();
    expect(screen.queryByText(/reach the next tier/)).not.toBeInTheDocument();
    expect(screen.getByText(/Another organization/)).toBeInTheDocument();
    expect(
      screen.getByText(/It is the highest level an organization can be on Tasking Manager!/),
    ).toBeInTheDocument();
  });
});
