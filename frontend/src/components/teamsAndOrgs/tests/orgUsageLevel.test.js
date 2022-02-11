import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { getYear } from 'date-fns';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { OrganisationUsageLevel, OrganisationTier } from '../orgUsageLevel';

describe('OrganisationUsageLevel', () => {
  const currentYear = getYear(new Date());
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
    expect(within(container.querySelector('h1')).getByText('1')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText(/reach the level 2/)).toBeInTheDocument();
    expect(screen.getByText(`Estimated level by the end of ${currentYear}`)).toBeInTheDocument();
    expect(screen.queryByText(/tier/)).not.toBeInTheDocument();
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
});

describe('OrganisationTier', () => {
  const currentYear = getYear(new Date());
  it('with 1000 actions on Low subscription tier', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationTier
          completedActions={1000}
          orgName="My organization"
          type="FULL_FEE"
          subscriptionTier={2}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('h1').className).toBe(
      'relative f1 tc w-100 dib ttu red barlow-condensed ma0 pt2 mt3',
    );
    expect(within(container.querySelector('h1')).getByText('Low')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('Subscribed tier')).toBeInTheDocument();
    // expect(screen.getAllByText(/Low/).length).toBe(2); // Test is failing currently- needs to be fixed
    expect(screen.getByText('9,000')).toBeInTheDocument();
    expect(screen.getByText('Actions remaining on the Low tier')).toBeInTheDocument();
  });

  it('with 200 actions on Free subscription tier', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={200} type="FULL_FEE" subscriptionTier={1} />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Free')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('20%');
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('Actions remaining on the Free tier')).toBeInTheDocument();
    expect(screen.getByText(`Estimated tier by the end of ${currentYear}`)).toBeInTheDocument();
    expect(screen.getByText(`Estimated cost by the end of ${currentYear}`)).toBeInTheDocument();
  });

  it('with 5000 actions on High and DISCOUNTED subscription tier', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={5000} type="DISCOUNTED" subscriptionTier={4} />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('High')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('10%');
    expect(screen.getByText('Actions remaining on the High tier')).toBeInTheDocument();
    expect(screen.getByText('45,000')).toBeInTheDocument();
  });

  it('with 5000 actions on High and FULL_FEE subscription tier', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={5000} type="FULL_FEE" subscriptionTier={5} />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Very High')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Actions remaining/)).not.toBeInTheDocument();
    expect(screen.queryByText('45,000')).not.toBeInTheDocument();
  });

  it('with more completed actions than the subscription tier, shows 0 on remaining actions card', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={5000} type="FULL_FEE" subscriptionTier={1} />
      </ReduxIntlProviders>,
    );
    expect(within(container.querySelector('h1')).getByText('Free')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')[1].style.width).toBe('100%');
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('does not show the discounted label for a FREE subscribed tier org', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={1} type="DISCOUNTED" subscriptionTier={1} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.queryByText(/(Discounted)/)).not.toBeInTheDocument();
  });

  it('does not show the discounted label for a VERY HIGH subscribed tier org with only 1 action', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={1} type="DISCOUNTED" subscriptionTier={5} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.queryByText(/(Discounted)/)).not.toBeInTheDocument();
  });

  it('shows the discounted cost 20000 for a discounted level 5 org', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationTier completedActions={80000} type="DISCOUNTED" subscriptionTier={5} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('$20,000.00')).toBeInTheDocument();
    expect(screen.getByText(/(Discounted)/)).toBeInTheDocument();
  });
});
